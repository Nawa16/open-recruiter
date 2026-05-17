import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg border border-[color:var(--color-input)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-foreground)] shadow-sm placeholder:text-[color:var(--color-muted-foreground)] transition-colors focus-visible:border-[color:var(--color-khuzama-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]/40 disabled:cursor-not-allowed disabled:opacity-50 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-[color:var(--color-primary-soft)] file:px-2 file:py-1 file:text-xs file:font-medium file:text-[color:var(--color-khuzama-700)] file:hover:bg-[color:var(--color-khuzama-200)] dark:file:text-[color:var(--color-khuzama-300)]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
