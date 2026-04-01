import { H2HSection } from "@/components/teams/h2h-section";
import { TeamArchiveButton } from "@/components/teams/team-archive-button";
import { InviteMemberDialog } from "@/components/teams/invite-member-dialog";
import { MemberList } from "@/components/teams/member-list";
import { RecentMatchesList } from "@/components/teams/recent-matches-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatTile } from "@/components/primitives/stat-tile";
import { formatTeamType } from "@/lib/format";
import type { TeamDetailData } from "@/lib/team-details";

function formatCurrentStreakLabel(
  streak: TeamDetailData["stats"]["currentStreak"],
) {
  if (streak.type === "none" || streak.count === 0) {
    return "-";
  }

  return `${streak.count}${streak.type === "win" ? "V" : "D"}`;
}

export function TeamDetailView(data: TeamDetailData & { viewerId: string }) {
  const teamNameById = Object.fromEntries([
    [data.team.id, data.team.name],
    ...data.rivals.map((rival) => [rival.id, rival.name]),
  ]);
  const teamTypeLabel = formatTeamType(data.team.type);
  const summaryText = `${data.stats.wins} vitórias, ${data.stats.losses} derrotas e ${data.stats.winRate.toFixed(1)}% de aproveitamento.`;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-border-strong bg-surface-emphasis shadow-sm shadow-foreground/10">
        <CardHeader className="gap-5 p-5 sm:p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <div className="space-y-2">
              <CardTitle className="title">{data.team.name}</CardTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{teamTypeLabel}</Badge>
              <Badge variant="default">
                {data.members.length} {data.members.length === 1 ? "membro" : "membros"}
              </Badge>
              {data.rankingPosition ? (
                <Badge variant="gold">#{data.rankingPosition} no ranking</Badge>
              ) : null}
            </div>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {summaryText}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end sm:pt-1">
            <InviteMemberDialog teamId={data.team.id} />
            <TeamArchiveButton teamId={data.team.id} />
          </div>
        </CardHeader>
      </Card>

      {/* per D-07 */}
      <section className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Vitórias" value={data.stats.wins} />
        <StatTile label="Derrotas" value={data.stats.losses} />
        <StatTile label="Partidas jogadas" value={data.stats.totalMatches} />
        <StatTile label="Aproveitamento" value={`${data.stats.winRate.toFixed(1)}%`} />
        <StatTile label="Posição no ranking" value={data.rankingPosition ?? "-"} />
        <StatTile
          label="Sequência Atual"
          value={formatCurrentStreakLabel(data.stats.currentStreak)}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-surface">
          <CardContent className="space-y-4 p-6">
            <SectionHeader
              eyebrow="Time"
              title="Membros"
              description="Quem faz parte do time e quem pode ser gerenciado nesta equipe."
            />
            <MemberList
              members={data.members}
              teamId={data.team.id}
              teamType={data.team.type}
              createdBy={data.team.createdBy}
              viewerId={data.viewerId}
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="space-y-4 p-6">
            <SectionHeader
              eyebrow="Partidas"
              title="Últimas Partidas"
              description="Resumo rápido dos confrontos mais recentes desse time."
            />
            <RecentMatchesList
              matches={data.recentMatches}
              teamId={data.team.id}
              teamNameById={teamNameById}
            />
          </CardContent>
        </Card>
      </section>

      {/* per D-09/D-10 */}
      <section className="mt-6">
        <Card className="border-border bg-surface">
          <CardContent className="space-y-4 p-6">
            <SectionHeader
              eyebrow="Comparação"
              title="Confrontos Diretos"
              description="Compare o desempenho do time contra cada adversário disponível."
            />
            {/* addresses review concern: server-side H2H summary */}
            <H2HSection
              rivals={data.rivals}
              h2hByRival={data.h2hByRival}
              defaultRivalId={data.primaryRivalId}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
