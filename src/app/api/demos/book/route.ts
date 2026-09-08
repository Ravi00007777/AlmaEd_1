import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { bookDemoSchema } from '@/lib/validations';
import { syncDemoToCalendar } from '@/lib/scheduling/google-calendar';
import { notifyDemoBooked } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = bookDemoSchema.parse(body);

    // Check if teacher exists and is verified
    const teacher = await prisma.teacher.findUnique({
      where: { id: validated.teacherId },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (teacher.verificationStatus !== 'VERIFIED') {
      return NextResponse.json({ error: 'Teacher is not available for demos' }, { status: 400 });
    }

    // Check for existing demo with same teacher
    const existingDemo = await prisma.demoClass.findFirst({
      where: {
        studentId: student.id,
        teacherId: teacher.id,
        status: { in: ['REQUESTED', 'SCHEDULED'] },
      },
    });

    if (existingDemo) {
      return NextResponse.json({ error: 'You already have a pending demo with this teacher' }, { status: 400 });
    }

    // Check availability
    const scheduledAt = new Date(validated.scheduledAt);
    const endTime = new Date(scheduledAt.getTime() + validated.duration * 60000);

    const conflict = await checkDemoConflict(teacher.id, scheduledAt, endTime);
    if (conflict.hasConflict) {
      return NextResponse.json({ error: 'Teacher is not available at this time', conflicts: conflict.conflicts }, { status: 409 });
    }

    // Create demo class
    const demo = await prisma.demoClass.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        subject: validated.subject,
        status: teacher.autoAcceptDemos ? 'SCHEDULED' : 'REQUESTED',
        scheduledAt,
        duration: validated.duration,
        timezone: validated.timezone,
      },
    });

    // If auto-accept, schedule immediately
    if (teacher.autoAcceptDemos) {
      await confirmDemo(demo.id);
    }

    // Notify teacher
    await prisma.notification.create({
      data: {
        userId: teacher.userId,
        type: 'DEMO_REQUEST',
        title: 'New demo request',
        message: `${student.user.name} requested a demo for ${validated.subject} on ${scheduledAt.toLocaleString()}`,
        data: { demoId: demo.id },
        channels: ['IN_APP', 'EMAIL'],
      },
    });

    // Notify student
    await notifyDemoBooked(student.userId, {
      id: demo.id,
      teacherName: teacher.user.name,
      subject: validated.subject,
      scheduledAt,
      duration: validated.duration,
    });

    return NextResponse.json({ demo });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Book demo error:', error);
    return NextResponse.json({ error: 'Failed to book demo' }, { status: 500 });
  }
}

async function checkDemoConflict(
  teacherId: string,
  startTime: Date,
  endTime: Date
): Promise<{ hasConflict: boolean; conflicts: any[] }> {
  const conflicts: any[] = [];

  // Check existing classes
  const classes = await prisma.class.findMany({
    where: {
      teacherId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      scheduledAt: { lt: endTime },
    },
  });

  for (const cls of classes) {
    const clsEnd = new Date(cls.scheduledAt.getTime() + cls.duration * 60000);
    if (startTime < clsEnd && endTime > cls.scheduledAt) {
      conflicts.push({ type: 'CLASS', time: cls.scheduledAt, details: 'Existing class' });
    }
  }

  // Check existing demos
  const demos = await prisma.demoClass.findMany({
    where: {
      teacherId,
      status: { in: ['SCHEDULED', 'REQUESTED'] },
      scheduledAt: { lt: endTime },
    },
  });

  for (const demo of demos) {
    const demoEnd = new Date(demo.scheduledAt!.getTime() + demo.duration * 60000);
    if (startTime < demoEnd && endTime > demo.scheduledAt!) {
      conflicts.push({ type: 'DEMO', time: demo.scheduledAt, details: 'Existing demo' });
    }
  }

  // Check availability exceptions
  const exceptions = await prisma.teacherAvailabilityException.findMany({
    where: {
      teacherId,
      date: {
        gte: new Date(startTime.setHours(0, 0, 0, 0)),
        lte: new Date(startTime.setHours(23, 59, 59, 999)),
      },
    },
  });

  for (const exc of exceptions) {
    if (!exc.startTime && !exc.endTime) {
      conflicts.push({ type: 'UNAVAILABLE', time: startTime, details: exc.reason || 'Teacher unavailable' });
    }
  }

  return { hasConflict: conflicts.length > 0, conflicts };
}

async function confirmDemo(demoId: string) {
  const demo = await prisma.demoClass.findUnique({
    where: { id: demoId },
    include: { teacher: { include: { user: true } }, student: { include: { user: true } } },
  });

  if (!demo || !demo.scheduledAt) return;

  // Sync to Google Calendar
  await syncDemoToCalendar(demoId, 'create');

  // Update demo status
  await prisma.demoClass.update({
    where: { id: demoId },
    data: { status: 'SCHEDULED', confirmedAt: new Date() },
  });

  // Notify both parties
  await prisma.notification.createMany({
    data: [
      {
        userId: demo.teacher.userId,
        type: 'DEMO_CONFIRMED',
        title: 'Demo confirmed',
        message: `Demo with ${demo.student.user.name} confirmed for ${demo.scheduledAt.toLocaleString()}`,
        data: { demoId },
        channels: ['IN_APP'],
      },
      {
        userId: demo.student.userId,
        type: 'DEMO_CONFIRMED',
        title: 'Demo confirmed',
        message: `Demo with ${demo.teacher.user.name} confirmed for ${demo.scheduledAt.toLocaleString()}`,
        data: { demoId },
        channels: ['IN_APP'],
      },
    ],
  });
}