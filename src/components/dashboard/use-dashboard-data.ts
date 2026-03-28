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

function buildOptimisticDashboardState(
  current: DashboardState,
  winnerTeamId: string,
  teamAId: string,
  teamBId: string,
  note: string,
) {
  if (!current.scoreboard) {
    return null;
  }

  const loserTeamId = teamAId === winnerTeamId ? teamBId : teamAId;
  const optimisticMatch: MatchRecord = {
    id: `optimistic-${winnerTeamId}-${Date.now()}`,
    teamAId,
    teamBId,
    winnerTeamId,
    loserTeamId,
    playedAt: new Date().toISOString(),
    note: note.trim() || null,
  };

  const nextTeams = current.scoreboard.teams.map((entry) => {
    if (entry.id === winnerTeamId) {
      return {
        ...entry,
        wins: entry.wins + 1,
      };
    }

    if (entry.id === loserTeamId) {
      return {
        ...entry,
        losses: entry.losses + 1,
      };
    }

    return entry;
  });

  const sortedByWins = [...nextTeams].sort((left, right) => right.wins - left.wins);
  const leader = sortedByWins[0] ?? null;
  const runnerUp = sortedByWins[1] ?? null;
  const leadBy = leader && runnerUp ? Math.max(leader.wins - runnerUp.wins, 0) : leader?.wins ?? 0;
  const leaderTeamId =
    leader && runnerUp && leader.wins === runnerUp.wins
      ? null
      : leader?.id ?? null;

  return {
    optimisticMatch,
    nextState: {
      scoreboard: {
        teams: nextTeams,
        leaderTeamId,
        leadBy,
        totalMatches: current.scoreboard.totalMatches + 1,
      },
      matches: [optimisticMatch, ...current.matches],
    },
  };
}

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
    const previousState = state;
    const optimistic = buildOptimisticDashboardState(state, teamId, teamAId, teamBId, note);

    if (optimistic) {
      setState(optimistic.nextState);
    }

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

      const createdMatch = await response.json() as CreateMatchResponse;

      if (optimistic) {
        setState((current) => ({
          ...current,
          matches: current.matches.map((match) =>
            match.id === optimistic.optimisticMatch.id
              ? createdMatch.match
              : match),
        }));
      }

      try {
        const dashboardData = await fetchDashboardData();
        setState(dashboardData);
      } catch {
        // Keep the optimistic-confirmed state when background revalidation fails.
      }

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
      setState(previousState);
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
