import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--color-primary-soft)] text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]",
        outline:
          "border border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)]",
        success:
          "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]",
        destructive:
          "bg-[color:var(--color-destructive-soft)] text-[color:var(--color-destructive)]",
        muted:
          "bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
