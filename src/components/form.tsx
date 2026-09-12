'use client';

import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { useFormStatus } from 'react-dom';

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-500 focus:outline-none ${className ?? ''}`}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded border border-gray-300 px-3 py-2 text-sm font-normal focus:border-gray-500 focus:outline-none ${className ?? ''}`}
    />
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  // useFormStatus tracks the nearest parent <form>'s pending state — this
  // disables the button automatically while a submission is in flight, so
  // a slow response (this app has hit multi-second ones) can't be mistaken
  // for "not responding" and clicked repeatedly into duplicate records.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Please wait…' : children}
    </button>
  );
}

export function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="text-sm text-red-600">{children}</p>;
}
