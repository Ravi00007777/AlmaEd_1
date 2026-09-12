import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { BookOpenIcon, VideoIcon } from '@/components/ui/icons';

export default async function StudentHomePage() {
  const session = await auth();
  const studentId = session!.user.id;

  const memberships = await prisma.batchStudent.findMany({
    where: { studentId },
    include: {
      batch: {
        include: {
          teacher: true,
          classes: {
            where: { status: 'SCHEDULED', scheduledAt: { gte: new Date() } },
            orderBy: { scheduledAt: 'asc' },
            take: 3,
          },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader title="My classes" />
      {memberships.length === 0 ? (
        <Card>
          <div className="p-5">
            <EmptyState
              icon={<BookOpenIcon className="h-8 w-8" />}
              title="No batch assigned yet"
              description="Your admin will add you to a batch soon."
            />
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {memberships.map(({ batch }) => (
            <Card key={batch.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Link href={`/student/batches/${batch.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                    {batch.name}
                  </Link>
                  <span className="text-sm text-slate-500">with {batch.teacher.name}</span>
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
