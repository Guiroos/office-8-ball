"use client";

import { useMemo, useState } from "react";

import { StatTile } from "@/components/primitives/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { TeamH2HSummary } from "@/lib/team-details";

type RivalOption = { id: string; name: string; type: "solo" | "duo" };

function formatTeamTypeLabel(type: "solo" | "duo") {
  return type === "solo" ? "Solo" : "Duplas";
}

export function H2HSection({
  rivals,
  h2hByRival,
  defaultRivalId,
}: {
  rivals: RivalOption[];
  h2hByRival: Record<string, TeamH2HSummary>;
  defaultRivalId: string | null;
}) {
  const initial = defaultRivalId ?? rivals[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initial);

  const summary = useMemo(() => h2hByRival[selectedId], [h2hByRival, selectedId]);
  const selectedRival = useMemo(
    () => rivals.find((rival) => rival.id === selectedId) ?? null,
    [rivals, selectedId],
  );

  if (rivals.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma partida entre estes times</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="team-h2h-rival" className="caption text-muted-foreground">
          Selecione o adversário
        </Label>
        <Select
          id="team-h2h-rival"
          value={selectedId}
          onValueChange={setSelectedId}
          options={rivals.map((rival) => ({
            value: rival.id,
            label: rival.name,
            description: formatTeamTypeLabel(rival.type),
          }))}
        />
      </div>

      {!summary || summary.totalMatches === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma partida entre estes times</p>
      ) : (
        <div className="space-y-4 rounded-lg border border-border bg-surface-emphasis p-4 shadow-sm shadow-foreground/5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{summary.rivalTeamName}</p>
              {selectedRival ? (
                <Badge variant="outline">{formatTeamTypeLabel(selectedRival.type)}</Badge>
              ) : null}
            </div>
            <Badge variant="default">
              {summary.totalMatches} {summary.totalMatches === 1 ? "partida" : "partidas"}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Vitórias"
              value={summary.teamAWins}
              className="border-border-strong bg-surface"
            />
            <StatTile
              label="Derrotas"
              value={summary.teamBWins}
              className="border-border-strong bg-surface"
            />
            <StatTile
              label="Aproveitamento"
              value={`${summary.winRate.toFixed(1)}%`}
              className="border-border-strong bg-surface"
            />
            <StatTile
              label="Última partida"
              value={summary.lastMatchDate ? new Date(summary.lastMatchDate).toLocaleDateString("pt-BR") : "-"}
              className="border-border-strong bg-surface"
            />
          </div>
        </div>
      )}
    </div>
  );
}
