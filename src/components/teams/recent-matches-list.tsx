import { Badge } from "@/components/ui/badge";
import type { MatchRecord } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RecentMatchesList({
  matches,
  teamId,
  teamNameById,
}: {
  matches: MatchRecord[];
  teamId: string;
  teamNameById: Record<string, string>;
}) {
  const topThree = matches.slice(0, 3);

  if (topThree.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma partida registrada</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {topThree.map((match) => {
          const opponentId = match.teamAId === teamId ? match.teamBId : match.teamAId;
          const opponentName = teamNameById[opponentId] ?? opponentId;
          const won = match.winnerTeamId === teamId;

          return (
            <li
              key={match.id}
              className="rounded-lg border border-border bg-surface-emphasis p-4 shadow-sm shadow-foreground/5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Badge variant={won ? "default" : "outline"}>
                    {won ? "Vitória" : "Derrota"}
                  </Badge>
                  <div>
                    <p className="font-semibold">Contra {opponentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {won
                        ? "Resultado positivo no confronto mais recente."
                        : "Esse foi o revés mais recente contra esse adversário."}
                    </p>
                  </div>
                </div>

                <p className="caption text-muted-foreground sm:text-right">{formatDate(match.playedAt)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="caption text-muted-foreground">Mostrando as 3 partidas mais recentes.</p>
    </div>
  );
}
