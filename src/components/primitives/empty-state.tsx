import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn("rounded-lg border border-border-strong bg-surface-emphasis p-5", className)}
      {...props}
    >
      {icon ? <div className="mb-3">{icon}</div> : null}
      {title ? (
        <strong className="block text-lg font-semibold">{title}</strong>
      ) : null}
      {description ? (
        <p className={cn("text-sm leading-6 text-muted-foreground", title && "mt-2")}>{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
