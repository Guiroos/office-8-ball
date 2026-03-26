import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { RankedTeam } from "@/lib/ranking";

export function StandingsRow({ team }: { team: RankedTeam }) {
  return (
    <Link
      href={`/times/${team.id}`}
      className="grid gap-3 rounded-lg border border-border bg-surface p-4 transition hover:shadow-sm hover:shadow-foreground/20 md:grid-cols-[auto_1fr_auto_auto_auto_auto_auto]"
    >
      <p className="label-wide text-muted-foreground">#{team.rank}</p>
      <div>
        <p className="font-semibold">{team.name}</p>
      </div>
      <Badge variant="outline">{team.type === "solo" ? "Solo" : "Duplas"}</Badge>
      <p className="text-sm">{team.wins}</p>
      <p className="text-sm">{team.losses}</p>
      <p className="text-sm">{team.winRate.toFixed(1)}%</p>
      <p className="text-sm">
        {team.currentStreak.count}
        {" "}
        {team.currentStreak.type === "win" ? "W" : team.currentStreak.type === "loss" ? "L" : "-"}
        {" · "}
        {team.totalMatches}j
      </p>
    </Link>
  );
}
