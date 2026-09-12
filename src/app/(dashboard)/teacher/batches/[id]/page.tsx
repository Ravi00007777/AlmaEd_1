import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UploadResourceForm } from './upload-form';
import { ResourcesTable } from '@/components/resources-table';
import { attachResourceDueDates } from '@/lib/resource-due-dates';
import { getDoubtThread, getDoubtCounts } from '@/lib/doubts';
import { DoubtChat } from '@/components/doubt-chat';
import { DoubtStudentPicker } from '@/components/doubt-student-picker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ClassStatusBadge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { UsersIcon, CalendarIcon, VideoIcon, ExternalLinkIcon } from '@/components/ui/icons';

export default async function TeacherBatchPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { student?: string };
}) {
  const session = await auth();

  const batch = await prisma.batch.findUnique({
    where: { id: params.id },
    include: {
      students: { include: { student: true } },
      classes: { orderBy: { scheduledAt: 'desc' }, take: 20 },
      resources: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!batch || batch.teacherId !== session?.user.id) notFound();

  const resources = await attachResourceDueDates(batch.resources);

  const selectedStudentId = searchParams.student ?? batch.students[0]?.student.id;
  const doubtCounts = await getDoubtCounts(batch.id);
  const doubtMessages = selectedStudentId ? await getDoubtThread(batch.id, selectedStudentId) : [];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{batch.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{batch.scheduleNote ?? 'No schedule note'}</p>
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
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          {batch.students.length === 0 ? (
            <EmptyState icon={<UsersIcon className="h-8 w-8" />} title="No students yet" />
          ) : (
            <ul className="flex flex-col gap-3">
              {batch.students.map((m) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <Avatar name={m.student.name} />
                  <span className="font-medium text-slate-900">{m.student.name}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming and past classes</CardTitle>
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
          <CardTitle>Share an assignment or test</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadResourceForm batchId={batch.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shared so far</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourcesTable resources={resources} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doubts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {batch.students.length === 0 ? (
            <EmptyState icon={<UsersIcon className="h-8 w-8" />} title="No students yet" />
          ) : (
            <>
              <DoubtStudentPicker
                basePath={`/teacher/batches/${batch.id}`}
                students={batch.students.map((m) => ({ id: m.student.id, name: m.student.name }))}
                selectedStudentId={selectedStudentId!}
                counts={doubtCounts}
              />
              <DoubtChat
                batchId={batch.id}
                studentId={selectedStudentId!}
                currentUserId={session!.user.id}
                messages={doubtMessages}
                readOnly={false}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
