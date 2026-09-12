import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getInactiveUserIds } from '@/lib/user-status';
import { removeTeacher } from './actions';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { PlusIcon, UsersIcon } from '@/components/ui/icons';

export default async function TeachersPage() {
  const allTeachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { teachingBatches: true } } },
  });

  const inactiveIds = await getInactiveUserIds(allTeachers.map((t) => t.id));
  const teachers = allTeachers.filter((t) => !inactiveIds.has(t.id));

  return (
    <div>
      <PageHeader
        title="Teachers"
        action={
          <Link href="/admin/teachers/new" className={buttonVariants({ size: 'sm' })}>
            <PlusIcon className="h-4 w-4" />
            Add teacher
          </Link>
        }
      />
      <Card>
        <div className="p-5">
          {teachers.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-8 w-8" />}
              title="No teachers yet"
              description="Add a teacher to start assigning batches."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={teacher.name} />
                        <span className="font-medium text-slate-900">{teacher.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher._count.teachingBatches}</TableCell>
                    <TableCell>
                      <form action={removeTeacher}>
                        <input type="hidden" name="teacherId" value={teacher.id} />
                        <button type="submit" className={buttonVariants({ variant: 'danger', size: 'sm' })}>
                          Remove
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
