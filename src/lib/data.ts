import { prisma } from "@/lib/prisma";
import type { CreateMatchResponse, MatchRecord, ScoreboardData, ScoreboardTeamEntry } from "@/lib/types";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function normalizeMatch(row: {
  id: string;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string;
  playedAt: Date;
  note: string | null;
}): MatchRecord {
  return {
    id: row.id,
    teamAId: row.teamAId,
    teamBId: row.teamBId,
    winnerTeamId: row.winnerTeamId,
    loserTeamId:
      row.teamAId === row.winnerTeamId ? row.teamBId : row.teamAId,
    playedAt: row.playedAt.toISOString(),
    note: row.note,
  };
}

export async function listMatches(userId: string): Promise<MatchRecord[]> {
  if (!hasDatabaseUrl()) return [];

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = memberships.map((m) => m.teamId);

  if (teamIds.length === 0) return [];

  const rows = await prisma.match.findMany({
    where: {
      OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }],
    },
    orderBy: { playedAt: "desc" },
  });

  return rows.map(normalizeMatch);
}

export async function createMatch(input: {
  teamAId: string;
  teamBId: string;
  winnerTeamId: string;
  note?: string;
}): Promise<CreateMatchResponse> {
  const row = await prisma.match.create({
    data: {
      teamAId: input.teamAId,
      teamBId: input.teamBId,
      winnerTeamId: input.winnerTeamId,
      note: input.note?.trim() || null,
    },
  });

  return { match: normalizeMatch(row) };
}

export async function getScoreboard(userId: string): Promise<ScoreboardData> {
  if (!hasDatabaseUrl()) {
    return { teams: [], leaderTeamId: null, leadBy: 0, totalMatches: 0 };
  }

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = memberships.map((m) => m.teamId);

  if (teamIds.length === 0) {
    return { teams: [], leaderTeamId: null, leadBy: 0, totalMatches: 0 };
  }

  // NOTE: NO .take() — fetching ALL matches is critical to prevent silent scoreboard corruption
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { teamAId: { in: teamIds } },
        { teamBId: { in: teamIds } },
      ],
    },
    orderBy: { playedAt: "desc" },
  });

  // Count wins and losses per team from match history
  const winsMap = new Map<string, number>(teamIds.map((id) => [id, 0]));
  const lossesMap = new Map<string, number>(teamIds.map((id) => [id, 0]));

  // Count unique match IDs to compute totalMatches (matches may appear for both teams)
  const matchIdsSeen = new Set<string>();

  for (const match of matches) {
    matchIdsSeen.add(match.id);
    if (winsMap.has(match.winnerTeamId)) {
      winsMap.set(match.winnerTeamId, (winsMap.get(match.winnerTeamId) ?? 0) + 1);
    }
    // loserTeamId is whichever of teamAId/teamBId is not the winner
    const loserTeamId = match.teamAId === match.winnerTeamId ? match.teamBId : match.teamAId;
    if (lossesMap.has(loserTeamId)) {
      lossesMap.set(loserTeamId, (lossesMap.get(loserTeamId) ?? 0) + 1);
    }
  }

  const teams: ScoreboardTeamEntry[] = teamIds.map((id) => ({
    id,
    wins: winsMap.get(id) ?? 0,
    losses: lossesMap.get(id) ?? 0,
  }));

  // Sort descending by wins
  teams.sort((a, b) => b.wins - a.wins);

  // Compute leaderTeamId and leadBy
  const [first, second] = teams;
  let leaderTeamId: string | null = null;
  let leadBy = 0;

  if (first && second) {
    if (first.wins !== second.wins) {
      leaderTeamId = first.id;
      leadBy = first.wins - second.wins;
    }
    // tie: leaderTeamId stays null, leadBy stays 0
  } else if (first && first.wins > 0) {
    leaderTeamId = first.id;
    leadBy = first.wins;
  }

  return {
    teams,
    leaderTeamId,
    leadBy,
    totalMatches: matchIdsSeen.size,
  };
}
