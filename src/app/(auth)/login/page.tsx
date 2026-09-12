'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Field, Input, SubmitButton, ErrorText } from '@/components/form';

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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Log in</h1>
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

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        or, students only
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Continue with Google
      </button>
    </main>
  );
}
