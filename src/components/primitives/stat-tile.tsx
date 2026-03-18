import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatTileProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  tone?: "default" | "inverse";
};

export function StatTile({
  label,
  value,
  description,
  tone = "default",
  className,
  ...props
}: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border p-4 backdrop-blur-sm",
        tone === "inverse"
          ? "border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)]"
          : "border-[color:var(--border)] bg-[color:var(--surface-emphasis)]",
        className,
      )}
      {...props}
    >
      <p
        className={cn(
          "text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)]",
          tone === "inverse" ? "theme-text-strong-muted" : "text-[color:var(--foreground-soft)]",
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "mt-2",
          tone === "inverse" ? "theme-text-strong" : null,
        )}
      >
        {typeof value === "string" || typeof value === "number" ? (
          <p className="text-lg font-semibold">{value}</p>
        ) : (
          value
        )}
      </div>
      {description ? (
        <p
          className={cn(
            "mt-1 text-sm",
            tone === "inverse" ? "theme-text-strong-muted" : "text-[color:var(--foreground-soft)]",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
