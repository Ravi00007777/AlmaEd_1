'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') throw new Error('Not authorized.');
  return session;
}

const createPaymentSchema = z.object({
  studentId: z.string().min(1, 'Pick a student'),
  teacherId: z.string().min(1, 'Pick a teacher'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  note: z.string().optional(),
});

export async function createPayment(_: unknown, formData: FormData) {
  const session = await requireAdmin();

  const parsed = createPaymentSchema.safeParse({
    studentId: formData.get('studentId'),
    teacherId: formData.get('teacherId'),
    amount: formData.get('amount'),
    note: formData.get('note') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  await prisma.payment.create({
    data: { ...parsed.data, recordedById: session.user.id },
  });

  revalidatePath('/admin/payments');
  return { error: undefined };
}

export async function markPaymentStatus(formData: FormData) {
  await requireAdmin();

  const paymentId = formData.get('paymentId');
  const status = formData.get('status');
  if (typeof paymentId !== 'string' || (status !== 'PAID' && status !== 'PENDING')) return;

  await prisma.payment.update({ where: { id: paymentId }, data: { status } });
  revalidatePath('/admin/payments');
}
