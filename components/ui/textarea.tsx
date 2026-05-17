import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[140px] w-full rounded-lg border border-[color:var(--color-input)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm text-[color:var(--color-foreground)] shadow-sm placeholder:text-[color:var(--color-muted-foreground)] transition-colors focus-visible:border-[color:var(--color-khuzama-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]/40 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
