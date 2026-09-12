'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sendEmails } from '@/lib/notify';

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') throw new Error('Not authorized.');
  return session;
}

const createBatchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  teacherId: z.string().min(1, 'Pick a teacher'),
  meetLink: z.string().url('Enter a valid Meet link'),
  scheduleNote: z.string().optional(),
  studentIds: z.array(z.string()).min(1, 'Pick at least one student'),
});

export async function createBatch(_: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = createBatchSchema.safeParse({
    name: formData.get('name'),
    teacherId: formData.get('teacherId'),
    meetLink: formData.get('meetLink'),
    scheduleNote: formData.get('scheduleNote') || undefined,
    studentIds: formData.getAll('studentIds'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { name, teacherId, meetLink, scheduleNote, studentIds } = parsed.data;

  const batch = await prisma.batch.create({
    data: {
      name,
      teacherId,
      meetLink,
      scheduleNote,
      students: { create: studentIds.map((studentId) => ({ studentId })) },
    },
  });

  const recipients = await prisma.user.findMany({
    where: { id: { in: [teacherId, ...studentIds] } },
    select: { email: true },
  });

  await sendEmails(
    recipients,
    `You've been added to ${name}`,
    `<p>You've been added to the batch <strong>${name}</strong>${scheduleNote ? ` (${scheduleNote})` : ''}.</p>
     <p>Join every class for this batch using the same link:</p>
     <p><a href="${meetLink}">${meetLink}</a></p>`,
  );

  redirect(`/admin/batches/${batch.id}`);
}

const addClassSchema = z.object({
  batchId: z.string().min(1),
  scheduledAt: z.string().min(1, 'Pick a date and time'),
});

export async function addClass(_: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = addClassSchema.safeParse({
    batchId: formData.get('batchId'),
    scheduledAt: formData.get('scheduledAt'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  await prisma.class.create({
    data: {
      batchId: parsed.data.batchId,
      scheduledAt: new Date(parsed.data.scheduledAt),
    },
  });

  revalidatePath(`/admin/batches/${parsed.data.batchId}`);
  return { error: undefined };
}

const cancelClassSchema = z.object({
  classId: z.string().min(1),
  batchId: z.string().min(1),
});

export async function cancelClass(formData: FormData) {
  await requireAdmin();

  const parsed = cancelClassSchema.safeParse({
    classId: formData.get('classId'),
    batchId: formData.get('batchId'),
  });

  if (!parsed.success) return;

  await prisma.class.update({
    where: { id: parsed.data.classId },
    data: { status: 'CANCELLED' },
  });

  revalidatePath(`/admin/batches/${parsed.data.batchId}`);
}
