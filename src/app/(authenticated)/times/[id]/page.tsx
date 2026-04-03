import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TeamH2HSection } from "@/components/teams/team-h2h-section";
import { TeamMainSection } from "@/components/teams/team-main-section";
import { getAuthenticatedUser, hasDatabaseUrl } from "@/lib/auth";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Detalhe do Time | Office 8 Ball",
  description: "Detalhes do time, estatísticas, membros e confrontos diretos.",
};

function TeamMainSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl border border-border-strong bg-surface-emphasis p-5 shadow-sm shadow-foreground/10 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <div className="h-7 w-48 rounded-md bg-surface-muted" />
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-pill bg-surface-muted" />
              <div className="h-6 w-20 rounded-pill bg-surface-muted" />
              <div className="h-6 w-24 rounded-pill bg-surface-muted" />
            </div>
            <div className="h-3 w-full max-w-lg rounded-pill bg-surface-muted" />
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="h-9 w-36 rounded-xl bg-surface-muted" />
            <div className="h-9 w-28 rounded-xl bg-surface-muted" />
          </div>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="space-y-1 rounded-xl border border-border bg-surface p-4 shadow-sm shadow-foreground/5"
          >
            <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
            <div className="h-8 w-16 rounded-md bg-surface-emphasis" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="h-3 w-10 rounded-pill bg-surface-emphasis" />
              <div className="h-5 w-24 rounded-md bg-surface-emphasis" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-surface-emphasis" />
                <div className="space-y-1">
                  <div className="h-4 w-28 rounded-md bg-surface-emphasis" />
                  <div className="h-3 w-16 rounded-pill bg-surface-emphasis" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="h-3 w-16 rounded-pill bg-surface-emphasis" />
              <div className="h-5 w-36 rounded-md bg-surface-emphasis" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-emphasis p-3"
              >
                <div className="h-3 w-28 rounded-pill bg-surface-muted" />
                <div className="h-5 w-16 rounded-pill bg-surface-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TeamH2HSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
          <div className="h-5 w-40 rounded-md bg-surface-emphasis" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-emphasis" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          Detalhes do time indisponíveis sem banco configurado.
        </p>
      </main>
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    notFound();
  }

  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Suspense fallback={<TeamMainSkeleton />}>
        <TeamMainSection teamId={id} userId={user.id} />
      </Suspense>
      <Suspense fallback={<TeamH2HSkeleton />}>
        <TeamH2HSection teamId={id} userId={user.id} />
      </Suspense>
    </main>
  );
}
