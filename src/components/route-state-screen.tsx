"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Home, RotateCcw } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RouteStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: "home" | "back" | "retry";
  tone?: "primary" | "secondary";
};

type RouteStateScreenProps = {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  nextStep: string;
  primaryAction: RouteStateAction;
  secondaryAction?: RouteStateAction;
};

const actionClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-pill px-5 text-sm font-semibold no-underline transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

function ActionIcon({ icon }: { icon: RouteStateAction["icon"] }) {
  if (icon === "back") {
    return <ArrowLeft className="size-4" />;
  }

  if (icon === "retry") {
    return <RotateCcw className="size-4" />;
  }

  return <Home className="size-4" />;
}

function RouteStateActionButton({ action }: { action: RouteStateAction }) {
  const className = cn(
    actionClassName,
    action.tone === "secondary"
      ? "border border-border bg-surface-muted !text-foreground hover:bg-surface-emphasis"
      : "bg-foreground text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:bg-foreground-soft",
  );

  const content = (
    <>
      <ActionIcon icon={action.icon} />
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={action.onClick}>
      {content}
    </button>
  );
}

export function RouteStateScreen({
  code,
  eyebrow,
  title,
  description,
  detail,
  nextStep,
  primaryAction,
  secondaryAction,
}: RouteStateScreenProps) {
  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[image:var(--brand-gradient)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(199,149,31,0.22),transparent_60%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="flex justify-end">
          <ThemeToggle className="h-11 rounded-sm px-4" />
        </div>

        <div className="grid items-stretch gap-4 lg:grid-cols-[0.88fr_1.12fr]">
          <section className="rounded-2xl border border-border-inverse bg-surface-brand p-6 text-surface-strong-foreground shadow-lg shadow-gold/35 sm:p-8">
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="space-y-4">
                <p className="label-wide text-surface-strong-foreground-muted">
                  {eyebrow}
                </p>
                <div className="space-y-3">
                  <p className="font-display headline leading-none tracking-[0.08em] text-gold">
                    {code}
                  </p>
                  <h1 className="max-w-md title text-surface-strong-foreground">
                    {title}
                  </h1>
                </div>
                <p className="max-w-lg text-base leading-7 text-surface-strong-foreground-muted sm:text-lg">
                  {description}
                </p>
              </div>
            </div>
          </section>

          <Card className="border-border-inverse bg-surface/96 backdrop-blur">
            <CardHeader className="gap-5 p-6 sm:p-8">
              <div className="flex size-14 items-center justify-center rounded-md bg-gold-soft text-gold">
                <AlertTriangle className="size-7" />
              </div>
              <div className="space-y-3">
                <CardTitle>{title}</CardTitle>
                <CardDescription className="max-w-2xl text-base">{detail}</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="rounded-lg border border-border bg-surface-emphasis p-5">
                <p className="caption text-muted-foreground">
                  Proxima jogada
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-soft">
                  {nextStep}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <RouteStateActionButton action={primaryAction} />
                {secondaryAction ? <RouteStateActionButton action={secondaryAction} /> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
