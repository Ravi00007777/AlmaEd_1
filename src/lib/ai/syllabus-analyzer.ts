import { callAIWithJSON, AI_PROMPTS } from './client';
import { prisma } from '@/lib/db/prisma';

export interface SyllabusAnalysisResult {
  subjects: Array<{
    name: string;
    chapters: Array<{
      name: string;
      topics: Array<{
        name: string;
        subtopics: string[];
        difficulty: number;
        estimatedHours: number;
        prerequisites: string[];
      }>;
      estimatedHours: number;
    }>;
    examDate: string | null;
    totalEstimatedHours: number;
  }>;
  keyInsights: string[];
  recommendedOrder: string[];
}

export interface StudyPlanResult {
  weeks: Array<{
    weekNumber: number;
    startDate: string;
    endDate: string;
    focus: string;
    classes: Array<{
      day: string;
      time: string;
      duration: number;
      subject: string;
      topic: string;
      type: 'CLASS' | 'SELF_STUDY' | 'ASSIGNMENT' | 'TEST';
      details: string;
    }>;
    assignments: Array<{
      subject: string;
      topic: string;
      dueDate: string;
      estimatedHours: number;
    }>;
    selfStudyHours: number;
    revisionTopics: string[];
    milestones: string[];
  }>;
  totalClasses: number;
  totalSelfStudyHours: number;
  bufferDays: number;
}

export async function analyzeSyllabus(
  syllabusId: string,
  extractedText: string
): Promise<SyllabusAnalysisResult> {
  // Update status to processing
  await prisma.syllabus.update({
    where: { id: syllabusId },
    data: { processingStatus: 'PROCESSING' },
  });

  try {
    const result = await callAIWithJSON(
      {
        system: AI_PROMPTS.SYLLABUS_ANALYZER.system,
        user: AI_PROMPTS.SYLLABUS_ANALYZER.user(extractedText),
      },
      { temperature: 0.2, maxTokens: 6000 }
    );

    // Validate and clean the result
    const validatedResult = validateSyllabusAnalysis(result);

    // Update syllabus with analysis
    await prisma.syllabus.update({
      where: { id: syllabusId },
      data: {
        parsedData: validatedResult as any,
        aiAnalysis: {
          analyzedAt: new Date().toISOString(),
          model: 'gpt-4o',
          confidence: 0.9,
        },
        subjects: validatedResult.subjects.map((s) => s.name),
        examDates: Object.fromEntries(
          validatedResult.subjects
            .filter((s) => s.examDate)
            .map((s) => [s.name, s.examDate!])
        ),
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Create syllabus topics for tracking
    for (const subject of validatedResult.subjects) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          await prisma.syllabusTopic.create({
            data: {
              syllabusId,
              subject: subject.name,
              chapter: chapter.name,
              topic: topic.name,
              subtopic: topic.subtopics.join(', '),
              difficulty: topic.difficulty,
              estimatedHours: topic.estimatedHours,
              order: 0, // Will be set based on recommended order
            },
          });
        }
      }
    }

    return validatedResult;
  } catch (error) {
    await prisma.syllabus.update({
      where: { id: syllabusId },
      data: { processingStatus: 'FAILED' },
    });
    throw error;
  }
}

function validateSyllabusAnalysis(result: any): SyllabusAnalysisResult {
  if (!result.subjects || !Array.isArray(result.subjects)) {
    throw new Error('Invalid syllabus analysis: missing subjects array');
  }

  return {
    subjects: result.subjects.map((s: any) => ({
      name: s.name || 'Unknown Subject',
      chapters: (s.chapters || []).map((c: any) => ({
        name: c.name || 'Unknown Chapter',
        topics: (c.topics || []).map((t: any) => ({
          name: t.name || 'Unknown Topic',
          subtopics: Array.isArray(t.subtopics) ? t.subtopics : [],
          difficulty: Math.min(5, Math.max(1, t.difficulty || 3)),
          estimatedHours: Math.max(0.5, t.estimatedHours || 1),
          prerequisites: Array.isArray(t.prerequisites) ? t.prerequisites : [],
        })),
        estimatedHours: Math.max(1, c.estimatedHours || 5),
      })),
      examDate: s.examDate || null,
      totalEstimatedHours: Math.max(1, s.totalEstimatedHours || 10),
    })),
    keyInsights: Array.isArray(result.keyInsights) ? result.keyInsights : [],
    recommendedOrder: Array.isArray(result.recommendedOrder) ? result.recommendedOrder : [],
  };
}

export async function generateStudyPlan(
  studentId: string,
  options: {
    syllabusId: string;
    teacherId?: string;
    examDate?: Date;
    classesPerWeek: number;
    durationMinutes: number;
    startDate?: Date;
  }
): Promise<StudyPlanResult> {
  const [syllabus, student, teacher] = await Promise.all([
    prisma.syllabus.findUnique({
      where: { id: options.syllabusId },
      include: { student: true },
    }),
    prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, availability: true },
    }),
    options.teacherId
      ? prisma.teacher.findUnique({
          where: { id: options.teacherId },
          include: { user: true, availability: true },
        })
      : Promise.resolve(null),
  ]);

  if (!syllabus || !student) {
    throw new Error('Syllabus or student not found');
  }

  const parsedSyllabus = syllabus.parsedData as unknown as SyllabusAnalysisResult;
  const examDates = syllabus.examDates as unknown as Record<string, string> || {};
  const targetExamDate = options.examDate || student.examDate;

  const weeksUntilExam = targetExamDate
    ? Math.ceil((targetExamDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
    : 12;

  const result = await callAIWithJSON(
    {
      system: AI_PROMPTS.STUDY_PLAN_GENERATOR.system,
      user: AI_PROMPTS.STUDY_PLAN_GENERATOR.user({
        syllabus: parsedSyllabus,
        examDates,
        classesPerWeek: options.classesPerWeek,
        durationMinutes: options.durationMinutes,
        studentAvailability: student.availability,
        teacherAvailability: teacher?.availability || [],
        currentDate: formatDate(new Date()),
        weeksUntilExam,
      }),
    },
    { temperature: 0.3, maxTokens: 8000 }
  );

  const validatedPlan = validateStudyPlan(result);

  // Save study plan
  await prisma.studyPlan.upsert({
    where: { studentId },
    create: {
      studentId,
      weeks: validatedPlan as any,
      generatedAt: new Date(),
      version: 1,
      isActive: true,
    },
    update: {
      weeks: validatedPlan as any,
      generatedAt: new Date(),
      version: { increment: 1 },
      isActive: true,
    },
  });

  return validatedPlan;
}

function validateStudyPlan(result: any): StudyPlanResult {
  if (!result.weeks || !Array.isArray(result.weeks)) {
    throw new Error('Invalid study plan: missing weeks array');
  }

  return {
    weeks: result.weeks.map((w: any) => ({
      weekNumber: w.weekNumber || 1,
      startDate: w.startDate || '',
      endDate: w.endDate || '',
      focus: w.focus || '',
      classes: (w.classes || []).map((c: any) => ({
        day: c.day || 'MONDAY',
        time: c.time || '19:00',
        duration: c.duration || 60,
        subject: c.subject || '',
        topic: c.topic || '',
        type: c.type || 'CLASS',
        details: c.details || '',
      })),
      assignments: (w.assignments || []).map((a: any) => ({
        subject: a.subject || '',
        topic: a.topic || '',
        dueDate: a.dueDate || '',
        estimatedHours: a.estimatedHours || 1,
      })),
      selfStudyHours: w.selfStudyHours || 0,
      revisionTopics: Array.isArray(w.revisionTopics) ? w.revisionTopics : [],
      milestones: Array.isArray(w.milestones) ? w.milestones : [],
    })),
    totalClasses: result.totalClasses || 0,
    totalSelfStudyHours: result.totalSelfStudyHours || 0,
    bufferDays: result.bufferDays || 0,
  };
}

export async function regenerateStudyPlan(
  studentId: string,
  reason: string
): Promise<StudyPlanResult> {
  const studyPlan = await prisma.studyPlan.findUnique({
    where: { studentId },
  });

  if (!studyPlan) {
    throw new Error('No existing study plan found');
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { syllabus: true, availability: true },
  });

  if (!student || !student.syllabus) {
    throw new Error('Student or syllabus not found');
  }

  // Get current progress to inform regeneration
  const progress = await prisma.studentProgress.findMany({
    where: { studentId },
  });

  const completedTopics = progress
    .filter((p) => p.classesAttended > 0)
    .map((p) => `${p.subject}: ${p.topic}`);

  const weakTopics = progress.flatMap((p) => p.weakTopics || []);

  // Regenerate with context
  const result = await callAIWithJSON(
    {
      system: AI_PROMPTS.STUDY_PLAN_GENERATOR.system,
      user: `${AI_PROMPTS.STUDY_PLAN_GENERATOR.user({
        syllabus: student.syllabus.parsedData,
        examDates: student.syllabus.examDates as Record<string, string> || {},
        classesPerWeek: 3,
        durationMinutes: 60,
        studentAvailability: student.availability,
        teacherAvailability: [],
        currentDate: formatDate(new Date()),
        weeksUntilExam: 12,
      })}

Additional context for regeneration:
- Reason: ${reason}
- Completed topics: ${completedTopics.join(', ')}
- Weak topics needing review: ${weakTopics.join(', ')}
- Current progress: ${progress.length} topics tracked

Please adjust the plan to address weak areas and build on completed topics.`,
    },
    { temperature: 0.3, maxTokens: 8000 }
  );

  const validatedPlan = validateStudyPlan(result);

  await prisma.studyPlan.update({
    where: { studentId },
    data: {
      weeks: validatedPlan as any,
      generatedAt: new Date(),
      version: { increment: 1 },
      isActive: true,
    },
  });

  return validatedPlan;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}