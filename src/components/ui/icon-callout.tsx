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
        "flex items-start gap-3 rounded-[var(--radius-md)] border p-4 backdrop-blur-sm",
        tone === "success" &&
          "border-[color:var(--border)] bg-[color:var(--surface-success)] text-[color:var(--foreground-soft)]",
        tone === "default" &&
          "border-[color:var(--border)] bg-[color:var(--surface-emphasis)] text-[color:var(--foreground)]",
        isStrong &&
          "theme-text-strong border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-pill)]",
          tone === "success" && "bg-[color:var(--surface)] text-[color:var(--frontend)]",
          tone === "default" && "bg-[color:var(--gold-soft)] text-[color:var(--foreground)]",
          isStrong && "theme-text-strong-muted bg-[color:var(--surface-strong)]",
        )}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p
          className={cn(
            "text-sm leading-6",
            isStrong ? "theme-text-strong-muted" : "text-[color:var(--foreground-soft)]",
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
