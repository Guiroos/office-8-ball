import type { HTMLAttributes, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  inverse?: boolean;
  hideTitle?: boolean;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  inverse = false,
  hideTitle = false,
  titleClassName,
  descriptionClassName,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        actions ? "lg:flex-row lg:items-end lg:justify-between" : null,
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-3">
        <Badge
          variant={inverse ? "outline" : "default"}
          className={
            inverse
              ? "text-surface-strong-foreground-muted border-border-inverse bg-surface-strong-muted"
              : undefined
          }
        >
          {eyebrow}
        </Badge>
        <h2
          className={cn(
            "text-[length:var(--text-title)] leading-none font-black tracking-[-0.04em]",
            hideTitle && "sr-only",
            titleClassName,
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "text-sm leading-6 text-muted-foreground",
              inverse && "text-surface-strong-foreground-muted",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
