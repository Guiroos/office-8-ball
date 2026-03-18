import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type IconCalloutProps = HTMLAttributes<HTMLDivElement> & {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  tone?: "default" | "success" | "strong";
};

export function IconCallout({
  icon,
  title,
  description,
  tone = "default",
  className,
  ...props
}: IconCalloutProps) {
  const isStrong = tone === "strong";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-4 backdrop-blur-sm",
        tone === "success" &&
          "border-border bg-surface-success text-muted-foreground",
        tone === "default" &&
          "border-border bg-surface-emphasis text-foreground",
        isStrong &&
          "text-surface-strong-foreground border-border-inverse bg-surface-strong-muted",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-pill",
          tone === "success" && "bg-surface text-frontend",
          tone === "default" && "bg-gold-soft text-foreground",
          isStrong && "text-surface-strong-foreground-muted bg-surface-strong",
        )}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p
          className={cn(
            "text-sm leading-6",
            isStrong ? "text-surface-strong-foreground-muted" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
