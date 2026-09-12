import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AddClassForm } from './add-class-form';
import { CancelClassButton } from './cancel-class-button';
import { ResourcesTable } from '@/components/resources-table';
import { attachResourceDueDates } from '@/lib/resource-due-dates';

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const batch = await prisma.batch.findUnique({
    where: { id: params.id },
    include: {
      teacher: true,
      students: { include: { student: true } },
      classes: { orderBy: { scheduledAt: 'desc' }, take: 20 },
      resources: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!batch) notFound();

  const resources = await attachResourceDueDates(batch.resources);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">{batch.name}</h1>
        <p className="text-sm text-gray-600">
          Teacher: {batch.teacher.name} · {batch.scheduleNote ?? 'No schedule note'}
        </p>
        <p className="text-sm text-gray-600">
          Meet link:{' '}
          <a href={batch.meetLink} target="_blank" className="text-blue-600 underline">
            {batch.meetLink}
          </a>
        </p>
      </div>

      <section>
        <h2 className="mb-2 font-medium">Students</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {batch.students.map((membership) => (
            <li key={membership.id}>
              {membership.student.name} ({membership.student.email})
            </li>
          ))}
          {batch.students.length === 0 && <p className="text-gray-500">No students yet.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Schedule a class</h2>
        <AddClassForm batchId={batch.id} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Classes</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {batch.classes.map((cls) => (
            <li key={cls.id} className="flex items-center justify-between border-b border-gray-100 py-1">
              <span>
                {new Date(cls.scheduledAt).toLocaleString()} — {cls.status}
              </span>
              {cls.status === 'SCHEDULED' && (
                <CancelClassButton classId={cls.id} batchId={batch.id} />
              )}
            </li>
          ))}
          {batch.classes.length === 0 && <p className="text-gray-500">No classes scheduled yet.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Resources shared</h2>
        <ResourcesTable resources={resources} />
      </section>
    </div>
  );
}
