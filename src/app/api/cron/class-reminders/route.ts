import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getResend, EMAIL_FROM } from '@/lib/resend';

// Vercel Cron hits this on a schedule (see vercel.json). Finds classes
// starting in the next 30 minutes that haven't been reminded about yet,
// and emails the teacher and students in that batch.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resend = getResend();
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 60 * 1000);

  const upcomingClasses = await prisma.class.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { gte: now, lte: soon },
      reminderSentAt: null,
    },
    include: {
      batch: {
        include: { teacher: true, students: { include: { student: true } } },
      },
    },
  });

  for (const cls of upcomingClasses) {
    const recipients = [cls.batch.teacher, ...cls.batch.students.map((s) => s.student)];
    const when = cls.scheduledAt.toLocaleString();

    await Promise.all(
      recipients.map((recipient) =>
        resend.emails.send({
          from: EMAIL_FROM,
          to: recipient.email,
          subject: `Class starting soon: ${cls.batch.name}`,
          html: `<p>Your class "${cls.batch.name}" starts at ${when}.</p><p><a href="${cls.batch.meetLink}">Join on Google Meet</a></p>`,
        })
      )
    );

    await prisma.class.update({ where: { id: cls.id }, data: { reminderSentAt: now } });
  }

  return NextResponse.json({ remindersSent: upcomingClasses.length });
}
