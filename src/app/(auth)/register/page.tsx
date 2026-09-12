'use client';

import { useFormState } from 'react-dom';
import { signIn } from 'next-auth/react';
import { registerStudent } from './actions';
import { Field, Input, SubmitButton, ErrorText } from '@/components/form';

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerStudent, undefined);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Register as a student</h1>
      <p className="text-sm text-gray-600">
        This account can also be used by your parent to log in and see your schedule.
      </p>

      <button
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        or, with email and password
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        <Field label="Name">
          <Input name="name" required autoComplete="name" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Phone (optional)">
          <Input name="phone" type="tel" autoComplete="tel" />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <ErrorText>{state?.error}</ErrorText>
        <SubmitButton>Register</SubmitButton>
      </form>
    </main>
  );
}
