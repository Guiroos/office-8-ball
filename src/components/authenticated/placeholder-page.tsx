import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  nextStep,
}: PlaceholderPageProps) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <section className="relative overflow-hidden rounded-2xl border border-border-inverse bg-[image:var(--brand-gradient)] px-6 py-8 text-surface-strong-foreground shadow-brand sm:px-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%)]"
        />
        <p className="label-wide text-surface-strong-foreground-muted">
          {eyebrow}
        </p>
        <h1 className="relative mt-3 max-w-3xl text-4xl font-black tracking-[-0.05em] text-surface-strong-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-surface-strong-foreground-muted sm:text-lg">
          {description}
        </p>
      </section>

      <Card className="border-border-strong bg-surface-emphasis shadow-[0_24px_60px_rgba(75,53,28,0.12)] backdrop-blur">
        <CardHeader className="gap-3 p-6 sm:p-8">
          <CardTitle>Area em preparacao</CardTitle>
          <CardDescription className="text-base">{nextStep}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-foreground-inverse shadow-sm transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Voltar para dashboard
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
