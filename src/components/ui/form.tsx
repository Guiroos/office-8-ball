import * as React from "react";

import { cn } from "@/lib/utils";

export function Field({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-sm font-semibold text-[color:var(--foreground-soft)]",
        className,
      )}
      {...props}
    />
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, "aria-invalid": ariaInvalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || ariaInvalid ? true : undefined}
        className={cn(
          "h-13 w-full rounded-[20px] border bg-[color:var(--surface-emphasis)] px-4 text-[color:var(--foreground)] outline-none transition disabled:cursor-not-allowed disabled:bg-[color:var(--surface-muted)]",
          invalid
            ? "border-[color:var(--danger)] focus:border-[color:var(--danger)] focus:ring-2 focus:ring-[color:var(--backend-soft)]"
            : "border-[color:var(--border)] focus:border-[color:var(--frontend)] focus:ring-2 focus:ring-[color:var(--frontend-soft)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export function FieldError({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) {
    return null;
  }

  return (
    <p className={cn("text-sm text-[color:var(--danger)]", className)} {...props}>
      {children}
    </p>
  );
}
