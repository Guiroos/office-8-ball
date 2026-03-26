import Link from "next/link";

import { StatTile } from "@/components/primitives/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RankedTeam } from "@/lib/ranking";

const PODIUM_BADGES: Record<number, string> = {
  1: "🏆 1º Lugar",
  2: "🥈 2º Lugar",
  3: "🥉 3º Lugar",
};

export function PodiumCard({ team }: { team: RankedTeam }) {
  return (
    <Link href={`/times/${team.id}`} className="block focus-visible:outline-none">
      <Card className="h-full border-border-strong bg-surface-emphasis transition hover:-translate-y-1 hover:shadow-md hover:shadow-gold/35">
        <CardHeader className="space-y-3">
          <Badge className="w-fit">{PODIUM_BADGES[team.rank] ?? `#${team.rank}`}</Badge>
          <CardTitle className="title">{team.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <StatTile label="Vitórias" value={team.wins} className="rounded-md p-3" />
          <StatTile label="Derrotas" value={team.losses} className="rounded-md p-3" />
          <StatTile
            label="Taxa de Vitória"
            value={`${team.winRate.toFixed(1)}%`}
            className="rounded-md p-3"
          />
          <StatTile
            label="Sequência Atual"
            value={`${team.currentStreak.count} ${team.currentStreak.type === "win" ? "W" : team.currentStreak.type === "loss" ? "L" : "-"}`}
            className="rounded-md p-3"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
