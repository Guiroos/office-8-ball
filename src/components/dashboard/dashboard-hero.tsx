import { Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/primitives/section-header";
import { Separator } from "@/components/ui/separator";
import { StatTile } from "@/components/primitives/stat-tile";
// TODO(Task 3/4): replace with new scoreboard types once scoreboard route is updated
type ScoreboardData = {
  teams: Array<{ id: string; displayName: string; wins: number; [key: string]: unknown }>;
  leaderTeamId: string | null;
  leadBy: number;
  totalMatches: number;
  currentStreak: { teamId: string; teamName: string; count: number } | null;
};

import { getLeadLabel } from "./dashboard-utils";

export function DashboardHero({
  loading,
  scoreboard,
  environmentLabel,
}: {
  loading: boolean;
  scoreboard: ScoreboardData | null;
  environmentLabel: string;
}) {
  return (
    <Card className="overflow-hidden border-border-strong bg-[image:var(--hero-gradient)]">
      <CardContent className="grid gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.9fr)] lg:items-end">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <SectionHeader
              eyebrow="Mesa oficial do escritório"
              title="Office 8 Ball"
              description="Um placar interno para registrar quem saiu da mesa como campeão e quem saiu procurando desculpa técnica."
              className="gap-3"
              titleClassName="font-display headline tracking-[0.06em] uppercase text-foreground"
              descriptionClassName="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
            />
          </div>
          <div>
            <p className="label-wide text-muted-foreground">
              Rivalidade operacional
            </p>
            <p className="mt-3 inline-flex w-fit rounded-pill border border-gold bg-gold-soft px-3 py-1 caption text-foreground backdrop-blur-sm">
              {environmentLabel === "Escritório" ? "Modo escritório" : "Modo dev"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border border-border-strong bg-surface-emphasis p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="caption text-muted-foreground">
                Leitura oficial
              </p>
              <p className="mt-2 subtitle">
                {loading || !scoreboard
                  ? "Carregando o tribunal da sinuca..."
                  : getLeadLabel(scoreboard)}
              </p>
            </div>
            <div className="rounded-pill border border-border bg-surface p-3 text-foreground">
              <Trophy className="size-5" />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Total"
              value={
                <strong className="block title">
                  {scoreboard?.totalMatches ?? 0}
                </strong>
              }
              description="partidas registradas"
              className="rounded-md"
            />

            <StatTile
              label="Streak"
              value={
                <strong className="block title">
                  {scoreboard?.currentStreak ? `${scoreboard.currentStreak.count}x` : "0x"}
                </strong>
              }
              description={
                scoreboard?.currentStreak ? scoreboard.currentStreak.teamName : "sem dominante"
              }
              className="rounded-md"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
