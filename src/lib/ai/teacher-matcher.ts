import { callAIWithJSON, AI_PROMPTS } from './client';
import { prisma } from '@/lib/db/prisma';
import { teacherQueries } from '@/lib/db/extensions';

export interface TeacherMatchResult {
  teacherId: string;
  score: number;
  breakdown: {
    subjectMatch: number;
    gradeMatch: number;
    boardMatch: number;
    availabilityOverlap: number;
    budgetCompatibility: number;
    teacherRating: number;
    teacherExperience: number;
    languageMatch: number;
    demoFeedback: number;
  };
  explanation: string;
  pros: string[];
  cons: string[];
}

export interface MatchingWeights {
  subjectMatch: number;
  gradeMatch: number;
  boardMatch: number;
  availabilityOverlap: number;
  budgetCompatibility: number;
  teacherRating: number;
  teacherExperience: number;
  languageMatch: number;
  demoFeedback: number;
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  subjectMatch: 25,
  gradeMatch: 15,
  boardMatch: 10,
  availabilityOverlap: 20,
  budgetCompatibility: 10,
  teacherRating: 10,
  teacherExperience: 5,
  languageMatch: 5,
  demoFeedback: 10,
};

export async function findTeacherMatches(
  studentId: string,
  options: {
    subject?: string;
    limit?: number;
    weights?: Partial<MatchingWeights>;
  } = {}
): Promise<TeacherMatchResult[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      syllabus: true,
      availability: true,
      teacherAssignments: { where: { status: 'ACTIVE' }, include: { teacher: true } },
    },
  });

  if (!student) throw new Error('Student not found');

  // Get already assigned teachers to exclude
  const assignedTeacherIds = student.teacherAssignments.map((a) => a.teacherId);

  // Merge weights with defaults
  const weights: MatchingWeights = {
    ...DEFAULT_WEIGHTS,
    ...options.weights,
  };

  // Get available teachers
  const teachers = await teacherQueries.findVerified({
    subjects: student.syllabus ? (student.syllabus.subjects as string[]) : [options.subject!].filter(Boolean),
    grades: [student.grade],
    boards: [student.board],
    maxHourlyRate: student.monthlyBudget
      ? Number(student.monthlyBudget) / (student.preferredDuration || 60) / 4 * 1.5 // rough estimate
      : undefined,
  });

  // Filter out assigned teachers
  const availableTeachers = teachers.filter((t) => !assignedTeacherIds.includes(t.id));

  if (availableTeachers.length === 0) {
    return [];
  }

  // Calculate rule-based scores for all teachers
  const ruleBasedMatches = availableTeachers.map((teacher) =>
    calculateRuleBasedMatch(student, teacher, weights)
  );

  // Sort by score and take top candidates for AI refinement
  const topCandidates = ruleBasedMatches
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(options.limit || 10, 10));

  // Use AI to refine top matches
  if (topCandidates.length > 0) {
    return await refineWithAI(student, topCandidates, weights);
  }

  return topCandidates;
}

function calculateRuleBasedMatch(
  student: any,
  teacher: any,
  weights: MatchingWeights
): TeacherMatchResult {
  let score = 0;
  const breakdown = {
    subjectMatch: 0,
    gradeMatch: 0,
    boardMatch: 0,
    availabilityOverlap: 0,
    budgetCompatibility: 0,
    teacherRating: 0,
    teacherExperience: 0,
    languageMatch: 0,
    demoFeedback: 0,
  };

  // Subject match (25%)
  const studentSubjects = student.syllabus?.subjects as string[] || [];
  const teacherSubjects = teacher.subjects || [];
  const subjectOverlap = studentSubjects.filter((s: string) => teacherSubjects.includes(s)).length;
  breakdown.subjectMatch = Math.min(weights.subjectMatch, (subjectOverlap / Math.max(studentSubjects.length, 1)) * weights.subjectMatch);
  score += breakdown.subjectMatch;

  // Grade match (15%)
  const studentGrades = [student.grade];
  const teacherGrades = teacher.grades || [];
  const gradeOverlap = studentGrades.filter((g: string) => teacherGrades.includes(g)).length;
  breakdown.gradeMatch = gradeOverlap > 0 ? weights.gradeMatch : 0;
  score += breakdown.gradeMatch;

  // Board match (10%)
  const teacherBoards = teacher.boards || [];
  breakdown.boardMatch = teacherBoards.includes(student.board) ? weights.boardMatch : 0;
  score += breakdown.boardMatch;

  // Availability overlap (20%) - simplified
  breakdown.availabilityOverlap = calculateAvailabilityOverlap(student, teacher) * weights.availabilityOverlap;
  score += breakdown.availabilityOverlap;

  // Budget compatibility (10%)
  const studentBudgetPerClass = student.monthlyBudget
    ? Number(student.monthlyBudget) / ((student.preferredDuration || 60) / 60) / 4 // monthly / hours per class / weeks
    : Infinity;
  const teacherRate = Number(teacher.hourlyRate);
  if (studentBudgetPerClass >= teacherRate) {
    breakdown.budgetCompatibility = weights.budgetCompatibility;
  } else if (studentBudgetPerClass >= teacherRate * 0.8) {
    breakdown.budgetCompatibility = weights.budgetCompatibility * 0.7;
  } else if (studentBudgetPerClass >= teacherRate * 0.6) {
    breakdown.budgetCompatibility = weights.budgetCompatibility * 0.4;
  }
  score += breakdown.budgetCompatibility;

  // Teacher rating (10%)
  breakdown.teacherRating = (Number(teacher.rating) / 5) * weights.teacherRating;
  score += breakdown.teacherRating;

  // Teacher experience (5%)
  breakdown.teacherExperience = Math.min(weights.teacherExperience, (teacher.experienceYears / 10) * weights.teacherExperience);
  score += breakdown.teacherExperience;

  // Language match (5%)
  const studentLang = student.preferredLanguage || 'English';
  const teacherLangs = teacher.languages || ['English'];
  breakdown.languageMatch = teacherLangs.includes(studentLang) ? weights.languageMatch : 0;
  score += breakdown.languageMatch;

  // Demo feedback (10%) - would be filled if demo completed
  breakdown.demoFeedback = 0;

  // Generate explanation
  const explanation = generateExplanation(student, teacher, breakdown);
  const pros = generatePros(student, teacher, breakdown);
  const cons = generateCons(student, teacher, breakdown);

  return {
    teacherId: teacher.id,
    score: Math.round(score),
    breakdown,
    explanation,
    pros,
    cons,
  };
}

function calculateAvailabilityOverlap(student: any, teacher: any): number {
  const studentAvail = student.availability || [];
  const teacherAvail = teacher.availability || [];

  if (studentAvail.length === 0 || teacherAvail.length === 0) return 0;

  let totalOverlapMinutes = 0;
  let totalStudentMinutes = 0;

  for (const s of studentAvail) {
    const studentMinutes = timeStringToMinutes(s.endTime) - timeStringToMinutes(s.startTime);
    totalStudentMinutes += studentMinutes;

    for (const t of teacherAvail) {
      if (s.dayOfWeek !== t.dayOfWeek) continue;

      const overlapStart = Math.max(timeStringToMinutes(s.startTime), timeStringToMinutes(t.startTime));
      const overlapEnd = Math.min(timeStringToMinutes(s.endTime), timeStringToMinutes(t.endTime));

      if (overlapEnd > overlapStart) {
        totalOverlapMinutes += overlapEnd - overlapStart;
      }
    }
  }

  return totalStudentMinutes > 0 ? totalOverlapMinutes / totalStudentMinutes : 0;
}

function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function generateExplanation(student: any, teacher: any, breakdown: any): string {
  const parts: string[] = [];

  if (breakdown.subjectMatch > 20) parts.push('Perfect subject alignment');
  else if (breakdown.subjectMatch > 15) parts.push('Good subject match');
  else if (breakdown.subjectMatch > 10) parts.push('Partial subject match');

  if (breakdown.availabilityOverlap > 15) parts.push('Excellent schedule compatibility');
  else if (breakdown.availabilityOverlap > 10) parts.push('Good schedule overlap');
  else if (breakdown.availabilityOverlap > 5) parts.push('Limited schedule overlap');

  if (breakdown.budgetCompatibility > 8) parts.push('Well within budget');
  else if (breakdown.budgetCompatibility > 5) parts.push('Slightly above budget');
  else parts.push('May exceed budget');

  if (breakdown.teacherRating > 8) parts.push('Highly rated teacher');
  else if (breakdown.teacherRating > 6) parts.push('Well-reviewed teacher');

  return parts.join('. ') + '.';
}

function generatePros(student: any, teacher: any, breakdown: any): string[] {
  const pros: string[] = [];

  if (breakdown.subjectMatch > 20) pros.push('Teaches all required subjects');
  if (breakdown.availabilityOverlap > 15) pros.push('Schedule aligns perfectly with your availability');
  if (breakdown.budgetCompatibility > 8) pros.push('Fits comfortably within your budget');
  if (breakdown.teacherRating > 8) pros.push(`Excellent rating (${teacher.rating}/5.0)`);
  if (breakdown.teacherExperience > 3) pros.push(`${teacher.experienceYears} years of teaching experience`);
  if (breakdown.languageMatch > 0) pros.push(`Speaks ${student.preferredLanguage || 'English'}`);

  return pros;
}

function generateCons(student: any, teacher: any, breakdown: any): string[] {
  const cons: string[] = [];

  if (breakdown.subjectMatch < 20) cons.push('Does not teach all required subjects');
  if (breakdown.availabilityOverlap < 10) cons.push('Limited schedule overlap - may need flexibility');
  if (breakdown.budgetCompatibility < 5) cons.push('Rate may exceed your budget');
  if (breakdown.teacherRating < 6) cons.push('Lower rating compared to other options');
  if (breakdown.teacherExperience < 2) cons.push('Less teaching experience');
  if (breakdown.gradeMatch === 0) cons.push(`May not have experience with Grade ${student.grade}`);

  return cons;
}

async function refineWithAI(
  student: any,
  candidates: TeacherMatchResult[],
  weights: MatchingWeights
): Promise<TeacherMatchResult[]> {
  // Get full teacher details for top candidates
  const teacherIds = candidates.map((c) => c.teacherId);
  const teachers = await prisma.teacher.findMany({
    where: { id: { in: teacherIds } },
    include: {
      user: true,
      availability: true,
      reviews: { take: 5, orderBy: { createdAt: 'desc' } },
      _count: { select: { teacherAssignments: true } },
    },
  });

  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  // Get demo feedback if available
  const demoFeedbacks = await prisma.demoClass.findMany({
    where: {
      studentId: student.id,
      teacherId: { in: teacherIds },
      status: 'COMPLETED',
    },
    include: {
      teacherFeedback: true,
      studentFeedback: true,
    },
  });

  const demoFeedbackMap = new Map(demoFeedbacks.map((d) => [d.teacherId, d]));

  try {
    const aiResult = await callAIWithJSON(
      {
        system: AI_PROMPTS.TEACHER_MATCHER.system,
        user: AI_PROMPTS.TEACHER_MATCHER.user({
          student: {
            id: student.id,
            name: student.user.name,
            grade: student.grade,
            board: student.board,
            subjects: student.syllabus?.subjects || [],
            preferredLanguage: student.preferredLanguage,
            monthlyBudget: student.monthlyBudget,
            availability: student.availability,
            targetGoal: student.targetGoal,
            examDate: student.examDate,
          },
          teachers: candidates.map((c) => {
            const teacher = teacherMap.get(c.teacherId)!;
            const demo = demoFeedbackMap.get(c.teacherId);
            return {
              id: teacher.id,
              name: teacher.user.name,
              subjects: teacher.subjects,
              grades: teacher.grades,
              boards: teacher.boards,
              languages: teacher.languages,
              hourlyRate: Number(teacher.hourlyRate),
              experienceYears: teacher.experienceYears,
              rating: Number(teacher.rating),
              reviewCount: teacher.reviewCount,
              totalStudents: teacher.totalStudents,
              availability: teacher.availability,
              demoFeedback: demo
                ? {
                    teacherScore: demo.teacherFeedback?.compatibilityScore,
                    studentRating: demo.studentFeedback?.overallRating,
                    wouldRecommend: demo.studentFeedback?.wouldRecommend,
                  }
                : null,
            };
          }),
          weights: { ...weights },
        }),
      },
      { temperature: 0.2, maxTokens: 6000 }
    );

    // Merge AI results with rule-based scores
    return candidates.map((candidate) => {
      const aiMatch = aiResult.find((m: any) => m.teacherId === candidate.teacherId);
      if (!aiMatch) return candidate;

      return {
        ...candidate,
        score: Math.round((candidate.score + aiMatch.score) / 2), // Average
        breakdown: { ...candidate.breakdown, demoFeedback: aiMatch.breakdown?.demoFeedback || 0 },
        explanation: aiMatch.explanation || candidate.explanation,
        pros: aiMatch.pros || candidate.pros,
        cons: aiMatch.cons || candidate.cons,
      };
    });
  } catch (error) {
    console.error('AI matching refinement failed, using rule-based:', error);
    return candidates;
  }
}

export async function calculateCompatibilityScore(
  studentId: string,
  teacherId: string,
  demoId?: string
): Promise<{ score: number; breakdown: TeacherMatchResult['breakdown']; explanation: string }> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true, syllabus: true, availability: true },
  });

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: true, availability: true },
  });

  if (!student || !teacher) {
    throw new Error('Student or teacher not found');
  }

  let demoFeedbackScore = 0;

  if (demoId) {
    const demo = await prisma.demoClass.findUnique({
      where: { id: demoId },
      include: { teacherFeedback: true, studentFeedback: true },
    });

    if (demo?.teacherFeedback?.compatibilityScore) {
      demoFeedbackScore = demo.teacherFeedback.compatibilityScore;
    }
  }

  const match = calculateRuleBasedMatch(student, teacher, {
    ...DEFAULT_WEIGHTS,
    demoFeedback: 10,
  });

  // Override demo feedback with actual score
  match.breakdown.demoFeedback = (demoFeedbackScore / 100) * 10;
  match.score = Object.values(match.breakdown).reduce((a, b) => a + b, 0);

  return {
    score: Math.round(match.score),
    breakdown: match.breakdown,
    explanation: match.explanation,
  };
}