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
        "rounded-lg border p-4 backdrop-blur-sm",
        tone === "inverse"
          ? "border-border-inverse bg-surface-strong-muted"
          : "border-border bg-surface-emphasis",
        className,
      )}
      {...props}
    >
      <p
        className={cn(
          "label-xs",
          tone === "inverse" ? "text-surface-strong-foreground-muted" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "mt-2",
          tone === "inverse" ? "text-surface-strong-foreground" : null,
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
            tone === "inverse" ? "text-surface-strong-foreground-muted" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
