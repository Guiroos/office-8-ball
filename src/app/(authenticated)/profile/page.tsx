import { Suspense } from "react";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";

import { ProfileHeroSection } from "@/components/profile/profile-hero-section";
import { ProfileStatsSection } from "@/components/profile/profile-stats-section";
import { IconCallout } from "@/components/primitives/icon-callout";
import { getAuthenticatedUser, hasDatabaseUrl } from "@/lib/auth";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Perfil | Office 8 Ball",
  description: "Página de perfil do usuário autenticado.",
};

function ProfileHeroSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 rounded-md bg-surface-emphasis" />
      <div className="rounded-xl border border-border bg-surface p-6 lg:p-10">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="size-24 shrink-0 rounded-full bg-surface-emphasis" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-40 rounded-md bg-surface-emphasis" />
            <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
            <div className="h-3 w-36 rounded-pill bg-surface-emphasis" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-4 rounded bg-surface-emphasis" />
              <div className="h-3 w-16 rounded-pill bg-surface-emphasis" />
              <div className="ml-auto h-3 w-24 rounded-pill bg-surface-emphasis" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileStatsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-1 rounded-xl border border-border bg-surface p-4 shadow-sm shadow-foreground/5"
          >
            <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
            <div className="h-8 w-16 rounded-md bg-surface-emphasis" />
          </div>
        ))}
      </section>
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="h-3 w-14 rounded-pill bg-surface-emphasis" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-emphasis p-3"
            >
              <div className="space-y-1">
                <div className="h-4 w-36 rounded-md bg-surface-muted" />
                <div className="h-3 w-20 rounded-pill bg-surface-muted" />
              </div>
              <div className="h-6 w-16 rounded-pill bg-surface-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ProfileRoute() {
  if (!hasDatabaseUrl()) {
    return (
      <IconCallout
        icon={<Trophy className="size-5" />}
        title="Perfil indisponível sem conexão ao banco de dados."
        description="Tente novamente mais tarde."
      />
    );
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <IconCallout
        icon={<Trophy className="size-5" />}
        title="Perfil indisponível."
        description="Você precisa estar autenticado para ver o perfil."
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Suspense fallback={<ProfileHeroSkeleton />}>
        <ProfileHeroSection userId={user.id} />
      </Suspense>
      <Suspense fallback={<ProfileStatsSkeleton />}>
        <ProfileStatsSection userId={user.id} />
      </Suspense>
    </main>
  );
}
