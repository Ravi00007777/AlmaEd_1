'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { deactivateUser } from '@/lib/user-status';

const createTeacherSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function createTeacher(_: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') {
    return { error: 'Not authorized.' };
  }

  const parsed = createTeacherSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, phone, passwordHash, role: 'TEACHER', createdById: session.user.id },
  });

  redirect('/admin/teachers');
}

export async function removeTeacher(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') return;

  const teacherId = formData.get('teacherId');
  if (typeof teacherId !== 'string') return;

  await deactivateUser(teacherId);
  revalidatePath('/admin/teachers');
}
