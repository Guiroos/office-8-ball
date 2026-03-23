// TODO(Task 3/4): replace with new scoreboard types once scoreboard route is updated
type ScoreboardData = {
  teams: Array<{ id: string; displayName: string; wins: number; [key: string]: unknown }>;
  leaderTeamId: string | null;
  leadBy: number;
  totalMatches: number;
  currentStreak: { teamId: string; teamName: string; count: number } | null;
};

export function formatMatchDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export function getLeadLabel(scoreboard: ScoreboardData) {
  if (!scoreboard.leaderTeamId || scoreboard.leadBy === 0) {
    return "Empate técnico. A próxima derrota vai doer mais.";
  }

  const leader = scoreboard.teams.find((team) => team.id === scoreboard.leaderTeamId);
  return `${leader?.displayName ?? "Alguém"} lidera por ${scoreboard.leadBy}.`;
}

export function getLeaderName(scoreboard: ScoreboardData | null) {
  if (!scoreboard?.leaderTeamId) {
    return "Empate";
  }

  return (
    scoreboard.teams.find((team) => team.id === scoreboard.leaderTeamId)?.displayName ??
    "Alguém"
  );
}

export function getEnvironmentLabel() {
  return process.env.NEXT_PUBLIC_APP_ENV === "production" ? "Escritório" : "Dev";
}
