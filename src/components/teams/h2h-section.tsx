"use client";

import { useMemo, useState } from "react";

import type { TeamH2HSummary } from "@/lib/team-details";

type RivalOption = { id: string; name: string; type: "solo" | "duo" };

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

  if (rivals.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma partida entre estes times</p>;
  }

  return (
    <div className="space-y-4">
      <select
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
      >
        {rivals.map((rival) => (
          <option key={rival.id} value={rival.id}>
            {rival.name} ({rival.type === "solo" ? "Solo" : "Duplas"})
          </option>
        ))}
      </select>

      {!summary || summary.totalMatches === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma partida entre estes times</p>
      ) : (
        <div className="grid gap-2 rounded-lg border border-border bg-surface p-4 text-sm">
          <p>Vitórias Contra: {summary.teamAWins}</p>
          <p>Derrotas Para: {summary.teamBWins}</p>
          <p>Taxa vs Adversário: {summary.winRate.toFixed(1)}%</p>
          <p>Última Partida: {summary.lastMatchDate ? new Date(summary.lastMatchDate).toLocaleString("pt-BR") : "-"}</p>
        </div>
      )}
    </div>
  );
}
