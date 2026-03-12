"use client";

import { startTransition, useEffect, useState } from "react";

import styles from "@/components/dashboard.module.css";
import { TEAMS } from "@/lib/constants";
import type {
  CreateMatchResponse,
  MatchesResponse,
  MatchRecord,
  ScoreboardData,
  ScoreboardResponse,
  TeamId,
} from "@/lib/types";

type DashboardState = {
  scoreboard: ScoreboardData | null;
  matches: MatchRecord[];
};

function formatMatchDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function getLeadLabel(scoreboard: ScoreboardData) {
  if (!scoreboard.leaderTeamId || scoreboard.leadBy === 0) {
    return "Empate tecnico. A proxima derrota vai doer mais.";
  }

  const leader = scoreboard.teams.find(
    (team) => team.id === scoreboard.leaderTeamId,
  );

  return `${leader?.displayName ?? "Alguem"} lidera por ${scoreboard.leadBy}.`;
}

async function fetchDashboardData() {
  const [scoreboardResponse, matchesResponse] = await Promise.all([
    fetch("/api/scoreboard", { cache: "no-store" }),
    fetch("/api/matches", { cache: "no-store" }),
  ]);

  if (!scoreboardResponse.ok || !matchesResponse.ok) {
    throw new Error("Nao foi possivel carregar o placar.");
  }

  const scoreboardJson = (await scoreboardResponse.json()) as ScoreboardResponse;
  const matchesJson = (await matchesResponse.json()) as MatchesResponse;

  return {
    scoreboard: scoreboardJson.scoreboard,
    matches: matchesJson.matches,
  };
}

export function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    scoreboard: null,
    matches: [],
  });
  const [loading, setLoading] = useState(true);
  const [submittingTeamId, setSubmittingTeamId] = useState<TeamId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const dashboardData = await fetchDashboardData();
        setError(null);
        setState(dashboardData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nao foi possivel carregar o placar.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function registerWin(teamId: TeamId) {
    setSubmittingTeamId(teamId);
    setError(null);
    setFlashMessage(null);

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ winnerTeamId: teamId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Nao foi possivel salvar a partida.");
      }

      const payload = (await response.json()) as CreateMatchResponse;
      setFlashMessage(payload.message);
      const dashboardData = await fetchDashboardData();
      setState(dashboardData);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Nao foi possivel salvar a partida.",
      );
    } finally {
      setSubmittingTeamId(null);
    }
  }

  const scoreboard = state.scoreboard;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Mesa oficial do escritorio</p>
          <h1>Office 8 Ball</h1>
          <p className={styles.description}>
            Um placar interno para registrar quem saiu da mesa como campeao e
            quem saiu procurando desculpa tecnica.
          </p>
        </div>

        <div className={styles.heroAside}>
          <span className={styles.badge}>
            {process.env.NEXT_PUBLIC_APP_ENV === "production"
              ? "Modo escritorio"
              : "Modo dev"}
          </span>
          <p>
            {loading || !scoreboard
              ? "Carregando o tribunal da sinuca..."
              : getLeadLabel(scoreboard)}
          </p>
        </div>
      </section>

      <section className={styles.scoreboardPanel}>
        <div className={styles.scoreSummary}>
          <div>
            <p className={styles.sectionLabel}>Placar atual</p>
            <h2>Frontend vs Backend</h2>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <span>Total</span>
              <strong>{scoreboard?.totalMatches ?? 0}</strong>
              <small>partidas registradas</small>
            </div>
            <div className={styles.metaCard}>
              <span>Streak</span>
              <strong>
                {scoreboard?.currentStreak
                  ? `${scoreboard.currentStreak.count}x`
                  : "0x"}
              </strong>
              <small>
                {scoreboard?.currentStreak
                  ? scoreboard.currentStreak.teamName
                  : "sem dominante"}
              </small>
            </div>
          </div>
        </div>

        <div className={styles.teamsGrid}>
          {TEAMS.map((team) => {
            const currentTeam = scoreboard?.teams.find(
              (entry) => entry.id === team.id,
            );
            const isLeader = scoreboard?.leaderTeamId === team.id;
            const isSubmitting = submittingTeamId === team.id;

            return (
              <article
                key={team.id}
                className={styles.teamCard}
                data-team={team.id}
                data-leading={isLeader}
              >
                <div className={styles.teamHeader}>
                  <div>
                    <p className={styles.teamLabel}>{team.displayName}</p>
                    <h3>{team.roster}</h3>
                  </div>
                  {isLeader ? <span className={styles.leaderPill}>lider</span> : null}
                </div>

                <p className={styles.teamSlogan}>{team.slogan}</p>
                <div className={styles.scoreValue}>{currentTeam?.wins ?? 0}</div>

                <button
                  type="button"
                  className={styles.winButton}
                  onClick={() => {
                    startTransition(() => {
                      void registerWin(team.id);
                    });
                  }}
                  disabled={Boolean(submittingTeamId)}
                >
                  {isSubmitting ? "Registrando..." : `Vitoria ${team.displayName}`}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.lowerGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Ultimas partidas</p>
              <h2>Historico recente</h2>
            </div>
          </div>

          {state.matches.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Nenhuma partida registrada ainda.</strong>
              <p>A primeira vitoria ja pode vir carregada de provocacao.</p>
            </div>
          ) : (
            <ul className={styles.matchList}>
              {state.matches.map((match) => (
                <li key={match.id} className={styles.matchRow}>
                  <div>
                    <strong>{match.winnerName}</strong>
                    <p>{match.winnerRoster}</p>
                  </div>
                  <div className={styles.matchMeta}>
                    <span>{formatMatchDate(match.playedAt)}</span>
                    {match.note ? <small>{match.note}</small> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionLabel}>Clima da mesa</p>
              <h2>Leitura oficial</h2>
            </div>
          </div>

          <div className={styles.insightStack}>
            <div className={styles.insightCard}>
              <span>Mensagem</span>
              <strong>{flashMessage ?? "Registre a proxima vitoria para liberar a zoeira."}</strong>
            </div>

            <div className={styles.insightCard}>
              <span>Status</span>
              <strong>
                {error
                  ? "Falha ao sincronizar a mesa."
                  : "Placares prontos para mais uma discussao improdutiva."}
              </strong>
              <p>{error ?? "Se o banco Neon estiver configurado, os dados ficam compartilhados."}</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
