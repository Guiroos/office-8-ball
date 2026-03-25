import { toast } from "sonner";
import { useEffect, useState } from "react";

import type {
  CreateMatchResponse,
  MatchesResponse,
  MatchRecord,
  ScoreboardData,
  ScoreboardResponse,
  TeamRecord,
  TeamsResponse,
} from "@/lib/types";

type DashboardState = {
  scoreboard: ScoreboardData | null;
  matches: MatchRecord[];
};

type RegisterWinInput = {
  teamId: string;       // the winning team ID (winnerTeamId)
  teamAId: string;      // first team in the pair
  teamBId: string;      // second team in the pair
  note: string;
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

export function useTeamsData() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/teams", { cache: "no-store" });
        if (!response.ok) throw new Error("Não foi possível carregar os times.");
        const json = (await response.json()) as TeamsResponse;
        setTeams(json.teams);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Não foi possível carregar os times.",
        );
      } finally {
        setTeamsLoading(false);
      }
    })();
  }, []);

  return { teams, teamsLoading };
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    scoreboard: null,
    matches: [],
  });
  const [loading, setLoading] = useState(true);
  const [submittingTeamId, setSubmittingTeamId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const dashboardData = await fetchDashboardData();
        setState(dashboardData);
      } catch (loadError) {
        toast.error(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar o placar.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function registerWin({ teamId, teamAId, teamBId, note }: RegisterWinInput) {
    setSubmittingTeamId(teamId);

    const execute = async () => {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamAId, teamBId, winnerTeamId: teamId, note }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Não foi possível salvar a partida.");
      }

      await response.json() as CreateMatchResponse;
      const dashboardData = await fetchDashboardData();
      setState(dashboardData);
      return "Partida registrada com sucesso.";
    };

    // execute() cria a promise uma vez. toast.promise cuida do feedback visual;
    // o await abaixo dirige a atualização de estado e o valor de retorno.
    const promise = execute();

    toast.promise(promise, {
      loading: "Registrando partida...",
      success: (msg) => msg,
      error: (err) =>
        err instanceof Error ? err.message : "Não foi possível salvar a partida.",
    });

    try {
      await promise;
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingTeamId(null);
    }
  }

  return {
    scoreboard: state.scoreboard,
    matches: state.matches,
    loading,
    submittingTeamId,
    registerWin,
  };
}
