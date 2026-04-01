"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import type {
  CreateMatchResponse,
  MatchesResponse,
  MatchRecord,
  TeamRecord,
  TeamsResponse,
} from "@/lib/types";

export function usePartidaData() {
  const [myTeams, setMyTeams] = useState<TeamRecord[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRecord[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const [myTeamId, setMyTeamIdState] = useState<string | null>(null);
  const [opponentId, setOpponentIdState] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoadingTeams(true);
      try {
        const [myRes, allRes, matchesRes] = await Promise.all([
          fetch("/api/teams", { cache: "no-store" }),
          fetch("/api/teams?scope=all", { cache: "no-store" }),
          fetch("/api/matches", { cache: "no-store" }),
        ]);

        if (!myRes.ok || !allRes.ok) {
          throw new Error("Não foi possível carregar os times.");
        }

        const myJson = (await myRes.json()) as TeamsResponse;
        const allJson = (await allRes.json()) as TeamsResponse;
        const matchesJson = matchesRes.ok
          ? ((await matchesRes.json()) as MatchesResponse)
          : null;

        if (cancelled) return;

        setMyTeams(myJson.teams);
        setAllTeams(allJson.teams);
        if (matchesJson) setRecentMatches(matchesJson.matches);

        const myIds = new Set(myJson.teams.map((t) => t.id));
        const opponents = allJson.teams.filter((t) => !myIds.has(t.id));

        if (myJson.teams.length > 0) {
          setMyTeamIdState(myJson.teams[0].id);
        }
        if (opponents.length > 0) {
          setOpponentIdState(opponents[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Erro ao carregar times.");
        }
      } finally {
        if (!cancelled) setIsLoadingTeams(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const myTeamIds = new Set(myTeams.map((t) => t.id));
  const opponentTeams = allTeams.filter((t) => !myTeamIds.has(t.id));

  const pairHistory = recentMatches.filter((m) => {
    if (!myTeamId || !opponentId) return false;
    return (
      (m.teamAId === myTeamId && m.teamBId === opponentId) ||
      (m.teamAId === opponentId && m.teamBId === myTeamId)
    );
  });

  const teamMap = Object.fromEntries(allTeams.map((t) => [t.id, t.name]));

  const setMyTeam = useCallback((id: string) => {
    setMyTeamIdState(id);
    setWinnerId(null);
  }, []);

  const setOpponent = useCallback((id: string) => {
    setOpponentIdState(id);
    setWinnerId(null);
  }, []);

  const toggleWinner = useCallback((id: string) => {
    setWinnerId((prev) => (prev === id ? null : id));
  }, []);

  const registerMatch = useCallback(async () => {
    if (!myTeamId || !opponentId || !winnerId) return;

    setIsRegistering(true);

    const promise = (async () => {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAId: myTeamId,
          teamBId: opponentId,
          winnerTeamId: winnerId,
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível salvar a partida.");
      }

      const data = (await res.json()) as CreateMatchResponse;
      setRecentMatches((prev) => [data.match, ...prev]);
      setWinnerId(null);
      setNote("");
      return "Partida registrada com sucesso.";
    })();

    toast.promise(promise, {
      loading: "Registrando partida...",
      success: (msg) => msg,
      error: (err) => (err instanceof Error ? err.message : "Não foi possível salvar a partida."),
    });

    try {
      await promise;
    } finally {
      setIsRegistering(false);
    }
  }, [myTeamId, opponentId, winnerId, note]);

  return {
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
    canRegister: !!(myTeamId && opponentId && winnerId) && !isRegistering,
  };
}
