import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";

import { TeamCard } from "@/components/teams/team-card";
import { TeamCreateForm } from "@/components/teams/team-create-form";
import { IconCallout } from "@/components/primitives/icon-callout";
import { getAuthenticatedUser, hasDatabaseUrl } from "@/lib/auth";
import { listUserTeams } from "@/lib/teams";

export const metadata: Metadata = {
  title: "Times | Office 8 Ball",
  description: "Área de times com abas de listagem e criação.",
};

type TeamsPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const resolved = (await searchParams) ?? {};
  const tab = resolved.tab === "create" ? "create" : "teams";
  const databaseReady = hasDatabaseUrl();
  const user = databaseReady ? await getAuthenticatedUser() : null;
  const teams =
    databaseReady && user
      ? await listUserTeams(user.id)
      : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="label-wide text-muted-foreground">Área de times</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          {tab === "create" ? "Criar novo time" : "Meus times"}
          {tab === "teams" && teams.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {teams.length} {teams.length === 1 ? "time" : "times"}
            </span>
          )}
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/times?tab=teams"
          className={`rounded-pill border px-4 py-2 text-sm transition-colors ${tab === "teams" ? "border-primary bg-primary text-foreground-inverse" : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:bg-surface-emphasis hover:text-foreground"}`}
        >
          Meus Times
        </Link>
        <Link
          href="/times?tab=create"
          className={`rounded-pill border px-4 py-2 text-sm transition-colors ${tab === "create" ? "border-primary bg-primary text-foreground-inverse" : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:bg-surface-emphasis hover:text-foreground"}`}
        >
          Criar Novo Time
        </Link>
      </div>

      <div className={`mt-6 ${tab === "teams" ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
        <section className="space-y-3">
          {tab === "teams" ? (
            teams.length > 0 ? (
              teams.map((team) => <TeamCard key={team.id} team={team} />)
            ) : (
              <div className="space-y-3 pt-1">
                <IconCallout
                  icon={<Users className="size-4" />}
                  title="Nenhum time ainda"
                  description="Crie seu primeiro time para começar a registrar partidas e acompanhar o ranking."
                />
                <Link
                  href="/times?tab=create"
                  className="inline-flex rounded-pill border border-primary bg-primary px-4 py-2 text-sm text-foreground-inverse transition-colors hover:opacity-90"
                >
                  Criar primeiro time
                </Link>
              </div>
            )
          ) : (
            <TeamCreateForm />
          )}
        </section>

        {tab === "teams" && (
          <aside className="hidden rounded-lg border border-border bg-surface p-5 lg:block">
            <h2 className="text-sm font-semibold">Criar Novo Time</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Configure um time solo ou em dupla para registrar partidas.
            </p>
            <Link
              href="/times?tab=create"
              className="mt-4 inline-flex rounded-pill border border-primary bg-primary px-4 py-2 text-sm text-foreground-inverse transition-colors hover:opacity-90"
            >
              Criar Novo Time
            </Link>
          </aside>
        )}
      </div>
    </main>
  );
}
