"use client";

import { cva } from "class-variance-authority";
import { Swords } from "lucide-react";
import { startTransition, useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatTile } from "@/components/primitives/stat-tile";
// TODO(Task 5+): replace with dynamic teams fetched from /api/teams
const TEAMS = [
  {
    id: "frontend",
    name: "frontend",
    displayName: "Frontend",
    roster: "Gui + Jean",
    accent: "var(--team-alpha)",
    accentSoft: "var(--team-alpha-soft)",
    slogan: "Empurra feature e bola no mesmo sprint.",
  },
  {
    id: "backend",
    name: "backend",
    displayName: "Backend",
    roster: "Adair + Richard",
    accent: "var(--team-beta)",
    accentSoft: "var(--team-beta-soft)",
    slogan: "Consistentes ate quando o deploy cai.",
  },
] as const;

import { DashboardHero } from "./dashboard-hero";
import { DashboardSidebar } from "./dashboard-sidebar";
import { getEnvironmentLabel, getLeaderName } from "./dashboard-utils";
import { RecentMatchesCard } from "./recent-matches-card";
import { useDashboardData } from "./use-dashboard-data";

const TEAM_BUTTON_VARIANT = {
  frontend: "team-alpha",
  backend: "team-beta",
} as const;

const teamScoreCardVariants = cva(
  "overflow-hidden border shadow-sm backdrop-blur-sm text-foreground",
  {
    variants: {
      team: {
        frontend: "bg-team-alpha-soft",
        backend: "bg-team-beta-soft",
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
        frontend: "bg-team-alpha",
        backend: "bg-team-beta",
      },
    },
  },
);

function TeamScoreCard({
  teamId,
  wins,
  isLeader,
  isSubmitting,
  note,
  onNoteChange,
  onRegisterWin,
}: {
  teamId: (typeof TEAMS)[number]["id"];
  wins: number;
  isLeader: boolean;
  isSubmitting: boolean;
  note: string;
  onNoteChange: (teamId: (typeof TEAMS)[number]["id"], value: string) => void;
  onRegisterWin: (teamId: (typeof TEAMS)[number]["id"]) => Promise<void>;
}) {
  const team = TEAMS.find((entry) => entry.id === teamId);
  const noteId = useId();

  if (!team) {
    return null;
  }

  return (
    <Card
      className={teamScoreCardVariants({
        team: team.id,
        leader: isLeader,
      })}
      data-leader={isLeader}
      data-team={team.id}
    >
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="label text-foreground-soft">
              {team.displayName}
            </p>
            <div>
              <h3 className="title">{team.roster}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-foreground-soft">
                {team.slogan}
              </p>
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

          <div className={teamScoreBadgeVariants({ team: team.id })}>
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

          <textarea
            id={noteId}
            value={note}
            data-testid={`team-note-${team.id}`}
            maxLength={140}
            rows={3}
            disabled={isSubmitting}
            placeholder="Vale zoeira curta, sem tese de retrospectiva."
            className="min-h-24 w-full resize-none rounded-md border border-border-strong bg-surface-emphasis px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground-soft focus:border-team-alpha focus:ring-2 focus:ring-team-alpha-soft disabled:cursor-not-allowed disabled:bg-surface-muted"
            onChange={(event) => {
              onNoteChange(team.id, event.target.value);
            }}
          />
        </div>

        <Button
          variant={TEAM_BUTTON_VARIANT[team.id as keyof typeof TEAM_BUTTON_VARIANT]}
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
          {isSubmitting ? "Registrando..." : `Vitória ${team.displayName}`}
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
  const [notesByTeam, setNotesByTeam] = useState<Record<(typeof TEAMS)[number]["id"], string>>({
    frontend: "",
    backend: "",
  });

  const teams = TEAMS.map((team) => ({
    id: team.id,
    wins: scoreboard?.teams.find((entry) => entry.id === team.id)?.wins ?? 0,
  }));

  function handleNoteChange(teamId: (typeof TEAMS)[number]["id"], value: string) {
    setNotesByTeam((current) => ({
      ...current,
      [teamId]: value,
    }));
  }

  async function handleRegisterWin(teamId: (typeof TEAMS)[number]["id"]) {
    const didSave = await registerWin({
      teamId,
      note: notesByTeam[teamId],
    });

    if (!didSave) {
      return;
    }

    setNotesByTeam((current) => ({
      ...current,
      [teamId]: "",
    }));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6">
      <DashboardHero
        loading={loading}
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
                  value={loading ? "Carregando..." : "Mesa pronta"}
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
            {teams.map((team) => (
              <TeamScoreCard
                key={team.id}
                teamId={team.id}
                wins={team.wins}
                isLeader={scoreboard?.leaderTeamId === team.id}
                isSubmitting={submittingTeamId === team.id}
                note={notesByTeam[team.id]}
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
