import { SectionHeader } from "@/components/primitives/section-header";
import { PodiumCard } from "@/components/ranking/podium-card";
import { StandingsRow } from "@/components/ranking/standings-row";
import { TypeTabs } from "@/components/ranking/type-tabs";
import type { RankedTeam } from "@/lib/ranking";

export function RankingView({
  teams,
  activeType,
  mode,
}: {
  teams: RankedTeam[];
  activeType: "all" | "solo" | "duo";
  mode: "available" | "unavailable";
}) {
  if (mode === "unavailable") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Ranking"
          title="Placar de times"
          description="Ranking indisponível em modo de desenvolvimento"
        />
      </main>
    );
  }

  if (teams.length === 0) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* per D-02 */}
        <TypeTabs activeType={activeType} />
        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <p className="text-muted-foreground">Nenhum time encontrado nesta categoria</p>
        </div>
      </main>
    );
  }

  const podiumCandidates = teams.slice(0, 3);
  const byRank = new Map(podiumCandidates.map((team) => [team.rank, team]));
  // per D-01: podium visual order must be 2 | 1 | 3
  const podium = [2, 1, 3]
    .map((rank) => byRank.get(rank))
    .filter((team): team is RankedTeam => Boolean(team));
  // per D-04: standings list includes full metrics from ranking contract
  const rest = teams.filter((team) => team.rank >= 4);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Ranking"
        title="Placar de times"
        description="Classificação ao vivo baseada no histórico de partidas."
      />
      {/* per D-02 */}
      <div className="mt-6">
        <TypeTabs activeType={activeType} />
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {podium.map((team) => (
          <PodiumCard key={team.id} team={team} />
        ))}
      </section>

      {rest.length > 0 ? (
        <section className="mt-6 grid gap-3">
          {rest.map((team) => (
            <StandingsRow key={team.id} team={team} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
