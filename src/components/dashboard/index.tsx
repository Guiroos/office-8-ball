"use client";

import { cva } from "class-variance-authority";
import { Swords } from "lucide-react";
import { startTransition, useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatTile } from "@/components/primitives/stat-tile";
import type { TeamRecord } from "@/lib/types";

import { DashboardHero } from "./dashboard-hero";
import { DashboardSidebar } from "./dashboard-sidebar";
import { getEnvironmentLabel, getLeaderName } from "./dashboard-utils";
import { RecentMatchesCard } from "./recent-matches-card";
import { useDashboardData, useTeamsData } from "./use-dashboard-data";

const teamScoreCardVariants = cva(
  "overflow-hidden border shadow-sm backdrop-blur-sm text-foreground",
  {
    variants: {
      team: {
        alpha: "bg-team-alpha-soft",
        beta: "bg-team-beta-soft",
      },
      leader: {
        true: "border-gold ring-2 ring-gold",
        false: "border-border-strong",
      },
    },
  },
);

const teamScoreBadgeVariants = cva(
  "hidden rounded-pill p-3 lg:block",
  {
    variants: {
      team: {
        alpha: "bg-team-alpha",
        beta: "bg-team-beta",
      },
    },
  },
);

function getTeamVariant(index: number): "alpha" | "beta" {
  return index === 0 ? "alpha" : "beta";
}

function getButtonVariant(index: number): "team-alpha" | "team-beta" {
  return index === 0 ? "team-alpha" : "team-beta";
}

function TeamScoreCard({
  team,
  teamVariant,
  wins,
  isLeader,
  isSubmitting,
  note,
  onNoteChange,
  onRegisterWin,
}: {
  team: TeamRecord;
  teamVariant: "alpha" | "beta";
  wins: number;
  isLeader: boolean;
  isSubmitting: boolean;
  note: string;
  onNoteChange: (teamId: string, value: string) => void;
  onRegisterWin: (teamId: string) => Promise<void>;
}) {
  const noteId = useId();

  return (
    <Card
      className={teamScoreCardVariants({
        team: teamVariant,
        leader: isLeader,
      })}
      data-leader={isLeader}
      data-team={team.id}
    >
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="label text-foreground-soft">
              {team.name}
            </p>
            <div>
              <h3 className="title">
                {team.members.length} membro{team.members.length !== 1 ? "s" : ""}
              </h3>
            </div>
          </div>

          {isLeader ? (
            <Badge className="border-gold bg-gold-soft text-foreground">
              líder
            </Badge>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="caption text-foreground-soft">
              Vitórias
            </p>
            <p className="font-display display">
              <span data-testid={`team-wins-${team.id}`}>{wins}</span>
            </p>
          </div>

          <div className={teamScoreBadgeVariants({ team: teamVariant })}>
            <Swords className="size-5 text-foreground-inverse" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor={noteId}
              className="caption text-foreground-soft"
            >
              Provocação opcional
            </label>
            <span className="text-xs font-medium text-foreground-soft">
              {note.length}/140
            </span>
          </div>

          <Textarea
            id={noteId}
            value={note}
            data-testid={`team-note-${team.id}`}
            maxLength={140}
            rows={3}
            disabled={isSubmitting}
            placeholder="Vale zoeira curta, sem tese de retrospectiva."
            className="resize-none border-border-strong placeholder:text-foreground-soft"
            onChange={(event) => {
              onNoteChange(team.id, event.target.value);
            }}
          />
        </div>

        <Button
          variant={getButtonVariant(teamVariant === "alpha" ? 0 : 1)}
          size="lg"
          className="w-full"
          data-testid={`register-win-${team.id}`}
          onClick={() => {
            startTransition(() => {
              void onRegisterWin(team.id);
            });
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Registrando..." : `Vitória ${team.name}`}
        </Button>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const {
    scoreboard,
    matches,
    loading,
    submittingTeamId,
    registerWin,
  } = useDashboardData();
  const { teams: dynamicTeams, teamsLoading } = useTeamsData();
  const [notesByTeam, setNotesByTeam] = useState<Record<string, string>>({});

  function handleNoteChange(teamId: string, value: string) {
    setNotesByTeam((current) => ({
      ...current,
      [teamId]: value,
    }));
  }

  async function handleRegisterWin(winnerTeamId: string) {
    // Find the other team (first team that is not the winner)
    // For Phase 2 MVP, assume matches are between all pairs; use first two teams in list
    const otherTeam = dynamicTeams.find((t) => t.id !== winnerTeamId);
    if (!otherTeam) return;

    const didSave = await registerWin({
      teamId: winnerTeamId,
      teamAId: winnerTeamId,
      teamBId: otherTeam.id,
      note: notesByTeam[winnerTeamId] ?? "",
    });

    if (!didSave) return;

    setNotesByTeam((current) => ({
      ...current,
      [winnerTeamId]: "",
    }));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6">
      <DashboardHero
        loading={loading || teamsLoading}
        scoreboard={scoreboard}
        environmentLabel={getEnvironmentLabel()}
      />

      <Card className="text-surface-strong-foreground overflow-hidden border-border-inverse bg-surface-brand shadow-lg shadow-gold/35">
        <CardContent className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
          <SectionHeader
            eyebrow="Placar atual"
            title="Frontend vs Backend"
            description="Registro rápido, sem rodeio e sem update otimista antes da persistência fechar."
            inverse
            actions={
              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile
                  label="Liderança"
                  value={getLeaderName(scoreboard)}
                  description={
                    scoreboard?.leadBy ? `${scoreboard.leadBy} de vantagem` : "sem folga"
                  }
                  tone="inverse"
                />
                <StatTile
                  label="Ritmo"
                  value={loading || teamsLoading ? "Carregando..." : "Mesa pronta"}
                  description={
                    submittingTeamId ? "gravando partida" : "aguardando a próxima treta"
                  }
                  tone="inverse"
                />
                <StatTile
                  label="Ambiente"
                  value={getEnvironmentLabel()}
                  description="mesma interface, clima diferente"
                  tone="inverse"
                />
              </div>
            }
          />

          <div className="grid gap-4 lg:grid-cols-2">
            {dynamicTeams.map((team, index) => (
              <TeamScoreCard
                key={team.id}
                team={team}
                teamVariant={getTeamVariant(index)}
                wins={scoreboard?.teams.find((entry) => entry.id === team.id)?.wins ?? 0}
                isLeader={scoreboard?.leaderTeamId === team.id}
                isSubmitting={submittingTeamId === team.id}
                note={notesByTeam[team.id] ?? ""}
                onNoteChange={handleNoteChange}
                onRegisterWin={handleRegisterWin}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <RecentMatchesCard matches={matches} />
        <DashboardSidebar />
      </section>
    </main>
  );
}
