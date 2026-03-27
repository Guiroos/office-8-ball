import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { RankedTeam } from "@/lib/ranking";

export function StandingsRow({ team }: { team: RankedTeam }) {
  const isWinStreak = team.currentStreak.type === "win";
  const isLossStreak = team.currentStreak.type === "loss";

  const streak = isWinStreak
    ? `${team.currentStreak.count}V`
    : isLossStreak
      ? `${team.currentStreak.count}D`
      : "-";

  return (
    <Link
      href={`/times/${team.id}`}
      className="cursor-pointer rounded-lg border border-border bg-surface transition hover:border-border-strong hover:shadow-sm hover:shadow-foreground/20"
    >
      {/* Desktop layout */}
      <div className="hidden items-center gap-4 px-4 py-3 md:grid md:grid-cols-[2rem_1fr_auto_5rem_5rem_6rem_6rem]">
        <p className="label-wide text-center text-muted-foreground">#{team.rank}</p>
        <p className="truncate font-semibold">{team.name}</p>
        <Badge variant="outline" className="justify-self-start">
          {team.type === "solo" ? "Solo" : "Duplas"}
        </Badge>
        <div className="text-center">
          <p className="caption text-muted-foreground">V</p>
          <p className="text-sm font-medium">{team.wins}</p>
        </div>
        <div className="text-center">
          <p className="caption text-muted-foreground">D</p>
          <p className="text-sm font-medium">{team.losses}</p>
        </div>
        <div className="text-center">
          <p className="caption text-muted-foreground">Taxa</p>
          <p className="text-sm font-medium">{team.winRate.toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <p className="caption text-muted-foreground">Sequência</p>
          <p
            className={cn(
              "text-sm font-medium",
              isWinStreak && "text-primary",
              isLossStreak && "text-danger",
            )}
          >
            {streak} · {team.totalMatches}j
          </p>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex items-center gap-3 px-4 py-3 md:hidden">
        <p className="label-wide w-6 shrink-0 text-center text-muted-foreground">
          #{team.rank}
        </p>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{team.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {team.type === "solo" ? "Solo" : "Duplas"}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {team.wins}V · {team.losses}D · {team.winRate.toFixed(1)}%
            </p>
          </div>
        </div>
        <p
          className={cn(
            "shrink-0 text-xs font-medium",
            isWinStreak && "text-primary",
            isLossStreak && "text-danger",
            !isWinStreak && !isLossStreak && "text-muted-foreground",
          )}
        >
          {streak}
        </p>
      </div>
    </Link>
  );
}
