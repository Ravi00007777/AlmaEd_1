import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { studentBasicInfoSchema, studentPreferencesSchema, studentAvailabilitySchema } from '@/lib/validations';
import { analyzeSyllabus } from '@/lib/ai/syllabus-analyzer';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { step, data } = body;

    switch (step) {
      case 1: {
        const validated = studentBasicInfoSchema.parse(data);
        await prisma.student.update({
          where: { id: student.id },
          data: {
            grade: validated.grade,
            board: validated.board,
            school: validated.school,
            targetGoal: validated.targetGoal,
            examDate: validated.examDate ? new Date(validated.examDate) : null,
            currentLevel: validated.currentLevel,
          },
        });
        break;
      }
      case 2: {
        const validated = studentPreferencesSchema.parse(data);
        await prisma.student.update({
          where: { id: student.id },
          data: {
            preferredLanguage: validated.preferredLanguage,
            preferredDuration: validated.preferredDuration,
            monthlyBudget: validated.monthlyBudget,
            learningPreferences: validated.learningPreferences?.join(', '),
          },
        });
        break;
      }
      case 3: {
        const validated = studentAvailabilitySchema.parse(data);
        // Delete existing availability
        await prisma.studentAvailability.deleteMany({
          where: { studentId: student.id },
        });

        // Create new availability slots
        await prisma.studentAvailability.createMany({
          data: validated.availability.map((a) => ({
            studentId: student.id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            isRecurring: a.isRecurring,
            validFrom: a.validFrom ? new Date(a.validFrom) : new Date(),
            validUntil: a.validUntil ? new Date(a.validUntil) : null,
          })),
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Onboarding failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        syllabus: true,
        studyPlan: true,
        availability: true,
        teacherAssignments: { where: { status: 'ACTIVE' } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      student: {
        ...student,
        user: undefined,
      },
      onboardingComplete: !!(student.grade && student.board && student.availability.length > 0),
    });
  } catch (error) {
    console.error('Get onboarding error:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
  }
}