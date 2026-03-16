"use client";

import { cva } from "class-variance-authority";
import { LogOut, Swords } from "lucide-react";
import { startTransition } from "react";
import { signOut } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatTile } from "@/components/ui/stat-tile";
import { SurfacePanel } from "@/components/ui/surface-panel";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TEAMS } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";

import { DashboardHero } from "./dashboard-hero";
import { DashboardSidebar } from "./dashboard-sidebar";
import { getEnvironmentLabel, getLeaderName } from "./dashboard-utils";
import { RecentMatchesCard } from "./recent-matches-card";
import { useDashboardData } from "./use-dashboard-data";

const teamScoreCardVariants = cva(
  "overflow-hidden border shadow-none text-[color:var(--foreground)]",
  {
    variants: {
      team: {
        frontend: "bg-[color:var(--frontend-soft)]",
        backend: "bg-[color:var(--backend-soft)]",
      },
      leader: {
        true: "border-[color:var(--gold)] ring-2 ring-[color:var(--gold)]",
        false: "border-[color:var(--border)]",
      },
    },
  },
);

const teamScoreBadgeVariants = cva(
  "hidden rounded-[var(--radius-pill)] p-3 lg:block",
  {
    variants: {
      team: {
        frontend: "bg-[color:var(--frontend)]",
        backend: "bg-[color:var(--backend)]",
      },
    },
  },
);

function TeamScoreCard({
  teamId,
  wins,
  isLeader,
  isSubmitting,
  onRegisterWin,
}: {
  teamId: (typeof TEAMS)[number]["id"];
  wins: number;
  isLeader: boolean;
  isSubmitting: boolean;
  onRegisterWin: (teamId: (typeof TEAMS)[number]["id"]) => Promise<void>;
}) {
  const team = TEAMS.find((entry) => entry.id === teamId);

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
            <p className="text-[length:var(--text-label)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--muted-foreground)]">
              {team.displayName}
            </p>
            <div>
              <h3 className="text-2xl font-black tracking-[-0.04em]">{team.roster}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[color:var(--muted-foreground)]">
                {team.slogan}
              </p>
            </div>
          </div>

          {isLeader ? (
            <Badge className="border-[color:var(--gold)] bg-[color:var(--gold-soft)] text-[color:var(--foreground-soft)]">
              líder
            </Badge>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--muted-foreground)]">
              Vitórias
            </p>
            <p className="[font-family:var(--font-display)] text-[length:var(--text-score)] leading-none tracking-[0.03em]">
              {wins}
            </p>
          </div>

          <div className={teamScoreBadgeVariants({ team: team.id })}>
            <Swords className="size-5 text-white" />
          </div>
        </div>

        <Button
          variant={team.id}
          size="lg"
          className="w-full"
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

export function Dashboard({ user }: { user?: SessionUser }) {
  const {
    scoreboard,
    matches,
    loading,
    submittingTeamId,
    flashMessage,
    status,
    registerWin,
  } = useDashboardData();

  const teams = TEAMS.map((team) => ({
    id: team.id,
    wins: scoreboard?.teams.find((entry) => entry.id === team.id)?.wins ?? 0,
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      {user ? (
        <SurfacePanel className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[color:var(--surface-emphasis)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--muted-foreground)]">
              Sessao ativa
            </p>
            <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
              {user.username}
            </p>
            <p className="text-sm text-[color:var(--muted-foreground)]">{user.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle className="h-11 rounded-[var(--radius-sm)] px-4" />
            <Button
              variant="ghost"
              className="h-11 rounded-[var(--radius-sm)] px-4"
              onClick={() => {
                void signOut({ callbackUrl: "/login" });
              }}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </SurfacePanel>
      ) : null}

      <DashboardHero
        loading={loading}
        scoreboard={scoreboard}
        environmentLabel={getEnvironmentLabel()}
      />

      <Card className="overflow-hidden border-[color:var(--border-inverse)] bg-[color:var(--surface-strong)] text-[color:var(--surface-strong-foreground)]">
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
                onRegisterWin={registerWin}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <RecentMatchesCard matches={matches} />
        <DashboardSidebar flashMessage={flashMessage} status={status} />
      </section>
    </main>
  );
}
