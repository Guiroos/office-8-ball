"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { HeadToHeadPageData } from "@/lib/head-to-head";
import type { TeamRecord } from "@/lib/types";

type Props = {
  data: HeadToHeadPageData;
};

/**
 * Head-to-head UI component.
 *
 * Renders two explicit team selectors (Team A / Team B) that sync to URL
 * immediately without full reload (D-17/D-18). Prevents selecting the same
 * team on both sides (D-17). Displays warning messages in PT-BR for invalid
 * selections (D-16).
 */
export function HeadToHeadView({ data }: Props) {
  const router = useRouter();
  const [isPending, startNavigation] = useTransition();
  const { pair, warning, options, summary } = data;
  const teamAId = pair.teamA?.id ?? "";
  const teamBId = pair.teamB?.id ?? "";
  const [optimisticTeamAId, setOptimisticTeamAId] = useState(teamAId);
  const [optimisticTeamBId, setOptimisticTeamBId] = useState(teamBId);
  const displayedTeamAId = isPending ? optimisticTeamAId : teamAId;
  const displayedTeamBId = isPending ? optimisticTeamBId : teamBId;

  function buildUrl(teamAId: string | null, teamBId: string | null) {
    const params = new URLSearchParams();
    if (teamAId) params.set("teamA", teamAId);
    if (teamBId) params.set("teamB", teamBId);
    const query = params.toString();
    return query ? `/head-to-head?${query}` : "/head-to-head";
  }

  function handleTeamAChange(newValue: string) {
    const newTeamAId = newValue || null;
    // D-17: prevent selecting same team on both sides
    const teamBId = pair.teamB?.id === newTeamAId ? null : pair.teamB?.id ?? null;
    setOptimisticTeamAId(newTeamAId ?? "");
    setOptimisticTeamBId(teamBId ?? "");
    startNavigation(() => {
      router.push(buildUrl(newTeamAId, teamBId));
    });
  }

  function handleTeamBChange(newValue: string) {
    const newTeamBId = newValue || null;
    // D-17: prevent selecting same team on both sides
    const teamAId = pair.teamA?.id === newTeamBId ? null : pair.teamA?.id ?? null;
    setOptimisticTeamAId(teamAId ?? "");
    setOptimisticTeamBId(newTeamBId ?? "");
    startNavigation(() => {
      router.push(buildUrl(teamAId, newTeamBId));
    });
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Confronto Direto</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare o histórico de partidas entre dois times.
          </p>
        </header>

        {/* Warning banner (D-16) */}
        {warning && (
          <div
            role="alert"
            className="rounded-md border border-border bg-surface-emphasis px-4 py-3 text-sm text-muted-foreground"
          >
            {warning}
          </div>
        )}

        {/* Team selectors (D-17/D-18) */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Team A selector */}
          <div className="space-y-1.5">
            <Label htmlFor="selector-team-a">
              Team A
            </Label>
            <Select
              id="selector-team-a"
              value={displayedTeamAId}
              disabled={isPending}
              onValueChange={handleTeamAChange}
              placeholder="Selecione um time..."
              options={[
                { value: "", label: "Selecione um time..." },
                ...options
                  .filter((team: TeamRecord) => team.id !== displayedTeamBId)
                  .map((team: TeamRecord) => ({
                    value: team.id,
                    label: team.name,
                    description: team.type === "solo" ? "Solo" : "Duplas",
                  })),
              ]}
            />
          </div>

          {/* Team B selector */}
          <div className="space-y-1.5">
            <Label htmlFor="selector-team-b">
              Team B
            </Label>
            <Select
              id="selector-team-b"
              value={displayedTeamBId}
              disabled={isPending}
              onValueChange={handleTeamBChange}
              placeholder="Selecione um time..."
              options={[
                { value: "", label: "Selecione um time..." },
                ...options
                  .filter((team: TeamRecord) => team.id !== displayedTeamAId)
                  .map((team: TeamRecord) => ({
                    value: team.id,
                    label: team.name,
                    description: team.type === "solo" ? "Solo" : "Duplas",
                  })),
              ]}
            />
          </div>
        </div>

        {isPending ? (
          <p className="text-sm text-muted-foreground">Atualizando confronto...</p>
        ) : null}

        {/* H2H summary */}
        {pair.teamA && pair.teamB ? (
          summary && summary.totalMatches > 0 ? (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h2 className="mb-3 text-sm font-semibold">
                {pair.teamA.name} vs {pair.teamB.name}
              </h2>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vitórias de {pair.teamA.name}</span>
                  <span className="font-medium">{summary.teamAWins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vitórias de {pair.teamB.name}</span>
                  <span className="font-medium">{summary.teamBWins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Partidas</span>
                  <span className="font-medium">{summary.totalMatches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Taxa de Vitória ({pair.teamA.name})
                  </span>
                  <span className="font-medium">
                    {summary.totalMatches === 0
                      ? "—"
                      : `${((summary.teamAWins / summary.totalMatches) * 100).toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma partida registrada entre estes times.
            </p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione dois times para ver o histórico de confrontos.
          </p>
        )}
      </div>
    </main>
  );
}
