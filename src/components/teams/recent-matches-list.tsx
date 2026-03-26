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
            <li key={match.id} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-sm font-medium">
                {won ? "Vitória" : "Derrota"} vs {opponentName}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(match.playedAt)}</p>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground">Ver histórico completo</p>
    </div>
  );
}
