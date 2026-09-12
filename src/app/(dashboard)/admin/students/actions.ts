'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { deactivateUser } from '@/lib/user-status';

const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  // Optional: a student created without a password can only sign in with
  // "Continue with Google" using this exact email — admin's choice per
  // student depending on how they'll actually log in.
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export async function createStudent(_: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') {
    return { error: 'Not authorized.' };
  }

  const rawPassword = formData.get('password');
  const parsed = createStudentSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    password: rawPassword ? rawPassword : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  await prisma.user.create({
    data: { name, email, phone, passwordHash, role: 'STUDENT', createdById: session.user.id },
  });

  redirect('/admin/students');
}

export async function removeStudent(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') return;

  const studentId = formData.get('studentId');
  if (typeof studentId !== 'string') return;

  await deactivateUser(studentId);
  revalidatePath('/admin/students');
}
