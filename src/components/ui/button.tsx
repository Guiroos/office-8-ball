"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-interactive outline-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-gold-gradient text-foreground shadow-sm shadow-gold/35 font-extrabold uppercase tracking-label hover:-translate-y-0.5 hover:shadow-md hover:shadow-gold/35 active:translate-y-px active:scale-98 active:shadow-sm active:shadow-gold/35 focus-visible:ring-offset-background",
        ghost:
          "border border-border bg-surface-muted text-foreground hover:-translate-y-0.5 hover:bg-surface-emphasis active:translate-y-px active:scale-98 focus-visible:ring-offset-background",
        "team-alpha":
          "bg-gradient-to-br from-team-alpha to-team-alpha-light text-foreground-inverse font-extrabold uppercase tracking-label shadow-sm shadow-team-alpha/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-team-alpha/30 active:translate-y-px active:scale-98 active:shadow-xs active:shadow-team-alpha/30 focus-visible:ring-offset-background",
        "team-beta":
          "bg-gradient-to-br from-team-beta to-team-beta-light text-foreground-inverse font-extrabold uppercase tracking-label shadow-sm shadow-team-beta/28 hover:-translate-y-0.5 hover:shadow-md hover:shadow-team-beta/28 active:translate-y-px active:scale-98 active:shadow-xs active:shadow-team-beta/28 focus-visible:ring-offset-background",
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
