import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
            <Badge>Mesa oficial do escritório</Badge>
            <Badge className="border-[color:var(--gold)] bg-[color:var(--gold-soft)] text-[color:var(--foreground)]">
              {environmentLabel === "Escritório" ? "Modo escritório" : "Modo dev"}
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted-foreground)]">
              Rivalidade operacional
            </p>
            <h1 className="font-['Copperplate','Impact','Arial_Narrow_Bold',sans-serif] text-[clamp(3.5rem,10vw,7.5rem)] leading-[0.88] uppercase tracking-[0.06em] text-[color:var(--foreground)]">
              Office 8 Ball
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[color:var(--muted-foreground)] sm:text-lg">
              Um placar interno para registrar quem saiu da mesa como campeão e quem
              saiu procurando desculpa técnica.
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-[26px] border border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                Leitura oficial
              </p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                {loading || !scoreboard
                  ? "Carregando o tribunal da sinuca..."
                  : getLeadLabel(scoreboard)}
              </p>
            </div>
            <div className="rounded-full bg-[color:var(--surface-emphasis)] p-3 text-[color:var(--foreground)]">
              <Trophy className="size-5" />
            </div>
          </div>

          <Separator className="bg-[color:var(--border)]" />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                Total
              </p>
              <strong className="mt-2 block text-4xl font-black tracking-[-0.05em]">
                {scoreboard?.totalMatches ?? 0}
              </strong>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                partidas registradas
              </p>
            </div>

            <div className="rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                Streak
              </p>
              <strong className="mt-2 block text-4xl font-black tracking-[-0.05em]">
                {scoreboard?.currentStreak ? `${scoreboard.currentStreak.count}x` : "0x"}
              </strong>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                {scoreboard?.currentStreak
                  ? scoreboard.currentStreak.teamName
                  : "sem dominante"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
