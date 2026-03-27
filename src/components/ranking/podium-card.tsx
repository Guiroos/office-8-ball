import Link from "next/link";
import { Medal, Trophy } from "lucide-react";

import { StatTile } from "@/components/primitives/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RankedTeam } from "@/lib/ranking";

function getRankConfig(rank: number) {
  if (rank === 1)
    return {
      icon: <Trophy className="size-3.5 shrink-0 text-gold" />,
      label: "1º Lugar",
      cardClass: "border-gold/50",
      hoverClass: "hover:shadow-lg hover:shadow-gold/30",
      accentStrip: true,
      rankNumClass: "text-gold/15",
    };
  if (rank === 2)
    return {
      icon: <Medal className="size-3.5 shrink-0 text-muted-foreground" />,
      label: "2º Lugar",
      cardClass: "border-border-strong",
      hoverClass: "hover:shadow-md hover:shadow-foreground/15",
      accentStrip: false,
      rankNumClass: "text-muted-foreground/10",
    };
  if (rank === 3)
    return {
      icon: <Medal className="size-3.5 shrink-0 text-gold/70" />,
      label: "3º Lugar",
      cardClass: "border-border-strong",
      hoverClass: "hover:shadow-md hover:shadow-foreground/15",
      accentStrip: false,
      rankNumClass: "text-muted-foreground/10",
    };
  return {
    icon: null,
    label: `#${rank}`,
    cardClass: "border-border",
    hoverClass: "hover:shadow-sm",
    accentStrip: false,
    rankNumClass: "text-muted-foreground/10",
  };
}

export function PodiumCard({ team }: { team: RankedTeam }) {
  const config = getRankConfig(team.rank);
  const streakLabel =
    team.currentStreak.type === "win"
      ? `${team.currentStreak.count}V`
      : team.currentStreak.type === "loss"
        ? `${team.currentStreak.count}D`
        : "-";
  const membersLabel = team.memberNames.join(" • ");
  const typeLabel = team.type === "solo" ? "Solo" : "Dupla";

  return (
    <Link href={`/times/${team.id}`} className="block focus-visible:outline-none">
      <Card
        className={cn(
          "h-full cursor-pointer overflow-hidden bg-surface-emphasis transition hover:-translate-y-1",
          config.cardClass,
          config.hoverClass,
        )}
      >
        {/* Gold accent strip — rank 1 only; overflow-hidden on Card clips corners */}
        {config.accentStrip && (
          <div className="h-0.5 bg-gold-gradient" />
        )}

        {/* Header: rank badge + team name + decorative rank number */}
        <CardHeader className="flex-row items-start justify-between p-4 pb-3">
          <div className="flex flex-col gap-1.5">
            <Badge className="flex w-fit items-center gap-1.5">
              {config.icon}
              {config.label}
            </Badge>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold leading-snug">{team.name}</p>
              <Badge variant="outline" className="text-[11px]">
                {typeLabel}
              </Badge>
            </div>
            {membersLabel ? (
              <p className="text-sm leading-snug text-muted-foreground">{membersLabel}</p>
            ) : null}
          </div>
          <span
            className={cn(
              "select-none font-black leading-none tabular-nums text-5xl",
              config.rankNumClass,
            )}
            aria-hidden
          >
            {team.rank}
          </span>
        </CardHeader>

        {/* Stats — divided grid via StatTile with border/bg stripped */}
        <CardContent className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border">
          <StatTile
            label="Vitórias"
            value={team.wins}
            className="rounded-none border-0 bg-transparent p-3"
          />
          <StatTile
            label="Derrotas"
            value={team.losses}
            className="rounded-none border-0 bg-transparent p-3"
          />
          <StatTile
            label="Taxa de Vitória"
            value={`${team.winRate.toFixed(1)}%`}
            className="rounded-none border-0 bg-transparent p-3"
          />
          <StatTile
            label="Sequência"
            value={streakLabel}
            className="rounded-none border-0 bg-transparent p-3"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
