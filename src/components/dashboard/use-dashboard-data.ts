import { useEffect, useState } from "react";

import type {
  CreateMatchResponse,
  MatchesResponse,
  MatchRecord,
  ScoreboardData,
  ScoreboardResponse,
  TeamId,
} from "@/lib/types";

import { getStatusMessage } from "./dashboard-utils";

type DashboardState = {
  scoreboard: ScoreboardData | null;
  matches: MatchRecord[];
};

async function fetchDashboardData() {
  const [scoreboardResponse, matchesResponse] = await Promise.all([
    fetch("/api/scoreboard", { cache: "no-store" }),
    fetch("/api/matches", { cache: "no-store" }),
  ]);

  if (!scoreboardResponse.ok || !matchesResponse.ok) {
    throw new Error("Não foi possível carregar o placar.");
  }

  const scoreboardJson = (await scoreboardResponse.json()) as ScoreboardResponse;
  const matchesJson = (await matchesResponse.json()) as MatchesResponse;

  return {
    scoreboard: scoreboardJson.scoreboard,
    matches: matchesJson.matches,
  };
}

export function useDashboardData() {
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
            : "Não foi possível carregar o placar.",
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
        throw new Error(payload?.error ?? "Não foi possível salvar a partida.");
      }

      const payload = (await response.json()) as CreateMatchResponse;
      setFlashMessage(payload.message);
      const dashboardData = await fetchDashboardData();
      setState(dashboardData);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível salvar a partida.",
      );
    } finally {
      setSubmittingTeamId(null);
    }
  }

  return {
    scoreboard: state.scoreboard,
    matches: state.matches,
    loading,
    submittingTeamId,
    flashMessage,
    status: getStatusMessage(error),
    registerWin,
  };
}
