import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <Link href="/" className="mb-6 text-lg font-bold text-slate-900">
        Alma<span className="text-indigo-600">Ed</span>
      </Link>
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Accounts are added by admin</h1>
          <p className="text-sm text-slate-500">
            AlmaEd doesn&rsquo;t have public sign-up. Ask your school admin to add you as a student, then log in
            below with the email and password (or Google account) they set up for you.
          </p>
          <Link href="/login" className={buttonVariants({ className: 'w-full' })}>
            Go to log in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
