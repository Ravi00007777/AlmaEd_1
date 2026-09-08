import { prisma } from './prisma';

// ============================================
// COMMON QUERY EXTENSIONS
// ============================================

// User queries
export const userQueries = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        teacher: true,
        parent: true,
      },
    }),

  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        teacher: true,
        parent: true,
      },
    }),

  createWithRole: (data: {
    email: string;
    passwordHash: string;
    name: string;
    role: 'STUDENT' | 'TEACHER' | 'PARENT';
    phone?: string;
    timezone?: string;
  }) =>
    prisma.user.create({
      data: {
        ...data,
        emailVerified: null,
        status: 'PENDING',
      },
    }),

  updateLastLogin: (id: string) =>
    prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    }),
};

// Teacher queries
export const teacherQueries = {
  findVerified: (filters?: {
    subjects?: string[];
    grades?: string[];
    boards?: string[];
    minRating?: number;
    maxHourlyRate?: number;
    availability?: { dayOfWeek: number; startTime: string; endTime: string }[];
  }) => {
    const where: any = {
      verificationStatus: 'VERIFIED',
      user: { status: 'ACTIVE' },
    };

    if (filters?.subjects?.length) {
      where.subjects = { hasSome: filters.subjects };
    }
    if (filters?.grades?.length) {
      where.grades = { hasSome: filters.grades };
    }
    if (filters?.boards?.length) {
      where.boards = { hasSome: filters.boards };
    }
    if (filters?.minRating) {
      where.rating = { gte: filters.minRating };
    }
    if (filters?.maxHourlyRate) {
      where.hourlyRate = { lte: filters.maxHourlyRate };
    }

    return prisma.teacher.findMany({
      where,
      include: {
        user: { select: { name: true, avatarUrl: true, timezone: true } },
        availability: true,
        reviews: { take: 3, orderBy: { createdAt: 'desc' } },
        _count: { select: { reviews: true, teacherAssignments: true } },
      },
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    });
  },

  findById: (id: string) =>
    prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        availability: true,
        availabilityExceptions: { where: { date: { gte: new Date() } } },
        reviews: { include: { student: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
        teacherAssignments: { where: { status: 'ACTIVE' }, include: { student: { include: { user: true } } } },
        _count: { select: { reviews: true, teacherAssignments: true, classes: true } },
      },
    }),

  updateRating: async (teacherId: string) => {
    const reviews = await prisma.review.aggregate({
      where: { teacherId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return prisma.teacher.update({
      where: { id: teacherId },
      data: {
        rating: reviews._avg.rating ? Math.round(reviews._avg.rating * 100) / 100 : 0,
        reviewCount: reviews._count.rating,
      },
    });
  },
};

// Student queries
export const studentQueries = {
  findById: (id: string) =>
    prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        parent: { include: { user: true } },
        syllabus: true,
        studyPlan: true,
        availability: true,
        teacherAssignments: {
          where: { status: 'ACTIVE' },
          include: { teacher: { include: { user: true } } },
        },
        subscriptions: { where: { status: 'ACTIVE' }, include: { teacher: true } },
      },
    }),

  findByUserId: (userId: string) =>
    prisma.student.findUnique({
      where: { userId },
      include: {
        user: true,
        syllabus: true,
        studyPlan: true,
        availability: true,
        teacherAssignments: { where: { status: 'ACTIVE' } },
      },
    }),
};

// Class queries
export const classQueries = {
  findById: (id: string) =>
    prisma.class.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: true } },
        student: { include: { user: true } },
        assignment: { include: { teacher: true, student: true } },
        attendance: true,
      },
    }),

  findUpcoming: (userId: string, role: 'STUDENT' | 'TEACHER', limit = 10) =>
    prisma.class.findMany({
      where: {
        [role === 'STUDENT' ? 'studentId' : 'teacherId']: userId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledAt: { gte: new Date() },
      },
      include: {
        teacher: { include: { user: true } },
        student: { include: { user: true } },
        assignment: { include: { teacher: true, student: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    }),

  findTodaysClasses: (userId: string, role: 'STUDENT' | 'TEACHER') => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.class.findMany({
      where: {
        [role === 'STUDENT' ? 'studentId' : 'teacherId']: userId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        teacher: { include: { user: true } },
        student: { include: { user: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  },

  findConflicts: (teacherId: string, scheduledAt: Date, duration: number, excludeClassId?: string) => {
    const endTime = new Date(scheduledAt.getTime() + duration * 60000);
    return prisma.class.findMany({
      where: {
        teacherId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        id: { not: excludeClassId },
        OR: [
          {
            scheduledAt: { lt: endTime },
            // This needs a custom check for overlapping
          },
        ],
      },
    });
  },
};

// Availability queries
export const availabilityQueries = {
  findTeacherWeekly: (teacherId: string) =>
    prisma.teacherAvailability.findMany({
      where: { teacherId, isRecurring: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),

  findStudentWeekly: (studentId: string) =>
    prisma.studentAvailability.findMany({
      where: { studentId, isRecurring: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),

  findTeacherExceptions: (teacherId: string, from: Date, to: Date) =>
    prisma.teacherAvailabilityException.findMany({
      where: { teacherId, date: { gte: from, lte: to } },
    }),

  getCombinedAvailability: async (teacherId: string, studentId: string, date: Date) => {
    const dayOfWeek = date.getDay();
    const [teacherSlots, studentSlots, exceptions] = await Promise.all([
      prisma.teacherAvailability.findMany({
        where: { teacherId, dayOfWeek, isRecurring: true },
      }),
      prisma.studentAvailability.findMany({
        where: { studentId, dayOfWeek, isRecurring: true },
      }),
      prisma.teacherAvailabilityException.findMany({
        where: { teacherId, date: { gte: date, lt: new Date(date.getTime() + 86400000) } },
      }),
    ]);
    return { teacherSlots, studentSlots, exceptions };
  },
};

// Payment queries
export const paymentQueries = {
  findByStudent: (studentId: string) =>
    prisma.payment.findMany({
      where: { studentId },
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
    }),

  findBySubscription: (subscriptionId: string) =>
    prisma.payment.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    }),

  findPendingPayouts: (teacherId: string) =>
    prisma.teacherEarning.findMany({
      where: { teacherId, status: 'AVAILABLE' },
      orderBy: { earnedAt: 'asc' },
    }),

  calculateTeacherEarnings: (teacherId: string, from: Date, to: Date) =>
    prisma.teacherEarning.aggregate({
      where: { teacherId, earnedAt: { gte: from, lte: to } },
      _sum: { grossAmount: true, commissionAmount: true, netAmount: true },
    }),
};

// Assignment queries
export const assignmentQueries = {
  findByTeacher: (teacherId: string, status?: import('@prisma/client').AssignmentStatus) =>
    prisma.assignment.findMany({
      where: { teacherId, ...(status && { submissions: { some: { status } } }) },
      include: {
        assignment: { include: { student: { include: { user: true } }, teacher: true } },
        submissions: { include: { student: { include: { user: true } } } },
      },
      orderBy: { dueAt: 'asc' },
    }),

  findByStudent: (studentId: string, status?: import('@prisma/client').AssignmentStatus) =>
    prisma.assignmentSubmission.findMany({
      where: { studentId, ...(status && { status }) },
      include: {
        assignment: {
          include: {
            teacher: { include: { user: true } },
            assignment: { include: { student: { include: { user: true } } } },
          },
        },
      },
      orderBy: { assignment: { dueAt: 'asc' } },
    }),
};

// Demo queries
export const demoQueries = {
  findByStudent: (studentId: string) =>
    prisma.demoClass.findMany({
      where: { studentId },
      include: {
        teacher: { include: { user: true } },
        teacherFeedback: true,
        studentFeedback: true,
      },
      orderBy: { requestedAt: 'desc' },
    }),

  findByTeacher: (teacherId: string, status?: import('@prisma/client').DemoStatus) =>
    prisma.demoClass.findMany({
      where: { teacherId, ...(status && { status }) },
      include: {
        student: { include: { user: true } },
        teacherFeedback: true,
        studentFeedback: true,
      },
      orderBy: { scheduledAt: 'asc' },
    }),

  findPendingForTeacher: (teacherId: string) =>
    prisma.demoClass.findMany({
      where: { teacherId, status: 'REQUESTED' },
      include: {
        student: { include: { user: true, syllabus: true } },
      },
      orderBy: { requestedAt: 'asc' },
    }),
};