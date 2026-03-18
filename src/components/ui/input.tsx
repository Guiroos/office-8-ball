import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, "aria-invalid": ariaInvalid, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={invalid || ariaInvalid ? true : undefined}
        className={cn(
          "h-13 w-full rounded-md border bg-surface-emphasis px-4 text-foreground outline-none transition disabled:cursor-not-allowed disabled:bg-surface-muted",
          invalid
            ? "border-danger focus:border-danger focus:ring-2 focus:ring-backend-soft"
            : "border-border focus:border-frontend focus:ring-2 focus:ring-frontend-soft",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
