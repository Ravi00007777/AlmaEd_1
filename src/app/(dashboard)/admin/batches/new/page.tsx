import { prisma } from '@/lib/prisma';
import { createBatch } from '../actions';
import { NewBatchForm } from './form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function NewBatchPage() {
  const [teachers, students] = await Promise.all([
    prisma.user.findMany({ where: { role: 'TEACHER' }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { role: 'STUDENT' }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Create a batch</CardTitle>
        </CardHeader>
        <CardContent>
          <NewBatchForm teachers={teachers} students={students} action={createBatch} />
        </CardContent>
      </Card>
    </div>
  );
}
