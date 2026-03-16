import type { HTMLAttributes, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader className="gap-3">
        <Badge
          className={
            inverse
              ? "border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] text-[color:var(--surface-strong-foreground-muted)]"
              : undefined
          }
        >
          {eyebrow}
        </Badge>
        <CardTitle className={cn(hideTitle && "sr-only", titleClassName)}>{title}</CardTitle>
        {description ? (
          <CardDescription
            className={cn(
              inverse && "text-[color:var(--surface-strong-foreground-muted)]",
              descriptionClassName,
            )}
          >
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
