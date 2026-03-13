import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MatchRecord } from "@/lib/types";

import { formatMatchDate } from "./dashboard-utils";

export function RecentMatchesCard({ matches }: { matches: MatchRecord[] }) {
  return (
    <Card className="bg-[color:var(--card)]/95">
      <CardContent className="space-y-5 p-6 sm:p-7">
        <CardHeader className="gap-3">
          <Badge>Últimas partidas</Badge>
          <CardTitle>Histórico recente</CardTitle>
        </CardHeader>

        {matches.length === 0 ? (
          <div className="rounded-[22px] border border-[color:var(--border)] bg-white/55 p-5">
            <strong className="block text-lg font-semibold">
              Nenhuma partida registrada ainda.
            </strong>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
              A primeira vitória já pode vir carregada de provocação.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[26rem] w-full pr-4">
            <ul className="space-y-3 pb-1">
              {matches.map((match) => (
                <li
                  key={match.id}
                  className="grid gap-3 rounded-[22px] border border-[color:var(--border)] bg-white/60 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="space-y-1">
                    <strong className="block text-lg font-semibold">{match.winnerName}</strong>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      {match.winnerRoster}
                    </p>
                  </div>

                  <div className="grid gap-1 text-left sm:justify-items-end sm:text-right">
                    <span className="text-sm font-medium">
                      {formatMatchDate(match.playedAt)}
                    </span>
                    {match.note ? (
                      <small className="text-sm text-[color:var(--muted-foreground)]">
                        {match.note}
                      </small>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
