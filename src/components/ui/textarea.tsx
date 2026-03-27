"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, "aria-invalid": ariaInvalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || ariaInvalid ? true : undefined}
        className={cn(
          "min-h-24 w-full rounded-md border bg-surface-emphasis px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-surface-muted",
          invalid
            ? "border-danger focus:border-danger focus:ring-2 focus:ring-team-beta-soft"
            : "border-border focus:border-primary focus:ring-2 focus:ring-team-alpha-soft",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
