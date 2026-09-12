'use client';

import { cancelClass } from '../actions';
import { buttonVariants } from '@/components/ui/button';
import { XIcon } from '@/components/ui/icons';

export function CancelClassButton({ classId, batchId }: { classId: string; batchId: string }) {
  return (
    <form action={cancelClass}>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="batchId" value={batchId} />
      <button type="submit" className={buttonVariants({ variant: 'danger', size: 'sm' })}>
        <XIcon className="h-3.5 w-3.5" />
        Cancel
      </button>
    </form>
  );
}
