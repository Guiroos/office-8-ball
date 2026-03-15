"use client";

import { LogOut, Swords } from "lucide-react";
import { startTransition } from "react";
import { signOut } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TEAMS } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";

import { DashboardHero } from "./dashboard-hero";
import { DashboardSidebar } from "./dashboard-sidebar";
import { getEnvironmentLabel, getLeaderName } from "./dashboard-utils";
import { RecentMatchesCard } from "./recent-matches-card";
import { useDashboardData } from "./use-dashboard-data";

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
      className="overflow-hidden border-none shadow-none"
      style={{
        backgroundColor: team.accentSoft,
        color: "var(--foreground)",
        outline: isLeader
          ? "3px solid var(--gold)"
          : "1px solid var(--border)",
      }}
    >
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
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
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
              Vitórias
            </p>
            <p className="font-['Copperplate','Impact','Arial_Narrow_Bold',sans-serif] text-[clamp(4rem,12vw,6rem)] leading-none tracking-[0.03em]">
              {wins}
            </p>
          </div>

          <div
            className="hidden rounded-full p-3 lg:block"
            style={{ backgroundColor: team.accent }}
          >
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
        <div className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] px-5 py-4 shadow-[var(--shadow-lg)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
              Sessao ativa
            </p>
            <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
              {user.username}
            </p>
            <p className="text-sm text-[color:var(--muted-foreground)]">{user.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle className="h-11 rounded-[18px] px-4" />
            <Button
              variant="ghost"
              className="h-11 rounded-[18px] px-4"
              onClick={() => {
                void signOut({ callbackUrl: "/login" });
              }}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </div>
      ) : null}

      <DashboardHero
        loading={loading}
        scoreboard={scoreboard}
        environmentLabel={getEnvironmentLabel()}
      />

      <Card className="overflow-hidden border-[color:var(--border-inverse)] bg-[color:var(--surface-strong)] text-[color:var(--surface-strong-foreground)]">
        <CardContent className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <CardHeader className="gap-3">
              <Badge className="border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] text-[color:var(--surface-strong-foreground-muted)]">
                Placar atual
              </Badge>
              <CardTitle>Frontend vs Backend</CardTitle>
              <CardDescription className="max-w-xl text-[color:var(--surface-strong-foreground-muted)]">
                Registro rápido, sem rodeio e sem update otimista antes da persistência
                fechar.
              </CardDescription>
            </CardHeader>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--surface-strong-foreground-muted)]">
                  Liderança
                </p>
                <p className="mt-2 text-lg font-semibold">{getLeaderName(scoreboard)}</p>
                <p className="mt-1 text-sm text-[color:var(--surface-strong-foreground-muted)]">
                  {scoreboard?.leadBy ? `${scoreboard.leadBy} de vantagem` : "sem folga"}
                </p>
              </div>

              <div className="rounded-[22px] border border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--surface-strong-foreground-muted)]">
                  Ritmo
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {loading ? "Carregando..." : "Mesa pronta"}
                </p>
                <p className="mt-1 text-sm text-[color:var(--surface-strong-foreground-muted)]">
                  {submittingTeamId ? "gravando partida" : "aguardando a próxima treta"}
                </p>
              </div>

              <div className="rounded-[22px] border border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--surface-strong-foreground-muted)]">
                  Ambiente
                </p>
                <p className="mt-2 text-lg font-semibold">{getEnvironmentLabel()}</p>
                <p className="mt-1 text-sm text-[color:var(--surface-strong-foreground-muted)]">
                  mesma interface, clima diferente
                </p>
              </div>
            </div>
          </div>

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
