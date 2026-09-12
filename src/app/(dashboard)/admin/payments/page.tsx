import { prisma } from '@/lib/prisma';
import { NewPaymentForm } from './new-payment-form';
import { markPaymentStatus } from './actions';

export default async function PaymentsPage() {
  const [payments, students, teachers] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { student: true, teacher: true },
    }),
    prisma.user.findMany({ where: { role: 'STUDENT' }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { role: 'TEACHER' }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-4 text-lg font-semibold">Payments</h1>
        <NewPaymentForm students={students} teachers={teachers} />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2">Student</th>
            <th className="py-2">Teacher</th>
            <th className="py-2">Amount</th>
            <th className="py-2">Status</th>
            <th className="py-2">Note</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-gray-100">
              <td className="py-2">{payment.student.name}</td>
              <td className="py-2">{payment.teacher.name}</td>
              <td className="py-2">{payment.amount.toString()}</td>
              <td className="py-2">{payment.status}</td>
              <td className="py-2">{payment.note ?? '—'}</td>
              <td className="py-2">
                <form action={markPaymentStatus}>
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={payment.status === 'PAID' ? 'PENDING' : 'PAID'}
                  />
                  <button type="submit" className="text-blue-600 hover:underline">
                    Mark {payment.status === 'PAID' ? 'pending' : 'paid'}
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-500">
                No payments recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
