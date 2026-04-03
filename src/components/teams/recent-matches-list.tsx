import { Badge } from "@/components/ui/badge";
import { formatMatchDate, formatTeamType } from "@/lib/format";
import type { TeamDetailMatch } from "@/lib/team-details";

export function RecentMatchesList({
  matches,
  teamId,
}: {
  matches: TeamDetailMatch[];
  teamId: string;
}) {
  const topThree = matches.slice(0, 3);

  if (topThree.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma partida registrada</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {topThree.map((match) => {
          const opponent = match.teamAId === teamId ? match.teamB : match.teamA;
          const opponentType = opponent.type ? formatTeamType(opponent.type) : "Tipo desconhecido";
          const opponentMembers = opponent.members.length
            ? opponent.members.map((member) => member.displayName).join(", ")
            : "Integrantes não encontrados";
          const won = match.winnerTeamId === teamId;

          return (
            <li
              key={match.id}
              className="rounded-lg border border-border bg-surface-emphasis p-4 shadow-sm shadow-foreground/5"
            >
              <div className="flex items-start justify-between gap-3">
                <Badge variant={won ? "default" : "outline"}>
                  {won ? "Vitória" : "Derrota"}
                </Badge>
                <p className="caption text-right text-muted-foreground">{formatMatchDate(match.playedAt)}</p>
              </div>

              <div className="mt-3 space-y-1">
                <p className="font-semibold">Contra {opponent.name}</p>
                <p className="text-sm text-muted-foreground">
                  Tipo: {opponentType}
                </p>
                <p className="text-sm text-muted-foreground">
                  Integrantes: {opponentMembers}
                </p>
                {match.note ? (
                  <p className="text-sm text-muted-foreground">Observação: {match.note}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="caption text-muted-foreground">Mostrando as 3 partidas mais recentes.</p>
    </div>
  );
}
