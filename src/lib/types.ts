export type TeamId = "frontend" | "backend";

export type Team = {
  id: TeamId;
  name: string;
  displayName: string;
  roster: string;
  accent: string;
  accentSoft: string;
  slogan: string;
};

export type MatchRecord = {
  id: string;
  winnerTeamId: TeamId;
  winnerName: string;
  winnerRoster: string;
  playedAt: string;
  note: string | null;
};

export type TeamScore = Team & {
  wins: number;
};

export type ScoreboardData = {
  teams: TeamScore[];
  leaderTeamId: TeamId | null;
  leadBy: number;
  totalMatches: number;
  currentStreak: {
    teamId: TeamId;
    teamName: string;
    count: number;
  } | null;
};

export type ScoreboardResponse = {
  scoreboard: ScoreboardData;
};

export type MatchesResponse = {
  matches: MatchRecord[];
};

export type CreateMatchResponse = {
  match: MatchRecord;
  message: string;
};

export type SessionUser = {
  id: string;
  username: string;
  email: string;
};

export type RegisterUserResponse = {
  user: SessionUser;
};

export type ApiErrorResponse = {
  error: string;
  fieldErrors?: Partial<Record<"username" | "email" | "password", string>>;
};
