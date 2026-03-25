// Team domain

export type TeamStatus = "active" | "archived";

export type TeamMemberRecord = {
  userId: string;
  joinedAt: string;
};

export type TeamRecord = {
  id: string;
  name: string;
  type: 'solo' | 'duo';
  status: TeamStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberRecord[];
};

// Match domain

export type MatchRecord = {
  id: string;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string;
  loserTeamId: string;
  playedAt: string;
  note: string | null;
};

// API responses

export type TeamResponse = {
  team: TeamRecord;
};

export type TeamsResponse = {
  teams: TeamRecord[];
};

export type MatchesResponse = {
  matches: MatchRecord[];
};

export type CreateMatchResponse = {
  match: MatchRecord;
};

export type UserLookupResponse = {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export type SessionUser = {
  id: string;
  username: string;
};

export type RegisterUserResponse = {
  user: SessionUser;
};

export type ApiErrorResponse = {
  error: string;
  fieldErrors?: Partial<Record<"username" | "email" | "password", string>>;
  retryAfterSeconds?: number;
};

export type ProfileResponse = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

// Scoreboard domain

export type ScoreboardTeamEntry = {
  id: string;
  wins: number;
  losses: number;
};

export type ScoreboardData = {
  teams: ScoreboardTeamEntry[];
  leaderTeamId: string | null;
  leadBy: number;
  totalMatches: number;
};

export type ScoreboardResponse = {
  scoreboard: ScoreboardData;
};

// Stats domain — derived from Zod schemas in src/lib/stats.ts

export type { TeamStats, HeadToHeadStats } from "@/lib/stats";
