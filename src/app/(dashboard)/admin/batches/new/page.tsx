import { prisma } from '@/lib/prisma';
import { getInactiveUserIds } from '@/lib/user-status';
import { createBatch } from '../actions';
import { NewBatchForm } from './form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function NewBatchPage() {
  const [allTeachers, allStudents] = await Promise.all([
    prisma.user.findMany({ where: { role: 'TEACHER' }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { role: 'STUDENT' }, orderBy: { name: 'asc' } }),
  ]);

  const inactiveIds = await getInactiveUserIds([...allTeachers, ...allStudents].map((u) => u.id));
  const teachers = allTeachers.filter((t) => !inactiveIds.has(t.id));
  const students = allStudents.filter((s) => !inactiveIds.has(s.id));

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
