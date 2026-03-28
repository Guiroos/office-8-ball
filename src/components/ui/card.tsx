import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-lg border", {
  variants: {
    variant: {
      default: "border-border bg-surface shadow-lg",
      muted: "border-border bg-surface-emphasis",
      strong:
        "text-surface-strong-foreground border-border-inverse bg-surface-strong",
      brand:
        "text-surface-strong-foreground border-border-inverse bg-surface-brand shadow-lg shadow-gold/35 backdrop-blur-xl",
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

export type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

export function Card({ className, variant, padded, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant, padded }), className)} {...props} />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("title leading-none", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}
