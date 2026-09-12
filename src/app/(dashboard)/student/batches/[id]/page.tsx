import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ResourcesTable } from '@/components/resources-table';
import { attachResourceDueDates } from '@/lib/resource-due-dates';
import { getDoubtThread } from '@/lib/doubts';
import { DoubtChat } from '@/components/doubt-chat';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ClassStatusBadge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { CalendarIcon, VideoIcon, ExternalLinkIcon } from '@/components/ui/icons';

export default async function StudentBatchPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const studentId = session!.user.id;

  const membership = await prisma.batchStudent.findUnique({
    where: { batchId_studentId: { batchId: params.id, studentId } },
    include: {
      batch: {
        include: {
          teacher: true,
          classes: { orderBy: { scheduledAt: 'desc' }, take: 20 },
          resources: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      },
    },
  });

  if (!membership) notFound();
  const { batch } = membership;

  const resources = await attachResourceDueDates(batch.resources);
  const doubtMessages = await getDoubtThread(batch.id, studentId);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{batch.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Teacher: {batch.teacher.name} · {batch.scheduleNote ?? 'No schedule note'}
            </p>
          </div>
          <a
            href={batch.meetLink}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: 'secondary' })}
          >
            <VideoIcon className="h-4 w-4" />
            Open Meet link
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {batch.classes.length === 0 ? (
            <EmptyState icon={<CalendarIcon className="h-8 w-8" />} title="No classes yet" />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {batch.classes.map((cls) => (
                <li key={cls.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="text-slate-700">{new Date(cls.scheduledAt).toLocaleString()}</span>
                  <ClassStatusBadge status={cls.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments and tests</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourcesTable resources={resources} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doubts</CardTitle>
        </CardHeader>
        <CardContent>
          <DoubtChat
            batchId={batch.id}
            studentId={studentId}
            currentUserId={studentId}
            messages={doubtMessages}
            readOnly={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
