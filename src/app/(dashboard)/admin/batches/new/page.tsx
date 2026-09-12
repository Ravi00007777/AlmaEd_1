import { prisma } from '@/lib/prisma';
import { createBatch } from '../actions';
import { NewBatchForm } from './form';

export default async function NewBatchPage() {
  const [teachers, students] = await Promise.all([
    prisma.user.findMany({ where: { role: 'TEACHER' }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { role: 'STUDENT' }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">Create a batch</h1>
      <NewBatchForm teachers={teachers} students={students} action={createBatch} />
    </div>
  );
}
