import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { BookOpenIcon, UsersIcon, VideoIcon } from '@/components/ui/icons';

export default async function TeacherHomePage() {
  const session = await auth();
  const teacherId = session!.user.id;

  const batches = await prisma.batch.findMany({
    where: { teacherId },
    include: {
      students: true,
      classes: {
        where: { status: 'SCHEDULED', scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
      },
    },
  });

  return (
    <div>
      <PageHeader title="My batches" />
      {batches.length === 0 ? (
        <Card>
          <div className="p-5">
            <EmptyState
              icon={<BookOpenIcon className="h-8 w-8" />}
              title="No batches assigned yet"
              description="Check with your admin."
            />
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Link href={`/teacher/batches/${batch.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                    {batch.name}
                  </Link>
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <UsersIcon className="h-4 w-4" />
                    {batch.students.length} students
                  </span>
                </div>
                {batch.classes.length === 0 ? (
                  <p className="text-sm text-slate-500">No upcoming classes scheduled.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-slate-100">
                    {batch.classes.map((cls) => (
                      <li key={cls.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-slate-700">{new Date(cls.scheduledAt).toLocaleString()}</span>
                        <a href={batch.meetLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                          <VideoIcon className="h-4 w-4" />
                          Join
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
