import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { teacherProfileSchema, teacherAvailabilitySchema, teacherAvailabilityExceptionSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, avatarUrl: true, email: true, phone: true, timezone: true, createdAt: true } },
        availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        availabilityExceptions: { where: { date: { gte: new Date() } }, orderBy: { date: 'asc' } },
        reviews: {
          include: { student: { include: { user: { select: { name: true, avatarUrl: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        teacherAssignments: {
          where: { status: 'ACTIVE' },
          include: { student: { include: { user: { select: { name: true } } } } },
        },
        _count: { select: { reviews: true, teacherAssignments: true, classes: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Don't expose private info to non-admins
    const session = await auth();
    const isOwner = session?.user?.id === teacher.userId;
    const isAdmin = session?.user?.role === 'ADMIN';

    const response = {
      ...teacher,
      user: isOwner || isAdmin ? teacher.user : { name: teacher.user.name, avatarUrl: teacher.user.avatarUrl, timezone: teacher.user.timezone },
    };

    return NextResponse.json({ teacher: response });
  } catch (error) {
    console.error('Get teacher error:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({ where: { id } });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (session.user.role !== 'ADMIN' && teacher.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = teacherProfileSchema.parse(body);

    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        bio: validated.bio,
        education: validated.education,
        university: validated.university,
        qualifications: validated.qualifications,
        experienceYears: validated.experienceYears,
        subjects: validated.subjects,
        grades: validated.grades,
        boards: validated.boards,
        languages: validated.languages,
        teachingStyle: validated.teachingStyle,
        hourlyRate: validated.hourlyRate,
        monthlyRate: validated.monthlyRate,
        demoVideoUrl: validated.demoVideoUrl,
        maxClassesPerDay: validated.maxClassesPerDay,
        preferredDuration: validated.preferredDuration,
        bufferMinutes: validated.bufferMinutes,
        autoAcceptDemos: validated.autoAcceptDemos,
      },
    });

    return NextResponse.json({ teacher: updated });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Update teacher error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}