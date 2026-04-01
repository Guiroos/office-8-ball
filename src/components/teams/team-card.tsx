import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { RecentResultsDots } from "@/components/primitives/recent-results-dots";
import { formatLastPlayedAt, formatTeamType, getInitials } from "@/lib/format";
import type { UserTeamOverview } from "@/lib/teams";

export function TeamCard({ team }: { team: UserTeamOverview }) {
  const partnerLabel =
    team.partners.length === 0
      ? "Time solo"
      : team.partners.length === 1
        ? `Com ${team.partners[0]?.displayName}`
        : `Parceiros: ${team.partners.map((partner) => partner.displayName).join(", ")}`;

  return (
    <Link href={`/times/${team.id}`} className="block">
      <Card className="cursor-pointer shadow-sm shadow-foreground/10 transition hover:shadow-md hover:shadow-foreground/20">
        <div className="flex items-start gap-3 p-4">
          <Avatar className="size-9 border-0 bg-surface-emphasis">
            <AvatarFallback className="bg-surface-emphasis text-xs">
              {getInitials(team.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold leading-none">{team.name}</p>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {formatTeamType(team.type)}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">{partnerLabel}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[auto_auto_1fr] sm:items-center">
              <div>
                <p className="caption text-muted-foreground">Desempenho</p>
                <p className="text-sm font-medium">
                  {team.summary.wins}V · {team.summary.losses}D
                </p>
              </div>
              <div>
                <p className="caption text-muted-foreground">Taxa</p>
                <p className="text-sm font-medium">{team.summary.winRate.toFixed(1)}%</p>
              </div>
              <div className="sm:justify-self-end">
                <p className="caption mb-1 text-muted-foreground">Últimas 5</p>
                <RecentResultsDots results={team.summary.lastFiveResults} teamName={team.name} />
              </div>
            </div>
          </div>
          <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
        </div>
        <div className="grid gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground sm:grid-cols-2">
          <p>
            {team.summary.totalMatches === 0
              ? "Nenhuma partida registrada"
              : `${team.summary.totalMatches} ${team.summary.totalMatches === 1 ? "partida registrada" : "partidas registradas"}`}
          </p>
          <p className="sm:text-right">
            {team.summary.lastPlayedAt ? `Última partida em ${formatLastPlayedAt(team.summary.lastPlayedAt)}` : "Aguardando primeira partida"}
          </p>
        </div>
      </Card>
    </Link>
  );
}
