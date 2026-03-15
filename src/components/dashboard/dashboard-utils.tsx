import { WifiOff, Zap } from "lucide-react";

import type { ScoreboardData } from "@/lib/types";

export type DashboardStatus = {
  title: string;
  description: string;
  icon: typeof WifiOff;
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

export function getStatusMessage(error: string | null): DashboardStatus {
  if (error) {
    return {
      title: "Falha ao sincronizar a mesa.",
      description: error,
      icon: WifiOff,
    };
  }

  return {
    title: "Placares prontos para mais uma discussão improdutiva.",
    description: "Se o banco Neon estiver configurado, os dados ficam compartilhados.",
    icon: Zap,
  };
}
