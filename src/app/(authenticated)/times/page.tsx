import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Users } from "lucide-react";

import { TeamPartnerFilter } from "@/components/teams/partner-filter";
import { TeamCard } from "@/components/teams/team-card";
import { TeamCreateDialog } from "@/components/teams/team-create-dialog";
import { IconCallout } from "@/components/primitives/icon-callout";
import { getAuthenticatedUser, hasDatabaseUrl } from "@/lib/auth";
import { buildPartnerOptions, listUserTeamsWithPartners } from "@/lib/teams";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Times | Office 8 Ball",
  description: "Área de times com listagem, filtro por parceiro e criação de novos times.",
};

type TeamsPageProps = {
  searchParams?: Promise<{ partner?: string }>;
};

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const resolved = (await searchParams) ?? {};
  const databaseReady = hasDatabaseUrl();
  const user = databaseReady ? await getAuthenticatedUser() : null;
  const teams =
    databaseReady && user
      ? await listUserTeamsWithPartners(user.id)
      : [];
  const partners = buildPartnerOptions(teams);
  const requestedPartnerId = resolved.partner;
  const activePartnerId = requestedPartnerId && partners.some((partner) => partner.userId === requestedPartnerId)
    ? requestedPartnerId
    : "all";
  const activePartner =
    activePartnerId === "all"
      ? null
      : partners.find((partner) => partner.userId === activePartnerId) ?? null;
  const filteredTeams =
    activePartnerId === "all"
      ? teams
      : teams.filter((team) => team.partners.some((partner) => partner.userId === activePartnerId));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="label-wide text-muted-foreground">Times</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Meus times</h1>
        </div>

        <div className="w-full xl:ml-auto xl:max-w-sm">
          <TeamPartnerFilter activePartnerId={activePartnerId} partners={partners} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <section className="space-y-3">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((team) => <TeamCard key={team.id} team={team} />)
          ) : teams.length > 0 && activePartner ? (
            <div className="space-y-3 pt-1">
              <IconCallout
                icon={<Filter className="size-4" />}
                title={`Nenhum time com ${activePartner.displayName}`}
                description="Troque o parceiro no filtro para voltar a visualizar outras formações."
              />
              <Link
                href="/times"
                className="inline-flex rounded-pill border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:border-border-strong hover:bg-surface-emphasis"
              >
                Limpar filtro
              </Link>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <IconCallout
                icon={<Users className="size-4" />}
                title="Nenhum time ainda"
                description="Crie seu primeiro time para começar a registrar partidas e acompanhar o ranking."
              />
              <TeamCreateDialog>
                <button
                  type="button"
                  className="inline-flex rounded-pill border border-primary bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:opacity-90"
                >
                  Criar primeiro time
                </button>
              </TeamCreateDialog>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Criar Novo Time</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Configure um time solo ou em dupla para registrar partidas e acompanhar a evolução no ranking.
            </p>
            <TeamCreateDialog>
              <button
                type="button"
                className="mt-4 inline-flex rounded-pill border border-primary bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:opacity-90"
              >
                Criar Novo Time
              </button>
            </TeamCreateDialog>
          </div>

          <div className="rounded-lg border border-border bg-surface-emphasis p-5">
            <p className="caption text-muted-foreground">Visão atual</p>
            <p className="mt-2 text-lg font-semibold tracking-tight">
              {filteredTeams.length} {filteredTeams.length === 1 ? "time visível" : "times visíveis"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {activePartner
                ? `Filtro ativo para jogos em parceria com ${activePartner.displayName}.`
                : partners.length > 0
                  ? `Você tem ${partners.length} ${partners.length === 1 ? "parceiro listado" : "parceiros listados"} para filtrar.`
                  : "Assim que você criar duplas, seus parceiros vão aparecer aqui para filtrar a lista."}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
