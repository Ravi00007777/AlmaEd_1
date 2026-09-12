import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function TeachersPage() {
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { teachingBatches: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Teachers</h1>
        <Link href="/admin/teachers/new" className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white">
          Add teacher
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Batches</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id} className="border-b border-gray-100">
              <td className="py-2">{teacher.name}</td>
              <td className="py-2">{teacher.email}</td>
              <td className="py-2">{teacher._count.teachingBatches}</td>
            </tr>
          ))}
          {teachers.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-center text-gray-500">
                No teachers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
