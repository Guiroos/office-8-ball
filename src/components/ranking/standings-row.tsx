import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { RankedTeam } from "@/lib/ranking";

function RecentResultsDots({ results, teamName }: { results: RankedTeam["lastFiveResults"]; teamName: string }) {
  const slots = [...results, ...Array.from({ length: Math.max(0, 5 - results.length) }, () => "none" as const)];

  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Últimas 5 partidas de ${teamName}`}>
      {slots.map((result, index) => (
        <span
          key={`${teamName}-${index}`}
          aria-label={
            result === "win"
              ? `Partida ${index + 1}: vitória`
              : result === "loss"
                ? `Partida ${index + 1}: derrota`
                : `Partida ${index + 1}: sem histórico`
          }
          className={cn(
            "block h-2.5 w-2.5 rounded-full border",
            result === "win" && "border-primary/70 bg-primary",
            result === "loss" && "border-danger/70 bg-danger",
            result === "none" && "border-border bg-surface-muted",
          )}
        />
      ))}
    </div>
  );
}

export function StandingsRow({ team }: { team: RankedTeam }) {
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
          <p className="caption text-muted-foreground">Últimas 5</p>
          <div className="mt-1 flex items-center justify-center">
            <RecentResultsDots results={team.lastFiveResults} teamName={team.name} />
          </div>
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
        <div className="shrink-0">
          <RecentResultsDots results={team.lastFiveResults} teamName={team.name} />
        </div>
      </div>
    </Link>
  );
}
