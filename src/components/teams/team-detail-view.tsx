import { H2HSection } from "@/components/teams/h2h-section";
import { MemberList } from "@/components/teams/member-list";
import { RecentMatchesList } from "@/components/teams/recent-matches-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatTile } from "@/components/primitives/stat-tile";
import type { TeamDetailData } from "@/lib/team-details";

export function TeamDetailView(data: TeamDetailData) {
  const teamNameById = Object.fromEntries([
    [data.team.id, data.team.name],
    ...data.rivals.map((rival) => [rival.id, rival.name]),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-border-strong bg-surface-emphasis">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="title">{data.team.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{data.team.type === "solo" ? "Solo" : "Duplas"}</p>
          </div>
          <Button type="button">Convidar Membro</Button>
        </CardHeader>
      </Card>

      {/* per D-07 */}
      <section className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total Wins" value={data.stats.wins} />
        <StatTile label="Total Losses" value={data.stats.losses} />
        <StatTile label="Total de Partidas" value={data.stats.totalMatches} />
        <StatTile label="Win Rate %" value={`${data.stats.winRate.toFixed(1)}%`} />
        <StatTile label="Posição no ranking" value={data.rankingPosition ?? "-"} />
        <StatTile
          label="Sequência Atual"
          value={`${data.stats.currentStreak.count} ${data.stats.currentStreak.type === "win" ? "W" : data.stats.currentStreak.type === "loss" ? "L" : "-"}`}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-surface">
          <CardContent className="space-y-4 p-6">
            <SectionHeader eyebrow="Time" title="Membros" />
            <MemberList members={data.members} />
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="space-y-4 p-6">
            <SectionHeader eyebrow="Partidas" title="Últimas Partidas" />
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
            <SectionHeader eyebrow="Comparação" title="Confrontos Diretos" />
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
