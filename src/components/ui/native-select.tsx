"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, invalid = false, "aria-invalid": ariaInvalid, ...props }, ref) => {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || ariaInvalid ? true : undefined}
        className={cn(
          "h-13 w-full rounded-md border bg-surface-emphasis px-4 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:bg-surface-muted",
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
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
