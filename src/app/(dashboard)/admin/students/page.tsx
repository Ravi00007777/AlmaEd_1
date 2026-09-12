import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { GraduationCapIcon, PlusIcon } from '@/components/ui/icons';

export default async function StudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { batchMemberships: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Students"
        description="Added by admin only. Assign them to a batch from the batch page."
        action={
          <Link href="/admin/students/new" className={buttonVariants({ size: 'sm' })}>
            <PlusIcon className="h-4 w-4" />
            Add student
          </Link>
        }
      />
      <Card>
        <div className="p-5">
          {students.length === 0 ? (
            <EmptyState
              icon={<GraduationCapIcon className="h-8 w-8" />}
              title="No students yet"
              description="Add a student to get started."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Batches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} />
                        <span className="font-medium text-slate-900">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone ?? '—'}</TableCell>
                    <TableCell>{student._count.batchMemberships}</TableCell>
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
