import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const surfacePanelVariants = cva("rounded-[var(--radius-xl)] border", {
  variants: {
    variant: {
      default: "border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow-lg)]",
      muted: "border-[color:var(--border)] bg-[color:var(--surface-emphasis)]",
      strong:
        "theme-text-strong border-[color:var(--border-inverse)] bg-[color:var(--surface-strong)]",
      brand:
        "theme-text-strong border-[color:var(--border-inverse)] bg-[color:var(--surface-brand)] shadow-[var(--shadow-brand)] backdrop-blur-xl",
    },
    padded: {
      true: "p-6",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    padded: false,
  },
});

export type SurfacePanelProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof surfacePanelVariants>;

export function SurfacePanel({
  className,
  variant,
  padded,
  ...props
}: SurfacePanelProps) {
  return (
    <div className={cn(surfacePanelVariants({ variant, padded }), className)} {...props} />
  );
}
