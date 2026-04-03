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
  memberNames?: string[];
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
  displayName: string | null;
  avatarUrl: string | null;
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

// Profile and ranking period domain (Phase 5: PROF-01..03, RANK-05)
//
// D-01: Profile is assembled server-side from user + aggregated stats + per-team stats.
// D-04: Aggregation lives in profile-stats.ts; not in page components or team-details.ts.

/**
 * Time window for ranking and profile filters.
 * D-09: Values are "all" | "month" | "week".
 */
export type RankingPeriod = "all" | "month" | "week";

/**
 * Per-team stats row shown on the profile page.
 * Derived from match history; not persisted.
 */
export type ProfileTeamStatsRow = {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  winRate: number;
  totalMatches: number;
};

/**
 * Aggregated stats across all teams the user belongs to.
 * D-05: A match counts when the user is on at least one of the two teams.
 * D-08: A match counts once even if the user belongs to both teams.
 */
export type ProfileAggregateStats = {
  wins: number;
  losses: number;
  winRate: number;
  totalMatches: number;
};

/**
 * Full profile page payload produced by the domain assembler.
 * D-01: Assembled server-side; no client fetch needed for the primary metric.
 */
export type ProfilePageData = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  aggregate: ProfileAggregateStats;
  teamRows: ProfileTeamStatsRow[];
};
