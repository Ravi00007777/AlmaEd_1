'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { supabaseAdmin, RESOURCES_BUCKET } from '@/lib/supabase';
import { createDoubtMessage } from '@/lib/doubts';
import { containsContactInfo } from '@/lib/contact-filter';
import { revalidatePath } from 'next/cache';

const postDoubtSchema = z.object({
  batchId: z.string().min(1),
  studentId: z.string().min(1),
  body: z.string().optional(),
});

export async function postDoubtMessage(_: unknown, formData: FormData) {
  const session = await auth();
  if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'TEACHER')) {
    return { error: 'Not authorized.' };
  }

  const parsed = postDoubtSchema.safeParse({
    batchId: formData.get('batchId'),
    studentId: formData.get('studentId'),
    body: formData.get('body') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { batchId, studentId } = parsed.data;
  const body = parsed.data.body?.trim() || null;

  if (body && containsContactInfo(body)) {
    return { error: 'Message blocked: please keep contact details (email, phone) off the platform.' };
  }

  if (session.user.role === 'STUDENT') {
    if (session.user.id !== studentId) {
      return { error: 'Not authorized for this thread.' };
    }
    const membership = await prisma.batchStudent.findUnique({
      where: { batchId_studentId: { batchId, studentId } },
    });
    if (!membership) return { error: 'Not authorized for this batch.' };
  } else {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch || batch.teacherId !== session.user.id) {
      return { error: 'Not authorized for this batch.' };
    }
    const membership = await prisma.batchStudent.findUnique({
      where: { batchId_studentId: { batchId, studentId } },
    });
    if (!membership) return { error: 'That student is not in this batch.' };
  }

  const file = formData.get('image');
  let imageUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const path = `doubts/${batchId}/${studentId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(RESOURCES_BUCKET)
      .upload(path, await file.arrayBuffer(), { contentType: file.type });

    if (uploadError) {
      return { error: `Image upload failed: ${uploadError.message}` };
    }

    const { data: publicUrl } = supabaseAdmin.storage.from(RESOURCES_BUCKET).getPublicUrl(path);
    imageUrl = publicUrl.publicUrl;
  }

  if (!body && !imageUrl) {
    return { error: 'Write a message or attach an image.' };
  }

  await createDoubtMessage({ batchId, studentId, senderId: session.user.id, body, imageUrl });

  revalidatePath(`/teacher/batches/${batchId}`);
  revalidatePath(`/student/batches/${batchId}`);
  revalidatePath(`/admin/batches/${batchId}`);
  return { error: undefined };
}
