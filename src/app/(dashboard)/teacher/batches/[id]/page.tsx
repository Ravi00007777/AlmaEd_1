import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UploadResourceForm } from './upload-form';
import { ResourcesTable } from '@/components/resources-table';
import { attachResourceDueDates } from '@/lib/resource-due-dates';

export default async function TeacherBatchPage({ params }: { params: { id: string } }) {
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">{batch.name}</h1>
        <p className="text-sm text-gray-600">{batch.scheduleNote ?? 'No schedule note'}</p>
        <a href={batch.meetLink} target="_blank" className="text-sm text-blue-600 underline">
          Open Meet link
        </a>
      </div>

      <section>
        <h2 className="mb-2 font-medium">Students</h2>
        <ul className="text-sm">
          {batch.students.map((m) => (
            <li key={m.id}>{m.student.name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Upcoming and past classes</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {batch.classes.map((cls) => (
            <li key={cls.id}>
              {new Date(cls.scheduledAt).toLocaleString()} — {cls.status}
            </li>
          ))}
          {batch.classes.length === 0 && <p className="text-gray-500">No classes yet.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Share an assignment or test</h2>
        <UploadResourceForm batchId={batch.id} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Shared so far</h2>
        <ResourcesTable resources={resources} />
      </section>
    </div>
  );
}
