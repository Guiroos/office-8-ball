import type { TeamRecord, MatchRecord, ProfilePageData, ProfileTeamStatsRow, ProfileAggregateStats } from "@/lib/types";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the full profile page payload for a user.
 *
 * Semantics:
 * - D-05: A match counts when the user belongs to at least one of the two teams.
 * - D-06: Uses current membership snapshot (teams parameter) — no historical membership window.
 * - D-07: Archived team matches still count in historical aggregates.
 * - D-08: If the user belongs to both teams in the same match, the match is counted once.
 *
 * Pure function: no side effects, no database access.
 *
 * @param userId  The user whose profile is being assembled.
 * @param teams   All teams the user currently belongs to (active and archived, D-07).
 * @param matches All matches to consider. Caller is responsible for passing the correct scope.
 */
export function computeProfilePageData(
  userId: string,
  teams: TeamRecord[],
  matches: MatchRecord[]
): ProfilePageData & { userId: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; createdAt: string } {
  // Build a Set of the user's team IDs for O(1) membership lookup (D-06).
  const teamIds = new Set(teams.map((t) => t.id));

  // D-08: Deduplicate matches by id using a Map so a match is counted once
  // even when the user belongs to both teamAId and teamBId.
  const uniqueMatches = new Map(matches.map((match) => [match.id, match]));

  // Filter to only matches where the user participates via at least one team (D-05).
  const userMatches = Array.from(uniqueMatches.values()).filter(
    (match) => teamIds.has(match.teamAId) || teamIds.has(match.teamBId)
  );

  // ─── Aggregate across all user teams ────────────────────────────────────────

  let totalWins = 0;
  let totalLosses = 0;

  for (const match of userMatches) {
    // Determine which of the user's teams won/lost.
    // If user is in both teams (edge case D-08), credit the winner side.
    const userOwnsWinner = teamIds.has(match.winnerTeamId);
    if (userOwnsWinner) {
      totalWins++;
    } else {
      totalLosses++;
    }
  }

  const totalMatches = totalWins + totalLosses;
  const aggregate: ProfileAggregateStats = {
    wins: totalWins,
    losses: totalLosses,
    winRate: totalMatches === 0 ? 0 : (totalWins / totalMatches) * 100,
    totalMatches,
  };

  // ─── Per-team breakdown ──────────────────────────────────────────────────────

  const teamRows: ProfileTeamStatsRow[] = teams.map((team) => {
    // Matches where this specific team participated
    const teamMatches = userMatches.filter(
      (m) => m.teamAId === team.id || m.teamBId === team.id
    );

    let wins = 0;
    let losses = 0;
    for (const m of teamMatches) {
      if (m.winnerTeamId === team.id) {
        wins++;
      } else {
        losses++;
      }
    }

    const teamTotal = wins + losses;
    return {
      teamId: team.id,
      teamName: team.name,
      wins,
      losses,
      winRate: teamTotal === 0 ? 0 : (wins / teamTotal) * 100,
      totalMatches: teamTotal,
    };
  });

  // ─── Return assembled payload ────────────────────────────────────────────────
  // Note: User identity fields (username, displayName, avatarUrl, bio, createdAt)
  // are provided by the caller (server assembler) from the DB/session.
  // We set sensible defaults here; the page assembler will override them (D-01).

  return {
    userId,
    username: "",
    displayName: null,
    avatarUrl: null,
    bio: null,
    createdAt: new Date().toISOString(),
    aggregate,
    teamRows,
  };
}
