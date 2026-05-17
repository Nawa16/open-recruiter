import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium leading-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] shadow-[var(--shadow-soft)] hover:bg-[color:var(--color-primary-hover)] hover:shadow-[var(--shadow-lift)] active:translate-y-px",
        outline:
          "border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)] hover:border-[color:var(--color-khuzama-300)] hover:bg-[color:var(--color-primary-soft)]",
        soft:
          "bg-[color:var(--color-primary-soft)] text-[color:var(--color-khuzama-700)] hover:bg-[color:var(--color-khuzama-200)] dark:text-[color:var(--color-khuzama-300)]",
        ghost:
          "text-[color:var(--color-foreground)] hover:bg-[color:var(--color-primary-soft)]",
        destructive:
          "bg-[color:var(--color-destructive)] text-white shadow-[var(--shadow-soft)] hover:opacity-90 active:translate-y-px",
        "destructive-outline":
          "border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive-soft)] text-[color:var(--color-destructive)] hover:border-[color:var(--color-destructive)]/60",
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
