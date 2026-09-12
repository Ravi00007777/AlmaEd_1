import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminHomePage() {
  const [teacherCount, studentCount, batchCount, pendingPayments] = await Promise.all([
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.batch.count(),
    prisma.payment.count({ where: { status: 'PENDING' } }),
  ]);

  const cards = [
    { label: 'Teachers', value: teacherCount, href: '/admin/teachers' },
    { label: 'Students', value: studentCount, href: '/admin/students' },
    { label: 'Batches', value: batchCount, href: '/admin/batches' },
    { label: 'Pending payments', value: pendingPayments, href: '/admin/payments' },
  ];

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Admin overview</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded border border-gray-200 bg-white p-4 hover:border-gray-400"
          >
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
