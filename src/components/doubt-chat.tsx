'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { postDoubtMessage } from '@/lib/doubt-actions';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/components/ui/cn';
import { ChatBubbleIcon } from '@/components/ui/icons';
import type { DoubtMessageRow } from '@/lib/doubts';

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Sending…' : 'Send'}
    </button>
  );
}

export function DoubtChat({
  batchId,
  studentId,
  currentUserId,
  messages,
  readOnly,
}: {
  batchId: string;
  studentId: string;
  currentUserId: string;
  messages: DoubtMessageRow[];
  readOnly: boolean;
}) {
  const [state, formAction] = useFormState(postDoubtMessage, undefined);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) {
      router.refresh();
      formRef.current?.reset();
    }
  }, [state, router]);

  useEffect(() => {
    if (readOnly) return;
    const interval = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(interval);
  }, [readOnly, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <EmptyState icon={<ChatBubbleIcon className="h-8 w-8" />} title="No doubts yet" />
      ) : (
        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
          {messages.map((message) => {
            const own = message.senderId === currentUserId;
            return (
              <div key={message.id} className={cn('flex items-end gap-2', own && 'flex-row-reverse')}>
                <Avatar name={message.senderName} className="mb-1" />
                <div className={cn('flex max-w-[75%] flex-col gap-1', own && 'items-end')}>
                  <span className="text-xs text-slate-400">
                    {message.senderName} · {new Date(message.createdAt).toLocaleString()}
                  </span>
                  <div
                    className={cn(
                      'rounded-xl px-3 py-2 text-sm',
                      own ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900',
                    )}
                  >
                    {message.imageUrl && (
                      <a href={message.imageUrl} target="_blank" rel="noreferrer" className="mb-1 block">
                        <img
                          src={message.imageUrl}
                          alt="Doubt attachment"
                          className="max-h-48 rounded-md object-cover"
                        />
                      </a>
                    )}
                    {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {!readOnly && (
        <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <input type="hidden" name="batchId" value={batchId} />
          <input type="hidden" name="studentId" value={studentId} />
          <input
            name="body"
            placeholder="Type a message…"
            className="h-10 min-w-[200px] flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            className="max-w-[10rem] text-xs text-slate-600 file:mr-2 file:h-9 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <SendButton />
          {state?.error && <p className="w-full text-sm font-medium text-rose-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
