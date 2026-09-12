'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createPayment } from './actions';
import { Field, Input, Select, SubmitButton, ErrorText } from '@/components/form';

type Person = { id: string; name: string; email: string };

export function NewPaymentForm({ students, teachers }: { students: Person[]; teachers: Person[] }) {
  const [state, formAction] = useFormState(createPayment, undefined);
  const router = useRouter();

  // See AddClassForm for why this is needed: revalidatePath() alone
  // doesn't refresh a useFormState-driven page without this.
  useEffect(() => {
    if (state && !state.error) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <Field label="Student">
        <Select name="studentId" required defaultValue="">
          <option value="" disabled>
            Select
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Teacher">
        <Select name="teacherId" required defaultValue="">
          <option value="" disabled>
            Select
          </option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Amount">
        <Input name="amount" type="number" step="0.01" min="0" required className="w-28" />
      </Field>
      <Field label="Note (optional)">
        <Input name="note" className="w-40" />
      </Field>
      <SubmitButton>Add payment record</SubmitButton>
      <ErrorText>{state?.error}</ErrorText>
    </form>
  );
}
