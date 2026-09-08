"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-neutral-100 text-neutral-800 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100",
        secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100",
        destructive: "bg-error-100 text-error-700 hover:bg-error-100 dark:bg-error-900/30 dark:text-error-400",
        success: "bg-success-100 text-success-700 hover:bg-success-100 dark:bg-success-900/30 dark:text-success-400",
        warning: "bg-warning-100 text-warning-700 hover:bg-warning-100 dark:bg-warning-900/30 dark:text-warning-400",
        primary: "bg-primary-100 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400",
        outline: "border border-neutral-300 bg-transparent hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };