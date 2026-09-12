import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { UsersIcon, GraduationCapIcon, BookOpenIcon, CreditCardIcon } from '@/components/ui/icons';

export default async function AdminHomePage() {
  const [teacherCount, studentCount, batchCount, pendingPayments] = await Promise.all([
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.batch.count(),
    prisma.payment.count({ where: { status: 'PENDING' } }),
  ]);

  const cards = [
    { label: 'Teachers', value: teacherCount, href: '/admin/teachers', icon: UsersIcon, tint: 'bg-indigo-50 text-indigo-600' },
    { label: 'Students', value: studentCount, href: '/admin/students', icon: GraduationCapIcon, tint: 'bg-teal-50 text-teal-600' },
    { label: 'Batches', value: batchCount, href: '/admin/batches', icon: BookOpenIcon, tint: 'bg-amber-50 text-amber-600' },
    { label: 'Pending payments', value: pendingPayments, href: '/admin/payments', icon: CreditCardIcon, tint: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div>
      <PageHeader title="Admin overview" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="p-5 transition-shadow hover:shadow-md">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.tint}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
