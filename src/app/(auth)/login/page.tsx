'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Field, Input, SubmitButton, ErrorText } from '@/components/form';
import { Card, CardContent } from '@/components/ui/card';
import { GoogleLogoIcon } from '@/components/ui/icons';

export default function LoginPage() {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  // Read directly from window instead of next/navigation's useSearchParams,
  // which would force this page out of static rendering (needs a Suspense
  // boundary otherwise) just to show one optional error message.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'AccessDenied') {
      setError('That Google account isn’t a student account on this platform.');
    }
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(undefined);

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Incorrect email or password.');
      return;
    }

    window.location.href = '/';
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <Link href="/" className="mb-6 text-lg font-bold text-slate-900">
        Alma<span className="text-indigo-600">Ed</span>
      </Link>
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
          <form action={handleSubmit} className="flex flex-col gap-3">
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" required autoComplete="current-password" />
            </Field>
            <ErrorText>{error}</ErrorText>
            <SubmitButton>{loading ? 'Logging in...' : 'Log in'}</SubmitButton>
          </form>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            or, students only
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <GoogleLogoIcon className="h-4 w-4" />
            Continue with Google
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
