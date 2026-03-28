import { PeriodTabs } from "@/components/ranking/period-tabs";
import { PodiumCard } from "@/components/ranking/podium-card";
import { StandingsRow } from "@/components/ranking/standings-row";
import { TypeTabs } from "@/components/ranking/type-tabs";
import type { RankedTeam } from "@/lib/ranking";

const PERIOD_LABELS: Record<"all" | "month" | "week", string> = {
  all: "nesta categoria",
  month: "neste mês",
  week: "nesta semana",
};

export function RankingView({
  teams,
  activeType,
  activePeriod = "all",
  mode,
}: {
  teams: RankedTeam[];
  activeType: "all" | "solo" | "duo";
  activePeriod?: "all" | "month" | "week";
  mode: "available" | "unavailable";
}) {
  const filters = (
    <div className="grid gap-3 sm:grid-cols-2 xl:ml-auto xl:w-full xl:max-w-xl">
      <TypeTabs activeType={activeType} activePeriod={activePeriod} />
      <PeriodTabs activePeriod={activePeriod} activeType={activeType} />
    </div>
  );

  if (mode === "unavailable") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="label-wide text-muted-foreground">Ranking</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Placar de times</h1>
        </div>
      </main>
    );
  }

  if (teams.length === 0) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="label-wide text-muted-foreground">Ranking</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Placar de times</h1>
          </div>
          {filters}
        </div>
        {/* per D-13: explicit empty state without automatic fallback to all-time */}
        <div
          data-testid="empty-state"
          className="mt-6 rounded-lg border border-border bg-surface p-6"
        >
          <p className="text-muted-foreground">
            Nenhum time encontrado {PERIOD_LABELS[activePeriod]}
          </p>
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
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="label-wide text-muted-foreground">Ranking</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Placar de times</h1>
        </div>
        {filters}
      </div>

      <section aria-label="Pódio" className="mt-6 grid gap-4 lg:grid-cols-3">
        {podium.map((team) => (
          <PodiumCard key={team.id} team={team} />
        ))}
      </section>

      {rest.length > 0 ? (
        <section aria-label="Classificação" className="mt-8">
          <p className="caption mb-3 text-muted-foreground">Classificação</p>
          <div className="grid gap-2">
            {rest.map((team) => (
              <StandingsRow key={team.id} team={team} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
