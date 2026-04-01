import type { ScoreboardData } from "@/lib/types";

export { formatMatchDate } from "@/lib/format";

export function getLeadLabel(scoreboard: ScoreboardData) {
  if (!scoreboard.leaderTeamId || scoreboard.leadBy === 0) {
    return "Empate técnico. A próxima derrota vai doer mais.";
  }

  const leader = scoreboard.teams.find((team) => team.id === scoreboard.leaderTeamId);
  return `${leader?.id ?? "Alguém"} lidera por ${scoreboard.leadBy}.`;
}

export function getLeaderName(scoreboard: ScoreboardData | null) {
  if (!scoreboard?.leaderTeamId) {
    return "Empate";
  }

  return (
    scoreboard.teams.find((team) => team.id === scoreboard.leaderTeamId)?.id ??
    "Alguém"
  );
}

export function getEnvironmentLabel() {
  return process.env.NEXT_PUBLIC_APP_ENV === "production" ? "Escritório" : "Dev";
}
