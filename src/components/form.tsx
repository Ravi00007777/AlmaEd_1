'use client';

import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/components/ui/cn';
import { buttonVariants } from '@/components/ui/button';

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

const fieldControlClasses =
  'h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldControlClasses, className)} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldControlClasses, className)} />;
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  // useFormStatus tracks the nearest parent <form>'s pending state — this
  // disables the button automatically while a submission is in flight, so
  // a slow response (this app has hit multi-second ones) can't be mistaken
  // for "not responding" and clicked repeatedly into duplicate records.
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={buttonVariants()}>
      {pending ? 'Please wait…' : children}
    </button>
  );
}

export function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="text-sm font-medium text-rose-600">{children}</p>;
}
