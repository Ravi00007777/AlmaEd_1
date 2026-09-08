import { z } from 'zod';

// ============================================
// AUTH VALIDATIONS
// ============================================

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  confirmPassword: z.string(),
  role: z.enum(['STUDENT', 'TEACHER', 'PARENT']),
  phone: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['STUDENT', 'TEACHER', 'PARENT']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  confirmPassword: z.string(),
  token: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============================================
// STUDENT ONBOARDING VALIDATIONS
// ============================================

export const studentBasicInfoSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15).optional(),
  grade: z.string().min(1).max(20),
  board: z.string().min(1).max(50),
  school: z.string().max(200).optional(),
  targetGoal: z.string().max(500).optional(),
  examDate: z.string().datetime().optional().nullable(),
  currentLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
});

export const studentPreferencesSchema = z.object({
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  preferredLanguage: z.string().default('English'),
  preferredDuration: z.number().int().min(30).max(180).default(60),
  classesPerWeek: z.number().int().min(1).max(7).default(3),
  monthlyBudget: z.number().positive().optional(),
  learningPreferences: z.array(z.string()).optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

export const studentAvailabilitySchema = z.object({
  availability: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    isRecurring: z.boolean().default(true),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional().nullable(),
  })),
});

// ============================================
// TEACHER PROFILE VALIDATIONS
// ============================================

export const teacherProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  education: z.string().max(200).optional(),
  university: z.string().max(200).optional(),
  qualifications: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).max(50).default(0),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  grades: z.array(z.string()).min(1, 'Select at least one grade'),
  boards: z.array(z.string()).min(1, 'Select at least one board'),
  languages: z.array(z.string()).min(1).default(['English']),
  teachingStyle: z.string().max(2000).optional(),
  hourlyRate: z.number().positive().min(100).max(10000),
  monthlyRate: z.number().positive().optional(),
  demoVideoUrl: z.string().url().optional().or(z.literal('')),
  maxClassesPerDay: z.number().int().min(1).max(10).default(4),
  preferredDuration: z.number().int().min(30).max(180).default(60),
  bufferMinutes: z.number().int().min(0).max(60).default(15),
  autoAcceptDemos: z.boolean().default(false),
});

export const teacherAvailabilitySchema = z.object({
  availability: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    isRecurring: z.boolean().default(true),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional().nullable(),
  })),
  maxClassesPerDay: z.number().int().min(1).max(10).default(4),
  preferredDuration: z.number().int().min(30).max(180).default(60),
  bufferMinutes: z.number().int().min(0).max(60).default(15),
  timezone: z.string().default('Asia/Kolkata'),
});

export const teacherAvailabilityExceptionSchema = z.object({
  date: z.string().datetime(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  reason: z.string().max(500).optional(),
});

// ============================================
// DEMO CLASS VALIDATIONS
// ============================================

export const bookDemoSchema = z.object({
  teacherId: z.string().cuid(),
  subject: z.string().min(1),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(15).max(60).default(30),
  timezone: z.string().default('Asia/Kolkata'),
});

export const demoTeacherFeedbackSchema = z.object({
  studentLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  recommendedFrequency: z.number().int().min(1).max(7).optional(),
  recommendedCurriculum: z.string().max(2000).optional(),
  compatibilityScore: z.number().int().min(1).max(100),
  comments: z.string().max(2000).optional(),
});

export const demoStudentFeedbackSchema = z.object({
  teachingQuality: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
  explanationQuality: z.number().int().min(1).max(5),
  comfortLevel: z.number().int().min(1).max(5),
  overallRating: z.number().int().min(1).max(5),
  wouldRecommend: z.boolean(),
  comments: z.string().max(2000).optional(),
});

// ============================================
// CLASS VALIDATIONS
// ============================================

export const createClassSchema = z.object({
  teacherId: z.string().cuid(),
  studentId: z.string().cuid(),
  assignmentId: z.string().cuid().optional(),
  subject: z.string().min(1),
  topic: z.string().optional(),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(30).max(180).default(60),
  timezone: z.string().default('Asia/Kolkata'),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  recurrenceEndDate: z.string().datetime().optional().nullable(),
});

export const rescheduleClassSchema = z.object({
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(30).max(180).optional(),
  reason: z.string().max(500).optional(),
});

export const cancelClassSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason').max(500),
});

export const classNotesSchema = z.object({
  teacherNotes: z.string().max(5000).optional(),
  studentNotes: z.string().max(5000).optional(),
});

// ============================================
// ASSIGNMENT VALIDATIONS
// ============================================

export const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['SHORT_ANSWER', 'LONG_ANSWER', 'MCQ', 'TRUE_FALSE', 'FILL_BLANK', 'UPLOAD']),
  question: z.string().min(1, 'Question is required'),
  marks: z.number().int().min(1).max(100),
  difficulty: z.number().int().min(1).max(5).default(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  expectedAnswer: z.string().optional(),
});

export const createAssignmentSchema = z.object({
  teacherId: z.string().cuid(),
  assignmentId: z.string().cuid().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(5000).optional(),
  subject: z.string().min(1),
  topic: z.string().optional(),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
  attachments: z.array(z.string().url()).optional(),
  maxMarks: z.number().int().min(1).max(500).default(100),
  difficulty: z.number().int().min(1).max(5).default(1),
  dueAt: z.string().datetime(),
  allowLateSubmit: z.boolean().default(false),
  latePenalty: z.number().int().min(0).max(100).default(0),
});

export const submitAssignmentSchema = z.object({
  content: z.string().max(10000).optional(),
  attachments: z.array(z.string().url()).optional(),
});

export const gradeAssignmentSchema = z.object({
  marksObtained: z.number().int().min(0),
  feedback: z.string().max(5000).optional(),
  correctedFiles: z.array(z.string().url()).optional(),
});

// ============================================
// PAYMENT VALIDATIONS
// ============================================

export const createSubscriptionSchema = z.object({
  teacherId: z.string().cuid().optional(),
  planType: z.enum(['MONTHLY', 'WEEKLY', 'PER_CLASS', 'PACKAGE']),
  subject: z.string().min(1),
  classesPerWeek: z.number().int().min(1).max(7),
  durationMinutes: z.number().int().min(30).max(180),
  price: z.number().positive(),
  commissionPercent: z.number().min(0).max(100).default(15),
});

export const createPaymentOrderSchema = z.object({
  subscriptionId: z.string().cuid().optional(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  planType: z.enum(['MONTHLY', 'WEEKLY', 'PER_CLASS', 'PACKAGE']),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export const refundPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(10).max(500),
});

// ============================================
// ADMIN VALIDATIONS
// ============================================

export const platformSettingsSchema = z.object({
  commissionPercent: z.number().min(5).max(30).default(15),
  minCommissionPercent: z.number().min(0).max(30).default(5),
  maxCommissionPercent: z.number().min(5).max(50).default(30),
  maintenanceMode: z.boolean().default(false),
  allowTeacherRegistration: z.boolean().default(true),
  allowStudentRegistration: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(true),
  requirePhoneVerification: z.boolean().default(false),
});

export const teacherVerificationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().max(1000).optional(),
});

// ============================================
// SYLLABUS VALIDATIONS
// ============================================

export const syllabusUploadSchema = z.object({
  files: z.array(z.instanceof(File)).max(5, 'Maximum 5 files allowed'),
});

export const syllabusAnalysisTriggerSchema = z.object({
  syllabusId: z.string().cuid(),
});

// ============================================
// SCHEDULING VALIDATIONS
// ============================================

export const generateScheduleSchema = z.object({
  studentId: z.string().cuid(),
  teacherId: z.string().cuid(),
  assignmentId: z.string().cuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  classesPerWeek: z.number().int().min(1).max(7),
  durationMinutes: z.number().int().min(30).max(180),
});

export const rescheduleBulkSchema = z.object({
  classIds: z.array(z.string().cuid()).min(1),
  newScheduledAt: z.string().datetime(),
  reason: z.string().max(500).optional(),
});

// ============================================
// AI VALIDATIONS
// ============================================

export const aiPromptSchema = z.object({
  prompt: z.string().min(1).max(5000),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8000).optional(),
});

export const studyPlanGenerationSchema = z.object({
  studentId: z.string().cuid(),
  syllabusId: z.string().cuid(),
  teacherId: z.string().cuid().optional(),
  examDate: z.string().datetime().optional(),
  classesPerWeek: z.number().int().min(1).max(7).default(3),
  durationMinutes: z.number().int().min(30).max(180).default(60),
  studentAvailability: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
  teacherAvailability: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
});

// ============================================
// FILE UPLOAD VALIDATIONS
// ============================================

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['SYLLABUS', 'ASSIGNMENT', 'PROFILE_AVATAR', 'TEACHER_DOC', 'CLASS_RECORDING', 'OTHER']),
  maxSizeMB: z.number().default(10),
});

// ============================================
// SEARCH/FILTER VALIDATIONS
// ============================================

export const teacherSearchSchema = z.object({
  query: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  grades: z.array(z.string()).optional(),
  boards: z.array(z.string()).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxHourlyRate: z.number().positive().optional(),
  languages: z.array(z.string()).optional(),
  availability: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['rating', 'hourlyRate', 'experienceYears', 'reviewCount', 'matchScore']).default('rating'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type StudentBasicInfoInput = z.infer<typeof studentBasicInfoSchema>;
export type StudentPreferencesInput = z.infer<typeof studentPreferencesSchema>;
export type TeacherProfileInput = z.infer<typeof teacherProfileSchema>;
export type BookDemoInput = z.infer<typeof bookDemoSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
export type TeacherSearchInput = z.infer<typeof teacherSearchSchema>;