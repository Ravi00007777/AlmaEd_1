import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { PlusIcon, BookOpenIcon, UsersIcon } from '@/components/ui/icons';

export default async function BatchesPage() {
  const batches = await prisma.batch.findMany({
    orderBy: { createdAt: 'desc' },
    include: { teacher: true, _count: { select: { students: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Batches"
        action={
          <Link href="/admin/batches/new" className={buttonVariants({ size: 'sm' })}>
            <PlusIcon className="h-4 w-4" />
            Create batch
          </Link>
        }
      />
      {batches.length === 0 ? (
        <Card>
          <div className="p-5">
            <EmptyState
              icon={<BookOpenIcon className="h-8 w-8" />}
              title="No batches yet"
              description="Create a batch to pair a teacher with students."
            />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Link key={batch.id} href={`/admin/batches/${batch.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{batch.name}</CardTitle>
                  <CardDescription>{batch.teacher.name}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-1.5 text-sm text-slate-500">
                  <UsersIcon className="h-4 w-4" />
                  {batch._count.students} student{batch._count.students === 1 ? '' : 's'}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
