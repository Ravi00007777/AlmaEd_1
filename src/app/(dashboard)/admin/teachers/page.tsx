import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { PlusIcon, UsersIcon } from '@/components/ui/icons';

export default async function TeachersPage() {
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { teachingBatches: true } } },
  });

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
