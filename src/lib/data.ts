import { prisma } from "@/lib/prisma";
import type { CreateMatchResponse, MatchRecord } from "@/lib/types";

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
