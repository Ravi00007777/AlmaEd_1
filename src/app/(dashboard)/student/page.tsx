import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      <h1 className="mb-4 text-lg font-semibold">My classes</h1>
      <ul className="flex flex-col gap-3">
        {memberships.map(({ batch }) => (
          <li key={batch.id} className="rounded border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <Link href={`/student/batches/${batch.id}`} className="font-medium hover:underline">
                {batch.name}
              </Link>
              <span className="text-sm text-gray-500">with {batch.teacher.name}</span>
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
        {memberships.length === 0 && (
          <p className="text-sm text-gray-500">You haven&apos;t been assigned to a batch yet.</p>
        )}
      </ul>
    </div>
  );
}
