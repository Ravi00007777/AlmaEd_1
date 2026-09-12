import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  info: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
};

type BadgeProps = { variant?: BadgeVariant } & HTMLAttributes<HTMLSpanElement>;

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ClassStatusBadge({ status }: { status: string }) {
  if (status === 'CANCELLED') return <Badge variant="danger">Cancelled</Badge>;
  return <Badge variant="success">Scheduled</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  if (status === 'PAID') return <Badge variant="success">Paid</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

export function ResourceTypeBadge({ type }: { type: string }) {
  if (type === 'ASSIGNMENT') return <Badge variant="info">Assignment</Badge>;
  if (type === 'TEST') return <Badge variant="danger">Test</Badge>;
  return <Badge variant="neutral">Note</Badge>;
}
