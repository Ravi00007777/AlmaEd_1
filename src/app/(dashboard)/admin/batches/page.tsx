import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function BatchesPage() {
  const batches = await prisma.batch.findMany({
    orderBy: { createdAt: 'desc' },
    include: { teacher: true, _count: { select: { students: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Batches</h1>
        <Link href="/admin/batches/new" className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white">
          Create batch
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {batches.map((batch) => (
          <li key={batch.id}>
            <Link
              href={`/admin/batches/${batch.id}`}
              className="flex items-center justify-between rounded border border-gray-200 bg-white px-4 py-3 text-sm hover:border-gray-400"
            >
              <span className="font-medium">{batch.name}</span>
              <span className="text-gray-500">
                {batch.teacher.name} · {batch._count.students} student
                {batch._count.students === 1 ? '' : 's'}
              </span>
            </Link>
          </li>
        ))}
        {batches.length === 0 && <p className="text-sm text-gray-500">No batches yet.</p>}
      </ul>
    </div>
  );
}
