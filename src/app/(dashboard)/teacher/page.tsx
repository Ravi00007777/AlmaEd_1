import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      <h1 className="mb-4 text-lg font-semibold">My batches</h1>
      <ul className="flex flex-col gap-3">
        {batches.map((batch) => (
          <li key={batch.id} className="rounded border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <Link href={`/teacher/batches/${batch.id}`} className="font-medium hover:underline">
                {batch.name}
              </Link>
              <span className="text-sm text-gray-500">{batch.students.length} students</span>
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {batch.classes.map((cls) => (
                <li key={cls.id} className="flex items-center justify-between">
                  <span>{new Date(cls.scheduledAt).toLocaleString()}</span>
                  <a
                    href={batch.meetLink}
                    target="_blank"
                    className="rounded bg-gray-900 px-3 py-1 text-white"
                  >
                    Join
                  </a>
                </li>
              ))}
              {batch.classes.length === 0 && (
                <li className="text-gray-500">No upcoming classes scheduled.</li>
              )}
            </ul>
          </li>
        ))}
        {batches.length === 0 && (
          <p className="text-sm text-gray-500">No batches assigned yet — check with admin.</p>
        )}
      </ul>
    </div>
  );
}
