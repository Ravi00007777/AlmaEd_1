'use client';

import { cancelClass } from '../actions';

export function CancelClassButton({ classId, batchId }: { classId: string; batchId: string }) {
  return (
    <form action={cancelClass}>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="batchId" value={batchId} />
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Cancel
      </button>
    </form>
  );
}
