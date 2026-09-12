'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { supabaseAdmin, RESOURCES_BUCKET } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const uploadSchema = z.object({
  batchId: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['ASSIGNMENT', 'TEST', 'NOTE']),
  dueAt: z.string().optional(),
});

export async function uploadResource(_: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user.role !== 'TEACHER') {
    return { error: 'Not authorized.' };
  }

  const parsed = uploadSchema.safeParse({
    batchId: formData.get('batchId'),
    title: formData.get('title'),
    type: formData.get('type'),
    dueAt: formData.get('dueAt') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const batch = await prisma.batch.findUnique({ where: { id: parsed.data.batchId } });
  if (!batch || batch.teacherId !== session.user.id) {
    return { error: 'Not authorized for this batch.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a file to upload.' };
  }

  const path = `${parsed.data.batchId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(RESOURCES_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: publicUrl } = supabaseAdmin.storage.from(RESOURCES_BUCKET).getPublicUrl(path);

  const resource = await prisma.resource.create({
    data: {
      batchId: parsed.data.batchId,
      uploadedById: session.user.id,
      title: parsed.data.title,
      type: parsed.data.type,
      fileUrl: publicUrl.publicUrl,
    },
  });

  // TEMPORARY: the running dev server's Prisma Client predates the
  // migration that added `dueAt` (it's on disk and in the DB, just not in
  // this process's loaded client until the server restarts — see
  // LESSONS.md). Setting it via raw SQL sidesteps that instead of needing
  // a restart. Once the server has been restarted at least once since,
  // delete this block and pass `dueAt` directly in the `create()` above.
  if (parsed.data.dueAt) {
    await prisma.$executeRaw`UPDATE "Resource" SET "dueAt" = ${new Date(parsed.data.dueAt)} WHERE id = ${resource.id}`;
  }

  revalidatePath(`/teacher/batches/${parsed.data.batchId}`);
  revalidatePath(`/student/batches/${parsed.data.batchId}`);
  return { error: undefined };
}
