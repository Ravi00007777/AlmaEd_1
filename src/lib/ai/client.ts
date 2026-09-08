import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface AIClient {
  chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIResponse>;
  streamChat(messages: AIMessage[], options?: AIChatOptions): AsyncIterable<string>;
}

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  functions?: AIFunction[];
  functionCall?: 'auto' | { name: string };
}

export interface AIFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

// ============================================
// OPENAI CLIENT
// ============================================

class OpenAIClient implements AIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async chat(messages: AIMessage[], options: AIChatOptions = {}): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      response_format: options.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
      tools: options.functions?.map((f) => ({
        type: 'function',
        function: f,
      })),
      tool_choice: options.functionCall as any,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      model: response.model,
    };
  }

  async *streamChat(messages: AIMessage[], options: AIChatOptions = {}): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}

// ============================================
// ANTHROPIC CLIENT
// ============================================

class AnthropicClient implements AIClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async chat(messages: AIMessage[], options: AIChatOptions = {}): Promise<AIResponse> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      system: systemMessage?.content,
      messages: userMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
    });

    const content = response.content.find((c) => c.type === 'text')?.text || '';

    return {
      content,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
    };
  }

  async *streamChat(messages: AIMessage[], options: AIChatOptions = {}): AsyncIterable<string> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const stream = await this.client.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      system: systemMessage?.content,
      messages: userMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}

// ============================================
// GEMINI CLIENT
// ============================================

class GeminiClient implements AIClient {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  async chat(messages: AIMessage[], options: AIChatOptions = {}): Promise<AIResponse> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const chat = this.model.startChat({
      history: userMessages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4000,
      },
    });

    const lastMessage = userMessages[userMessages.length - 1];
    const prompt = systemMessage ? `${systemMessage.content}\n\n${lastMessage.content}` : lastMessage.content;

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const content = response.text();

    return {
      content,
      usage: {
        promptTokens: 0, // Not directly available
        completionTokens: 0,
        totalTokens: 0,
      },
      model: 'gemini-1.5-pro',
    };
  }

  async *streamChat(messages: AIMessage[], options: AIChatOptions = {}): AsyncIterable<string> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const chat = this.model.startChat({
      history: userMessages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4000,
      },
    });

    const lastMessage = userMessages[userMessages.length - 1];
    const prompt = systemMessage ? `${systemMessage.content}\n\n${lastMessage.content}` : lastMessage.content;

    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      const content = chunk.text();
      if (content) yield content;
    }
  }
}

// ============================================
// AI FACTORY
// ============================================

function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER as AIProvider || 'openai';
  return provider;
}

function getApiKey(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY || '';
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
    case 'gemini':
      return process.env.GEMINI_API_KEY || '';
  }
}

let aiClientInstance: AIClient | null = null;

export function getAIClient(): AIClient {
  if (aiClientInstance) return aiClientInstance;

  const provider = getProvider();
  const apiKey = getApiKey(provider);

  if (!apiKey) {
    throw new Error(`No API key found for AI provider: ${provider}`);
  }

  switch (provider) {
    case 'openai':
      aiClientInstance = new OpenAIClient(apiKey);
      break;
    case 'anthropic':
      aiClientInstance = new AnthropicClient(apiKey);
      break;
    case 'gemini':
      aiClientInstance = new GeminiClient(apiKey);
      break;
  }

  return aiClientInstance;
}

export function resetAIClient(): void {
  aiClientInstance = null;
}

// ============================================
// PROMPT TEMPLATES
// ============================================

export const AI_PROMPTS = {
  SYLLABUS_ANALYZER: {
    system: `You are an expert curriculum analyst for Indian education boards (CBSE, ICSE, State Boards) and competitive exams (JEE, NEET). 
Analyze the provided syllabus content and extract a structured curriculum with subjects, chapters, topics, and estimated study hours.`,
    user: (content: string) => `
Analyze this syllabus content and return a JSON object with the following structure:

{
  "subjects": [
    {
      "name": "Subject Name",
      "chapters": [
        {
          "name": "Chapter Name",
          "topics": [
            {
              "name": "Topic Name",
              "subtopics": ["Subtopic 1", "Subtopic 2"],
              "difficulty": 1-5,
              "estimatedHours": number,
              "prerequisites": ["topic names"]
            }
          ],
          "estimatedHours": number
        }
      ],
      "examDate": "YYYY-MM-DD or null",
      "totalEstimatedHours": number
    }
  ],
  "keyInsights": ["insight 1", "insight 2"],
  "recommendedOrder": ["subject1", "subject2"]
}

Syllabus content:
${content}
`,
  },

  STUDY_PLAN_GENERATOR: {
    system: `You are an expert study planner for Indian students preparing for board exams and competitive exams (JEE, NEET).
Create a detailed weekly study plan considering the syllabus, exam dates, available study time, and teacher/student availability.`,
    user: (params: {
      syllabus: any;
      examDates: Record<string, string>;
      classesPerWeek: number;
      durationMinutes: number;
      studentAvailability: any[];
      teacherAvailability: any[];
      currentDate: string;
      weeksUntilExam: number;
    }) => `
Create a weekly study plan for ${params.weeksUntilExam} weeks until exams.

Syllabus: ${JSON.stringify(params.syllabus, null, 2)}
Exam Dates: ${JSON.stringify(params.examDates)}
Classes per week: ${params.classesPerWeek}
Class duration: ${params.durationMinutes} minutes
Student availability: ${JSON.stringify(params.studentAvailability)}
Teacher availability: ${JSON.stringify(params.teacherAvailability)}
Current date: ${params.currentDate}

Return a JSON object with weekly breakdown:
{
  "weeks": [
    {
      "weekNumber": 1,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "focus": "Main focus for this week",
      "classes": [
        {
          "day": "MONDAY",
          "time": "19:00",
          "duration": 60,
          "subject": "Mathematics",
          "topic": "Quadratic Equations",
          "type": "CLASS|SELF_STUDY|ASSIGNMENT|TEST",
          "details": "Description of what will be covered"
        }
      ],
      "assignments": [
        {
          "subject": "Mathematics",
          "topic": "Quadratic Equations",
          "dueDate": "YYYY-MM-DD",
          "estimatedHours": 2
        }
      ],
      "selfStudyHours": 10,
      "revisionTopics": ["topic names"],
      "milestones": ["milestone descriptions"]
    }
  ],
  "totalClasses": number,
  "totalSelfStudyHours": number,
  "bufferDays": number
}
`,
  },

  TEACHER_MATCHER: {
    system: `You are an expert teacher-student matching system for a tutoring marketplace.
Analyze student needs and teacher profiles to calculate compatibility scores and provide detailed reasoning.`,
    user: (params: {
      student: any;
      teachers: any[];
      weights: Record<string, number>;
    }) => `
Match this student with the best teachers.

Student Profile:
${JSON.stringify(params.student, null, 2)}

Available Teachers:
${JSON.stringify(params.teachers, null, 2)}

Matching Weights:
${JSON.stringify(params.weights, null, 2)}

For each teacher, calculate a compatibility score (0-100) and provide detailed breakdown.
Return JSON array of matches sorted by score descending:
[
  {
    "teacherId": "teacher_id",
    "score": 94,
    "breakdown": {
      "subjectMatch": 25,
      "gradeMatch": 15,
      "boardMatch": 10,
      "availabilityOverlap": 18,
      "budgetCompatibility": 10,
      "teacherRating": 10,
      "teacherExperience": 5,
      "languageMatch": 5,
      "demoFeedback": 6
    },
    "explanation": "Excellent subject match (Math+Physics), 90% availability overlap Mon/Wed/Fri 7-9PM, within budget, 8 years JEE experience",
    "pros": ["Perfect subject alignment", "Schedule aligns well", "Proven JEE results"],
    "cons": ["Slightly higher rate", "Limited weekend slots"]
  }
]
`,
  },

  PROGRESS_ANALYZER: {
    system: `You are an AI academic analyst for personalized learning. Analyze student performance data to identify strengths, weaknesses, and provide actionable recommendations.`,
    user: (params: {
      student: any;
      attendance: any[];
      assignments: any[];
      tests: any[];
      teacherFeedback: any[];
      studyPlanAdherence: number;
    }) => `
Analyze this student's performance and provide insights.

Student: ${JSON.stringify(params.student, null, 2)}
Attendance: ${JSON.stringify(params.attendance, null, 2)}
Assignments: ${JSON.stringify(params.assignments, null, 2)}
Tests: ${JSON.stringify(params.tests, null, 2)}
Teacher Feedback: ${JSON.stringify(params.teacherFeedback, null, 2)}
Study Plan Adherence: ${params.studyPlanAdherence}%

Return JSON:
{
  "overallScore": 75,
  "subjectScores": { "Mathematics": 80, "Physics": 65 },
  "weakTopics": [
    { "topic": "Calculus", "subject": "Mathematics", "severity": "HIGH", "evidence": "3/5 assignments below 60%" }
  ],
  "strongTopics": [
    { "topic": "Algebra", "subject": "Mathematics", "evidence": "Consistently scoring 85%+" }
  ],
  "trends": {
    "improving": ["Algebra", "Mechanics"],
    "declining": ["Calculus", "Electrodynamics"],
    "stable": ["Geometry"]
  },
  "riskFactors": [
    "Missed 3 classes last month",
    "Assignment submission rate dropped to 60%"
  ],
  "recommendations": [
    { "priority": "HIGH", "action": "Schedule 2 revision sessions for Calculus this week", "reason": "Foundation needed for Integration" },
    { "priority": "MEDIUM", "action": "Add daily 30-min problem practice for Electrodynamics", "reason": "Conceptual gaps identified" }
  ],
  "nextMilestones": [
    { "date": "2024-12-25", "event": "Mock Test - Physics", "preparation": "Focus on Mechanics revision" }
  ]
}
`,
  },

  ASSIGNMENT_GENERATOR: {
    system: `You are an expert question paper setter for Indian curriculum (CBSE, ICSE, JEE, NEET).
Generate high-quality questions with varying difficulty levels, clear marking schemes, and model answers.`,
    user: (params: {
      subject: string;
      topic: string;
      subtopics: string[];
      difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
      questionCount: number;
      marksDistribution: Record<string, number>;
      examType: 'BOARD' | 'JEE' | 'NEET' | 'PRACTICE';
      previousQuestions?: string[];
    }) => `
Generate ${params.questionCount} questions for ${params.subject} - ${params.topic}.

Subtopics: ${params.subtopics.join(', ')}
Difficulty: ${params.difficulty}
Exam Type: ${params.examType}
Marks Distribution: ${JSON.stringify(params.marksDistribution)}
${params.previousQuestions ? `Avoid similar to: ${params.previousQuestions.join('; ')}` : ''}

Return JSON array of questions:
[
  {
    "id": "q1",
    "type": "MCQ|SHORT_ANSWER|LONG_ANSWER|NUMERICAL|ASSERTION_REASON",
    "question": "Full question text",
    "marks": 5,
    "difficulty": 1-5,
    "topic": "Quadratic Equations",
    "subtopic": "Nature of Roots",
    "options": ["A", "B", "C", "D"], // for MCQ
    "correctAnswer": "A",
    "modelAnswer": "Step-by-step solution",
    "keyPoints": ["point1", "point2"],
    "commonMistakes": ["mistake1", "mistake2"],
    "hints": ["hint1", "hint2"]
  }
]
`,
  },

  LESSON_PLANNER: {
    system: `You are an expert lesson planner for 1-on-1 tutoring sessions.
Create detailed lesson plans with objectives, activities, timings, and assessment methods.`,
    user: (params: {
      subject: string;
      topic: string;
      durationMinutes: number;
      studentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
      previousTopics: string[];
      learningObjectives: string[];
      availableResources: string[];
    }) => `
Create a ${params.durationMinutes}-minute lesson plan for ${params.subject} - ${params.topic}.

Student Level: ${params.studentLevel}
Previous Topics: ${params.previousTopics.join(', ')}
Learning Objectives: ${params.learningObjectives.join(', ')}
Available Resources: ${params.availableResources.join(', ')}

Return JSON:
{
  "objectives": ["objective1", "objective2"],
  "materials": ["material1", "material2"],
  "timeline": [
    { "time": 5, "activity": "Warm-up/Review previous topic", "method": "Quick quiz" },
    { "time": 15, "activity": "Introduce new concept", "method": "Direct instruction with examples" },
    { "time": 20, "activity": "Guided practice", "method": "Work through problems together" },
    { "time": 15, "activity": "Independent practice", "method": "Student solves problems" },
    { "time": 5, "activity": "Wrap-up & homework assignment", "method": "Summary + assign practice" }
  ],
  "assessment": {
    "formative": ["In-class problems", "Exit ticket question"],
    "summative": "Homework assignment"
  },
  "differentiation": {
    "support": "Additional scaffolded examples for struggling students",
    "extension": "Challenge problems for advanced students"
  },
  "homework": {
    "questions": ["q1", "q2"],
    "estimatedTime": 30,
    "resources": ["textbook pg 45-47", "video link"]
  }
}
`,
  },

  STUDENT_REPORT: {
    system: `You are an academic report generator for parents. Create clear, actionable monthly progress reports.`,
    user: (params: {
      student: any;
      period: { start: string; end: string };
      attendance: any;
      assignments: any;
      testScores: any;
      teacherComments: string[];
      aiInsights: any;
    }) => `
Generate a monthly progress report for ${params.student.name} (${params.student.grade} ${params.student.board}).

Period: ${params.period.start} to ${params.period.end}
Attendance: ${JSON.stringify(params.attendance)}
Assignments: ${JSON.stringify(params.assignments)}
Test Scores: ${JSON.stringify(params.testScores)}
Teacher Comments: ${params.teacherComments.join('; ')}
AI Insights: ${JSON.stringify(params.aiInsights)}

Return JSON:
{
  "summary": "Brief 2-3 sentence overview",
  "attendance": { "classesHeld": 12, "classesAttended": 10, "percentage": 83 },
  "academicPerformance": {
    "overallGrade": "B+",
    "subjectGrades": { "Mathematics": "A-", "Physics": "B" },
    "improvementAreas": ["Calculus", "Electrodynamics"],
    "strengths": ["Algebra", "Mechanics"]
  },
  "assignments": { "completed": 8, "total": 10, "averageScore": 78 },
  "testPerformance": { "averageScore": 72, "trend": "IMPROVING" },
  "teacherFeedback": "Consolidated feedback...",
  "recommendations": [
    "Focus on Calculus fundamentals this month",
    "Attempt 2 JEE mock tests per week"
  ],
  "nextMonthFocus": ["Integration", "Wave Optics", "Mock Tests"],
  "parentActionItems": [
    "Ensure student attends all scheduled classes",
    "Review mock test results together"
  ]
}
`,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function callAI(
  prompt: { system: string; user: string },
  options: AIChatOptions = {}
): Promise<AIResponse> {
  const client = getAIClient();
  return client.chat(
    [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    options
  );
}

export async function callAIWithJSON(
  prompt: { system: string; user: string },
  options: AIChatOptions = {}
): Promise<any> {
  const response = await callAI(prompt, {
    ...options,
    responseFormat: 'json_object',
    temperature: options.temperature ?? 0.3,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse AI JSON response:', response.content);
    throw new Error('AI returned invalid JSON');
  }
}

export async function streamAI(
  prompt: { system: string; user: string },
  options: AIChatOptions = {}
): Promise<AsyncIterable<string>> {
  const client = getAIClient();
  return client.streamChat(
    [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    options
  );
}