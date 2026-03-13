import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--foreground)] text-[color:var(--foreground-inverse)] shadow-[0_12px_30px_rgba(13,18,14,0.18)] hover:-translate-y-0.5",
        ghost:
          "bg-transparent text-[color:var(--foreground)] hover:bg-white/60",
        frontend:
          "bg-[color:var(--frontend)] text-white shadow-[0_14px_30px_rgba(12,74,63,0.26)] hover:-translate-y-0.5",
        backend:
          "bg-[color:var(--backend)] text-white shadow-[0_14px_30px_rgba(124,45,36,0.24)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
