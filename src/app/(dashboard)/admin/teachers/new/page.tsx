'use client';

import { useFormState } from 'react-dom';
import { createTeacher } from '../actions';
import { Field, Input, SubmitButton, ErrorText } from '@/components/form';

export default function NewTeacherPage() {
  const [state, formAction] = useFormState(createTeacher, undefined);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-lg font-semibold">Add a teacher</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <Field label="Name">
          <Input name="name" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required />
        </Field>
        <Field label="Phone (optional)">
          <Input name="phone" type="tel" />
        </Field>
        <Field label="Temporary password">
          <Input name="password" type="password" required minLength={8} />
        </Field>
        <ErrorText>{state?.error}</ErrorText>
        <SubmitButton>Create teacher account</SubmitButton>
      </form>
    </div>
  );
}
