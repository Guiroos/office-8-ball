"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 ease-out outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "btn-gold-gradient text-foreground shadow-brand font-extrabold uppercase tracking-label hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(199,149,31,0.65)] active:translate-y-px active:scale-[0.98] active:shadow-brand focus-visible:ring-offset-background",
        ghost:
          "border border-border bg-surface-muted text-foreground hover:-translate-y-0.5 hover:bg-surface-emphasis active:translate-y-px active:scale-[0.98] focus-visible:ring-offset-background",
        "team-alpha":
          "bg-gradient-to-br from-blue-700 to-blue-500 text-foreground-inverse font-extrabold uppercase tracking-label shadow-[0_6px_20px_rgba(42,95,156,0.5)] hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(42,95,156,0.65)] active:translate-y-px active:scale-[0.98] active:shadow-[0_3px_10px_rgba(42,95,156,0.35)] focus-visible:ring-offset-background",
        "team-beta":
          "bg-gradient-to-br from-red-700 to-red-500 text-foreground-inverse font-extrabold uppercase tracking-label shadow-[0_6px_20px_rgba(159,61,49,0.5)] hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(159,61,49,0.65)] active:translate-y-px active:scale-[0.98] active:shadow-[0_3px_10px_rgba(159,61,49,0.35)] focus-visible:ring-offset-background",
        sidebar:
          "border border-sidebar-border bg-sidebar-hover text-sidebar-foreground hover:bg-sidebar-active",
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
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
