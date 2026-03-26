import type { Metadata } from "next";
import Link from "next/link";

import { TeamCard } from "@/components/teams/team-card";
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
      <div className="flex flex-wrap gap-2">
        <Link
          href="/times?tab=teams"
          className={`rounded-pill border px-4 py-2 text-sm ${tab === "teams" ? "border-primary bg-primary text-foreground-inverse" : "border-border bg-surface text-muted-foreground"}`}
        >
          Meus Times
        </Link>
        <Link
          href="/times?tab=create"
          className={`rounded-pill border px-4 py-2 text-sm ${tab === "create" ? "border-primary bg-primary text-foreground-inverse" : "border-border bg-surface text-muted-foreground"}`}
        >
          Criar Novo Time
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          {tab === "teams" ? (
            teams.length > 0 ? (
              teams.map((team) => <TeamCard key={team.id} team={team} />)
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum time encontrado nesta conta.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Fluxo de criação será conectado ao formulário existente de times nesta fase.
            </p>
          )}
        </section>

        <aside className="hidden rounded-lg border border-border bg-surface p-5 lg:block">
          <h2 className="text-lg font-semibold">Criar Novo Time</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Abra a aba de criação para configurar um time solo ou duplas.
          </p>
          <Link
            href="/times?tab=create"
            className="mt-4 inline-flex rounded-pill border border-primary bg-primary px-4 py-2 text-sm text-foreground-inverse"
          >
            Criar Novo Time
          </Link>
        </aside>
      </div>
    </main>
  );
}
