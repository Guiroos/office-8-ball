"use client";

import { cva } from "class-variance-authority";
import { CheckCircle2, Clock, Swords, Trophy } from "lucide-react";
import { startTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IconCallout } from "@/components/primitives/icon-callout";
import { cn } from "@/lib/utils";
import type { MatchRecord } from "@/lib/types";

import { usePartidaData } from "./use-partida-data";

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  return `há ${days}d`;
}

const teamPanelVariants = cva(
  "flex flex-col gap-4 rounded-lg border p-4 transition-colors",
  {
    variants: {
      variant: {
        alpha: "bg-team-alpha-soft",
        beta: "bg-team-beta-soft",
      },
      winner: {
        true: "border-gold ring-2 ring-gold shadow-md shadow-gold/35",
        false: "border-border",
      },
    },
  },
);

function TeamPanel({
  label,
  sublabel,
  variant,
  teams,
  selectedId,
  onSelect,
  isWinner,
  onToggleWinner,
  canSelectWinner,
  loading,
}: {
  label: string;
  sublabel: string;
  variant: "alpha" | "beta";
  teams: Array<{ id: string; name: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isWinner: boolean;
  onToggleWinner: () => void;
  canSelectWinner: boolean;
  loading: boolean;
}) {
  const selectedName = teams.find((t) => t.id === selectedId)?.name;
  const selectOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  return (
    <div className={teamPanelVariants({ variant, winner: isWinner })}>
      {/* Header row */}
      <div className="flex min-h-6 items-center justify-between gap-2">
        <p className="caption font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {isWinner && (
          <Badge className="border-gold bg-gold-soft text-foreground">
            <Trophy className="size-3" />
            Vencedor
          </Badge>
        )}
      </div>

      {/* Team select */}
      <div className="space-y-1.5">
        <Label className="caption text-muted-foreground">{sublabel}</Label>
        {!loading && teams.length === 0 ? (
          <p className="caption rounded-md border border-border bg-surface p-3 text-muted-foreground">
            {variant === "alpha"
              ? "Você não faz parte de nenhum time."
              : "Nenhum adversário disponível."}
          </p>
        ) : (
          <Select
            value={selectedId ?? ""}
            disabled={loading || teams.length === 0}
            onValueChange={onSelect}
            options={selectOptions}
            placeholder={loading ? "Carregando..." : "Selecionar time"}
            showDescriptionInTrigger={false}
            className="h-10 rounded-lg px-3"
          />
        )}
      </div>

      {/* Winner toggle */}
      <Button
        variant={isWinner ? "default" : "ghost"}
        size="sm"
        className="w-full"
        disabled={!canSelectWinner || !selectedId || loading}
        onClick={onToggleWinner}
      >
        {isWinner ? (
          <>
            <CheckCircle2 />
            Vencedor confirmado
          </>
        ) : (
          <>
            <Trophy />
            {selectedName ? `${selectedName} venceu` : "Marcar como vencedor"}
          </>
        )}
      </Button>
    </div>
  );
}

function VsDivider({ lit }: { lit: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-1 py-2">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
          lit
            ? "border-gold bg-gold-soft shadow-sm shadow-gold/35"
            : "border-border bg-surface-emphasis",
        )}
      >
        <Swords
          className={cn(
            "size-4 transition-colors",
            lit ? "text-gold" : "text-muted-foreground",
          )}
        />
      </div>
      <span
        className={cn(
          "caption font-black tracking-wider transition-colors",
          lit ? "text-gold" : "text-muted-foreground",
        )}
      >
        VS
      </span>
    </div>
  );
}

function MatchHistoryItem({
  match,
  myTeamId,
  teamMap,
}: {
  match: MatchRecord;
  myTeamId: string;
  teamMap: Record<string, string>;
}) {
  const winnerName = teamMap[match.winnerTeamId] ?? "—";
  const loserName = teamMap[match.loserTeamId] ?? "—";
  const iMyWin = match.winnerTeamId === myTeamId;

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface p-3 shadow-sm shadow-foreground/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Trophy
            className={cn(
              "size-3.5 shrink-0",
              iMyWin ? "text-gold" : "text-muted-foreground",
            )}
          />
          <span className="text-sm font-semibold">{winnerName}</span>
          <span className="text-xs text-muted-foreground">venceu</span>
          <span className="text-xs text-muted-foreground">{loserName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
          <Clock className="size-3" />
          <span className="text-xs">{formatRelativeTime(match.playedAt)}</span>
        </div>
      </div>
      {match.note && (
        <p className="ml-5 text-xs italic text-muted-foreground">"{match.note}"</p>
      )}
    </div>
  );
}

export function Partida() {
  const {
    myTeams,
    opponentTeams,
    isLoadingTeams,
    isRegistering,
    myTeamId,
    opponentId,
    winnerId,
    note,
    pairHistory,
    teamMap,
    setMyTeam,
    setOpponent,
    toggleWinner,
    setNote,
    registerMatch,
    canRegister,
  } = usePartidaData();

  const bothSelected = !!(myTeamId && opponentId);
  const vsLit = bothSelected && winnerId !== null;

  const myWins = pairHistory.filter((m) => m.winnerTeamId === myTeamId).length;
  const oppWins = pairHistory.filter((m) => m.winnerTeamId === opponentId).length;
  const myName = myTeamId ? (teamMap[myTeamId] ?? "Meu time") : "Meu time";
  const oppName = opponentId ? (teamMap[opponentId] ?? "Adversário") : "Adversário";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="label-wide text-muted-foreground">Partida</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Nova Partida</h1>
        </div>
      </div>

      {/* Match setup */}
      <Card className="border-border bg-surface shadow-sm shadow-foreground/10">
        <div className="space-y-5 p-5 sm:p-6">
          {/* VS row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
            <TeamPanel
              label="Meu Time"
              sublabel="Qual time é o seu?"
              variant="alpha"
              teams={myTeams}
              selectedId={myTeamId}
              onSelect={setMyTeam}
              isWinner={winnerId === myTeamId}
              onToggleWinner={() => myTeamId && toggleWinner(myTeamId)}
              canSelectWinner={bothSelected}
              loading={isLoadingTeams}
            />

            <VsDivider lit={vsLit} />

            <TeamPanel
              label="Adversário"
              sublabel="Quem vai enfrentar?"
              variant="beta"
              teams={opponentTeams}
              selectedId={opponentId}
              onSelect={setOpponent}
              isWinner={winnerId === opponentId}
              onToggleWinner={() => opponentId && toggleWinner(opponentId)}
              canSelectWinner={bothSelected}
              loading={isLoadingTeams}
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="caption text-muted-foreground">
                Observação{" "}
                <span className="text-muted-foreground opacity-60">(opcional)</span>
              </label>
              <span className="text-xs text-muted-foreground">{note.length}/140</span>
            </div>
            <Textarea
              value={note}
              maxLength={140}
              rows={2}
              disabled={isRegistering}
              placeholder="Vale zoeira curta, sem tese de retrospectiva."
              className="resize-none placeholder:text-muted-foreground"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Register */}
          <Button
            variant="default"
            size="lg"
            className="w-full"
            disabled={!canRegister}
            onClick={() => {
              startTransition(() => {
                void registerMatch();
              });
            }}
          >
            {isRegistering ? "Registrando..." : "Registrar Partida"}
          </Button>

          {/* Contextual hint */}
          {!bothSelected && !isLoadingTeams && (
            <p className="text-center text-sm text-muted-foreground">
              Selecione meu time e o adversário para continuar
            </p>
          )}
          {bothSelected && !winnerId && (
            <p className="text-center text-sm text-muted-foreground">
              Marque quem venceu para registrar a partida
            </p>
          )}
        </div>
      </Card>

      {/* Pair history */}
      {bothSelected && (
        <section className="mt-8">
          <p className="caption mb-3 text-muted-foreground">Histórico entre os times</p>

          {pairHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Head-to-head summary */}
              <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-surface shadow-sm shadow-foreground/10">
                <div className="flex flex-col items-center gap-1 p-4">
                  <span className="text-2xl font-bold text-team-alpha">{myWins}</span>
                  <span className="text-center text-xs text-muted-foreground">{myName}</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-0.5 border-x border-border p-4">
                  <span className="text-sm font-semibold">{pairHistory.length}</span>
                  <span className="text-xs text-muted-foreground">
                    {pairHistory.length === 1 ? "partida" : "partidas"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 p-4">
                  <span className="text-2xl font-bold text-team-beta">{oppWins}</span>
                  <span className="text-center text-xs text-muted-foreground">{oppName}</span>
                </div>
              </div>

              {/* Match list */}
              <div className="grid gap-2">
                {pairHistory.map((match) => (
                  <MatchHistoryItem
                    key={match.id}
                    match={match}
                    myTeamId={myTeamId}
                    teamMap={teamMap}
                  />
                ))}
              </div>
            </div>
          ) : !isLoadingTeams ? (
            <IconCallout
              icon={<Clock className="size-4" />}
              title="Nenhuma partida registrada entre esses times"
              description="Esta será a primeira vez que esses times se enfrentam."
            />
          ) : null}
        </section>
      )}
    </main>
  );
}
