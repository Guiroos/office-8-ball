import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const segmentedControlItemVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground transition-interactive outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      active: {
        true: "bg-primary text-primary-foreground shadow-sm",
        false: "hover:bg-surface hover:text-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

type SegmentedControlProps = React.HTMLAttributes<HTMLDivElement>;

export function SegmentedControl({ className, ...props }: SegmentedControlProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-2 rounded-lg border border-border bg-surface-emphasis p-2",
        className,
      )}
      {...props}
    />
  );
}

type SegmentedControlItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  asChild?: boolean;
};

export function SegmentedControlItem({
  className,
  active = false,
  asChild = false,
  ...props
}: SegmentedControlItemProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(segmentedControlItemVariants({ active }), className)}
      data-active={active}
      {...props}
    />
  );
}
