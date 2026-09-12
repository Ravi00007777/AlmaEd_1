'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { uploadResource } from './actions';
import { Field, Input, Select, SubmitButton, ErrorText } from '@/components/form';

export function UploadResourceForm({ batchId }: { batchId: string }) {
  const [state, formAction] = useFormState(uploadResource, undefined);
  const router = useRouter();

  // See AddClassForm for why this is needed: revalidatePath() alone
  // doesn't refresh a useFormState-driven page without this.
  useEffect(() => {
    if (state && !state.error) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="batchId" value={batchId} />
      <Field label="Title">
        <Input name="title" placeholder="e.g. Chapter 4 assignment" required className="w-48" />
      </Field>
      <Field label="Type">
        <Select name="type" defaultValue="ASSIGNMENT">
          <option value="ASSIGNMENT">Assignment</option>
          <option value="TEST">Test</option>
          <option value="NOTE">Note</option>
        </Select>
      </Field>
      <Field label="Deadline (optional)">
        <Input name="dueAt" type="datetime-local" />
      </Field>
      <Field label="File (PDF)">
        <input
          type="file"
          name="file"
          accept="application/pdf"
          required
          className="block text-sm text-slate-600 file:mr-3 file:h-10 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </Field>
      <SubmitButton>Share with batch</SubmitButton>
      <ErrorText>{state?.error}</ErrorText>
    </form>
  );
}
