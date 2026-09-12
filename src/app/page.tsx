import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, BookOpenIcon, CreditCardIcon } from '@/components/ui/icons';

const features = [
  {
    icon: CalendarIcon,
    title: 'Scheduled classes',
    description: 'One persistent Meet link per batch — no admin scrambling to send links before every session.',
  },
  {
    icon: BookOpenIcon,
    title: 'Assignments & tests',
    description: 'Teachers share PDFs with a deadline attached, students see them alongside every class.',
  },
  {
    icon: CreditCardIcon,
    title: 'Payments tracked',
    description: 'Admin keeps a clear record of what is paid and pending, all in one place.',
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-indigo-50 via-slate-50 to-slate-50 px-6 py-20">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          For teachers, students & parents
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Alma<span className="text-indigo-600">Ed</span>
        </h1>
        <p className="max-w-md text-lg text-slate-600">
          One dashboard for scheduled classes, assignments, and tests — no more juggling links.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className={buttonVariants({ size: 'lg' })}>
            Log in
          </Link>
        </div>
        <p className="text-sm text-slate-500">Accounts are added by your school admin — no public sign-up.</p>
      </div>

      <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="flex flex-col items-center gap-2 text-center">
              <feature.icon className="h-8 w-8 text-indigo-600" />
              <p className="font-semibold text-slate-900">{feature.title}</p>
              <p className="text-sm text-slate-500">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
