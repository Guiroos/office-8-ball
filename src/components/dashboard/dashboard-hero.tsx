import { Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Separator } from "@/components/ui/separator";
import { StatTile } from "@/components/ui/stat-tile";
import type { ScoreboardData } from "@/lib/types";

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
    <Card className="overflow-hidden bg-[image:var(--hero-gradient)]">
      <CardContent className="grid gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.9fr)] lg:items-end">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <SectionHeader
              eyebrow="Mesa oficial do escritório"
              title="Office 8 Ball"
              description="Um placar interno para registrar quem saiu da mesa como campeão e quem saiu procurando desculpa técnica."
              className="gap-3"
              titleClassName="[font-family:var(--font-display)] text-[length:var(--text-display-lg)] leading-[0.88] uppercase tracking-[0.06em] text-[color:var(--foreground)]"
              descriptionClassName="max-w-2xl text-base leading-7 text-[color:var(--muted-foreground)] sm:text-lg"
            />
          </div>
          <div>
            <p className="text-[length:var(--text-label)] font-semibold uppercase tracking-[var(--tracking-label-wide)] text-[color:var(--muted-foreground)]">
              Rivalidade operacional
            </p>
            <p className="mt-3 inline-flex w-fit rounded-[var(--radius-pill)] border border-[color:var(--gold)] bg-[color:var(--gold-soft)] px-3 py-1 text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--foreground)] backdrop-blur-sm">
              {environmentLabel === "Escritório" ? "Modo escritório" : "Modo dev"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--muted-foreground)]">
                Leitura oficial
              </p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                {loading || !scoreboard
                  ? "Carregando o tribunal da sinuca..."
                  : getLeadLabel(scoreboard)}
              </p>
            </div>
            <div className="rounded-[var(--radius-pill)] bg-[color:var(--surface-emphasis)] p-3 text-[color:var(--foreground)]">
              <Trophy className="size-5" />
            </div>
          </div>

          <Separator className="bg-[color:var(--border)]" />

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Total"
              value={
                <strong className="block text-4xl font-black tracking-[-0.05em]">
                  {scoreboard?.totalMatches ?? 0}
                </strong>
              }
              description="partidas registradas"
              className="rounded-[var(--radius-md)]"
            />

            <StatTile
              label="Streak"
              value={
                <strong className="block text-4xl font-black tracking-[-0.05em]">
                  {scoreboard?.currentStreak ? `${scoreboard.currentStreak.count}x` : "0x"}
                </strong>
              }
              description={
                scoreboard?.currentStreak ? scoreboard.currentStreak.teamName : "sem dominante"
              }
              className="rounded-[var(--radius-md)]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
