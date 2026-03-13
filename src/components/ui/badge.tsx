import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-white/40 bg-white/50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
