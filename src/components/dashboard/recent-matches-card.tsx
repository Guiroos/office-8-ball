import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionHeader } from "@/components/ui/section-header";
import type { MatchRecord } from "@/lib/types";

import { formatMatchDate } from "./dashboard-utils";

export function RecentMatchesCard({ matches }: { matches: MatchRecord[] }) {
  return (
    <Card className="bg-[color:var(--surface)]">
      <CardContent className="space-y-5 p-6 sm:p-7">
        <SectionHeader eyebrow="Últimas partidas" title="Histórico recente" />

        {matches.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] p-5">
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
                  className="grid gap-3 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
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
