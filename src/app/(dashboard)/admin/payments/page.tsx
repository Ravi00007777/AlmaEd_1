import { prisma } from '@/lib/prisma';
import { NewPaymentForm } from './new-payment-form';
import { markPaymentStatus } from './actions';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { PaymentStatusBadge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { CreditCardIcon } from '@/components/ui/icons';

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
        <PageHeader title="Payments" />
        <Card>
          <CardHeader>
            <CardTitle>Record a payment</CardTitle>
          </CardHeader>
          <CardContent>
            <NewPaymentForm students={students} teachers={teachers} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-5">
          {payments.length === 0 ? (
            <EmptyState icon={<CreditCardIcon className="h-8 w-8" />} title="No payments recorded yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.student.name}</TableCell>
                    <TableCell>{payment.teacher.name}</TableCell>
                    <TableCell>{payment.amount.toString()}</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell>{payment.note ?? '—'}</TableCell>
                    <TableCell>
                      <form action={markPaymentStatus}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={payment.status === 'PAID' ? 'PENDING' : 'PAID'}
                        />
                        <button type="submit" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                          Mark {payment.status === 'PAID' ? 'pending' : 'paid'}
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
