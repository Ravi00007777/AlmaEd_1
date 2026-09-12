import { prisma } from '@/lib/prisma';

export default async function StudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { batchMemberships: true } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Students</h1>
      <p className="mb-4 text-sm text-gray-600">
        Students self-register. Assign them to a batch from the batch page.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Phone</th>
            <th className="py-2">Batches</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-gray-100">
              <td className="py-2">{student.name}</td>
              <td className="py-2">{student.email}</td>
              <td className="py-2">{student.phone ?? '—'}</td>
              <td className="py-2">{student._count.batchMemberships}</td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-500">
                No students yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
