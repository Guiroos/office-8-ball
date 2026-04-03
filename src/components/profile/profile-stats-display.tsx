import { Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { IconCallout } from "@/components/primitives/icon-callout";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatTile } from "@/components/primitives/stat-tile";

export type ProfileStatsProps = {
  aggregate: {
    wins: number;
    losses: number;
    winRate: number;
    totalMatches: number;
  };
  teamRows: Array<{
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    winRate: number;
    totalMatches: number;
  }>;
};

function formatWinRate(rate: number): string {
  return `${Math.round(rate)}%`;
}

export function ProfileStatsDisplay({ aggregate, teamRows }: ProfileStatsProps) {
  return (
    <>
      {/* Stats Grid — PROF-01: wins, losses, win rate, total matches */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Vitórias" value={String(aggregate.wins)} />
        <StatTile label="Derrotas" value={String(aggregate.losses)} />
        <StatTile label="Win Rate" value={formatWinRate(aggregate.winRate)} />
        <StatTile label="Partidas" value={String(aggregate.totalMatches)} />
      </section>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Teams with per-team stats — PROF-02/03 */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <SectionHeader eyebrow="Meus Times" title="Equipes" hideTitle />
              {teamRows.length === 0 ? (
                <IconCallout
                  icon={<Trophy className="size-5" />}
                  title="Nenhum time ainda"
                  description="Crie ou entre em um time para ver suas stats aqui."
                />
              ) : (
                <ul className="space-y-3">
                  {teamRows.map((row) => (
                    <li
                      key={row.teamId}
                      className="rounded-lg border border-border bg-muted/50 p-3"
                    >
                      <p className="text-sm font-semibold">{row.teamName}</p>
                      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                        <span>{row.wins}V</span>
                        <span>{row.losses}D</span>
                        <span>{formatWinRate(row.winRate)}</span>
                        <span>{row.totalMatches} partidas</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — placeholder for future match history */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-6">
              <SectionHeader eyebrow="Histórico" title="Partidas Recentes" hideTitle />
              <p className="text-sm text-muted-foreground">
                Histórico de partidas disponível em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
