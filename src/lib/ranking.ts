import { prisma } from "@/lib/prisma";
import { computeTeamStats } from "@/lib/stats";
import { resolvePeriodWindow } from "@/lib/time-period";
import type { MatchRecord, RankingPeriod, TeamRecord } from "@/lib/types";
import type { TeamStats } from "@/lib/stats";

export type RankedTeam = TeamRecord & TeamStats & { rank: number };

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function normalizeTeam(team: {
  id: string;
  name: string;
  type: "solo" | "duo";
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: { userId: string; joinedAt: Date }[];
}): TeamRecord {
  return {
    id: team.id,
    name: team.name,
    type: team.type,
    status: team.status as "active" | "archived",
    createdBy: team.createdBy,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    members: team.members.map((member) => ({
      userId: member.userId,
      joinedAt: member.joinedAt.toISOString(),
    })),
  };
}

function normalizeMatch(match: {
  id: string;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string;
  playedAt: Date;
  note: string | null;
}): MatchRecord {
  return {
    id: match.id,
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    winnerTeamId: match.winnerTeamId,
    loserTeamId:
      match.teamAId === match.winnerTeamId ? match.teamBId : match.teamAId,
    playedAt: match.playedAt.toISOString(),
    note: match.note,
  };
}

export async function listAllTeamsWithStats(
  type?: "solo" | "duo",
  period?: RankingPeriod,
): Promise<RankedTeam[]> {
  if (!hasDatabaseUrl()) return [];

  const teamRows = await prisma.team.findMany({
    where: { status: "active", ...(type ? { type } : {}) },
    include: { members: true },
  });

  const teams = teamRows.map(normalizeTeam);
  if (teams.length === 0) return [];

  const teamIds = teams.map((team) => team.id);

  const resolvedPeriod = period ?? "all";
  const { startUtc, endUtc } = resolvePeriodWindow(resolvedPeriod);
  const playedAtFilter =
    startUtc !== null && endUtc !== null
      ? { playedAt: { gte: startUtc, lt: endUtc } }
      : {};

  const matchRows = await prisma.match.findMany({
    where: {
      OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }],
      ...playedAtFilter,
    },
    orderBy: { playedAt: "desc" },
  });

  const allMatches = matchRows.map(normalizeMatch);

  const ranked = teams.map((team) => ({
    ...team,
    ...computeTeamStats(team.id, allMatches),
    rank: 0,
  }));

  ranked.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.winRate - a.winRate ||
      a.name.localeCompare(b.name, "pt-BR"),
  );

  return ranked.map((team, index) => ({ ...team, rank: index + 1 }));
}
