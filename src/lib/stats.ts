import { z } from "zod";
import type { MatchRecord } from "@/lib/types";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const StreakSchema = z.object({
  type: z.enum(["win", "loss", "none"]),
  count: z.number().int().nonnegative(),
});

export const TeamStatsSchema = z.object({
  teamId: z.string(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  winRate: z.number().min(0).max(100),
  currentStreak: StreakSchema,
  longestStreak: StreakSchema,
  totalMatches: z.number().int().nonnegative(),
  lastFiveResults: z.array(z.enum(["win", "loss"])).max(5),
});

export const HeadToHeadStatsSchema = z.object({
  teamAId: z.string(),
  teamBId: z.string(),
  teamAWins: z.number().int().nonnegative(),
  teamBWins: z.number().int().nonnegative(),
  totalMatches: z.number().int().nonnegative(),
  recentMatchIds: z.array(z.string()),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type TeamStats = z.infer<typeof TeamStatsSchema>;
export type HeadToHeadStats = z.infer<typeof HeadToHeadStatsSchema>;

// ─── Internal helpers ─────────────────────────────────────────────────────────

type Streak = { type: "win" | "loss" | "none"; count: number };

function detectStreaks(
  teamId: string,
  teamMatches: MatchRecord[]
): { currentStreak: Streak; longestStreak: Streak } {
  if (teamMatches.length === 0) {
    return {
      currentStreak: { type: "none", count: 0 },
      longestStreak: { type: "none", count: 0 },
    };
  }

  let runType: "win" | "loss" | "none" = "none";
  let runCount = 0;
  let longestType: "win" | "loss" | "none" = "none";
  let longestCount = 0;

  // Iterate oldest → newest (reverse of descending input) so that the final
  // value of runType/runCount reflects the MOST RECENT continuous run.
  for (let i = teamMatches.length - 1; i >= 0; i--) {
    const match = teamMatches[i];
    const matchType: "win" | "loss" =
      match.winnerTeamId === teamId ? "win" : "loss";

    if (runType === "none") {
      runType = matchType;
      runCount = 1;
    } else if (runType === matchType) {
      runCount++;
    } else {
      // Streak broke — check against longest before resetting
      if (runCount > longestCount) {
        longestType = runType;
        longestCount = runCount;
      }
      runType = matchType;
      runCount = 1;
    }
  }

  // Always compare final streak (loop ends without a break for last/most-recent streak)
  if (runCount > longestCount) {
    longestType = runType;
    longestCount = runCount;
  }

  return {
    currentStreak: { type: runType, count: runCount },
    longestStreak: { type: longestType, count: longestCount },
  };
}

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Compute per-team statistics from a full match history.
 *
 * Pure function: no side effects, no database access.
 * Matches are expected in descending playedAt order (most recent first).
 * currentStreak reflects the most recent sequence; longestStreak is the
 * all-time best run in the provided match array.
 */
export function computeTeamStats(
  teamId: string,
  allMatches: MatchRecord[]
): TeamStats {
  const teamMatches = allMatches.filter(
    (m) => m.teamAId === teamId || m.teamBId === teamId
  );

  let wins = 0;
  let losses = 0;
  for (const match of teamMatches) {
    if (match.winnerTeamId === teamId) {
      wins++;
    } else {
      losses++;
    }
  }

  const total = teamMatches.length;
  const winRate = total === 0 ? 0 : (wins / total) * 100;

  const { currentStreak, longestStreak } = detectStreaks(teamId, teamMatches);
  const lastFiveResults = teamMatches
    .slice(0, 5)
    .map((match) => (match.winnerTeamId === teamId ? "win" : "loss"));

  return TeamStatsSchema.parse({
    teamId,
    wins,
    losses,
    winRate,
    currentStreak,
    longestStreak,
    totalMatches: total,
    lastFiveResults,
  });
}

/**
 * Compute head-to-head statistics between two teams.
 *
 * Pure function: no side effects, no database access.
 * Handles both match orderings (teamA vs teamB and teamB vs teamA).
 * recentMatchIds contains up to 10 most recent match IDs.
 */
export function computeHeadToHead(
  teamAId: string,
  teamBId: string,
  allMatches: MatchRecord[]
): HeadToHeadStats {
  const h2hMatches = allMatches.filter(
    (m) =>
      (m.teamAId === teamAId && m.teamBId === teamBId) ||
      (m.teamAId === teamBId && m.teamBId === teamAId)
  );

  let teamAWins = 0;
  let teamBWins = 0;
  for (const match of h2hMatches) {
    if (match.winnerTeamId === teamAId) {
      teamAWins++;
    } else if (match.winnerTeamId === teamBId) {
      teamBWins++;
    }
  }

  const recentMatchIds = h2hMatches.slice(0, 10).map((m) => m.id);

  return HeadToHeadStatsSchema.parse({
    teamAId,
    teamBId,
    teamAWins,
    teamBWins,
    totalMatches: h2hMatches.length,
    recentMatchIds,
  });
}
