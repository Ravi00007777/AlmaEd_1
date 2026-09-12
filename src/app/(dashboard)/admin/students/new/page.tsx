'use client';

import { useFormState } from 'react-dom';
import { createStudent } from '../actions';
import { Field, Input, SubmitButton, ErrorText } from '@/components/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function NewStudentPage() {
  const [state, formAction] = useFormState(createStudent, undefined);

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Add a student</CardTitle>
        </CardHeader>
        <CardContent>
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
            <Field label="Password (optional)">
              <Input name="password" type="password" minLength={8} />
            </Field>
            <p className="-mt-1 text-xs text-slate-500">
              Leave blank if this student will only sign in with &ldquo;Continue with Google&rdquo; using the
              same email.
            </p>
            <ErrorText>{state?.error}</ErrorText>
            <SubmitButton>Create student account</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
