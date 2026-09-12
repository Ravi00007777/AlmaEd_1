'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { addClass } from '../actions';
import { Input, SubmitButton, ErrorText } from '@/components/form';

export function AddClassForm({ batchId }: { batchId: string }) {
  const [state, formAction] = useFormState(addClass, undefined);
  const router = useRouter();

  // revalidatePath() in the action invalidates the server cache, but a
  // useFormState-driven submission doesn't automatically re-render this
  // page's server-rendered class list — router.refresh() forces that.
  useEffect(() => {
    if (state && !state.error) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="batchId" value={batchId} />
      <Input name="scheduledAt" type="datetime-local" required />
      <SubmitButton>Schedule class</SubmitButton>
      <ErrorText>{state?.error}</ErrorText>
    </form>
  );
}
