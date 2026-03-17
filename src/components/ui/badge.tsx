import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-[var(--radius-pill)] border border-[color:var(--border-strong)] bg-[color:var(--surface-emphasis)] px-3 py-1 text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--foreground-soft)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
