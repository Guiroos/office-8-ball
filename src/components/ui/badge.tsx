import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-pill border px-3 py-1 label-xs backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-border-strong bg-surface-emphasis text-muted-foreground",
        gold:
          "border-gold bg-gold-soft text-foreground",
        frontend:
          "border-frontend bg-frontend-soft text-frontend",
        backend:
          "border-backend bg-backend-soft text-backend",
        outline:
          "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
