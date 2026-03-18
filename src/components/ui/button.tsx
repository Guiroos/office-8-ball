"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:bg-foreground-soft focus-visible:ring-offset-background",
        ghost:
          "border border-border bg-surface-muted text-foreground hover:bg-surface-emphasis focus-visible:ring-offset-background",
        frontend:
          "bg-frontend text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-offset-background",
        backend:
          "bg-backend text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-offset-background",
        sidebar:
          "border border-[color:var(--app-shell-sidebar-border)] bg-[color:var(--app-shell-sidebar-hover)] text-sidebar-foreground hover:bg-[color:var(--app-shell-sidebar-active)]",
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
