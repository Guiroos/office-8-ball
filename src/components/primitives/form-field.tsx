import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldError({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p className={cn("text-sm text-danger", className)} {...props}>
      {children}
    </p>
  );
}
