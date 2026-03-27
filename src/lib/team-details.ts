import { prisma } from "@/lib/prisma";
import { listAllTeamsWithStats } from "@/lib/ranking";
import { computeHeadToHead, computeTeamStats } from "@/lib/stats";
import { isTeamMember, listUserTeams } from "@/lib/teams";
import type { MatchRecord, TeamRecord } from "@/lib/types";
import type { TeamStats } from "@/lib/stats";

export type TeamH2HSummary = {
  rivalTeamId: string;
  rivalTeamName: string;
  teamAWins: number;
  teamBWins: number;
  totalMatches: number;
  winRate: number;
  lastMatchDate: string | null;
};

export type TeamMemberView = {
  userId: string;
  displayName: string;
  username: string;
  role: "Criador" | "Membro";
};

export type TeamDetailData = {
  team: TeamRecord;
  rankingPosition: number | null;
  stats: TeamStats;
  recentMatches: MatchRecord[];
  members: TeamMemberView[];
  rivals: { id: string; name: string; type: "solo" | "duo" }[];
  h2hByRival: Record<string, TeamH2HSummary>;
  primaryRivalId: string | null;
};

export type TeamDetailResult =
  | { kind: "not-found" }
  | { kind: "forbidden"; teamId: string }
  | { kind: "detail"; data: TeamDetailData };

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

export async function getTeamDetailData(
  teamId: string,
  viewerId: string,
): Promise<TeamDetailResult> {
  const teamRow = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!teamRow || teamRow.status !== "active") {
    return { kind: "not-found" };
  }

  // Membership gate: runs before any heavy queries — prevents data leakage to non-members
  const isMember = await isTeamMember(teamId, viewerId);
  if (!isMember) {
    return { kind: "forbidden", teamId };
  }

  const team = normalizeTeam(teamRow);

  const [ranking, viewerTeams, teamMatchRows] = await Promise.all([
    listAllTeamsWithStats(),
    listUserTeams(viewerId),
    prisma.match.findMany({
      where: {
        OR: [{ teamAId: teamId }, { teamBId: teamId }],
      },
      orderBy: { playedAt: "desc" },
    }),
  ]);

  const rankingPosition = ranking.find((entry) => entry.id === teamId)?.rank ?? null;
  const recentMatches = teamMatchRows.map(normalizeMatch);
  const stats = computeTeamStats(teamId, recentMatches);

  const memberIds = team.members.map((member) => member.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, username: true, displayName: true },
  });
  const userById = new Map(users.map((user) => [user.id, user]));

  const members: TeamMemberView[] = team.members.map((member) => {
    const user = userById.get(member.userId);
    const username = user?.username ?? member.userId;
    return {
      userId: member.userId,
      username,
      displayName: user?.displayName ?? username,
      role: member.userId === team.createdBy ? "Criador" : "Membro",
    };
  });

  const rivals = viewerTeams
    .filter((rival) => rival.id !== teamId && rival.status === "active")
    .map((rival) => ({ id: rival.id, name: rival.name, type: rival.type }));

  const rivalIds = rivals.map((rival) => rival.id);
  const h2hMatchRows =
    rivalIds.length > 0
      ? await prisma.match.findMany({
          where: {
            OR: [
              { teamAId: teamId, teamBId: { in: rivalIds } },
              { teamBId: teamId, teamAId: { in: rivalIds } },
            ],
          },
          orderBy: { playedAt: "desc" },
        })
      : [];

  const h2hMatches = h2hMatchRows.map(normalizeMatch);
  const matchById = new Map(h2hMatches.map((match) => [match.id, match]));

  // per D-09/D-10
  const h2hByRival = Object.fromEntries(
    rivals.map((rival) => {
      const h2h = computeHeadToHead(teamId, rival.id, h2hMatches);
      const lastMatchId = h2h.recentMatchIds[0] ?? null;
      const lastMatchDate = lastMatchId ? matchById.get(lastMatchId)?.playedAt ?? null : null;
      const winRate = h2h.totalMatches === 0 ? 0 : (h2h.teamAWins / h2h.totalMatches) * 100;

      return [
        rival.id,
        {
          rivalTeamId: rival.id,
          rivalTeamName: rival.name,
          teamAWins: h2h.teamAWins,
          teamBWins: h2h.teamBWins,
          totalMatches: h2h.totalMatches,
          winRate,
          lastMatchDate,
        } satisfies TeamH2HSummary,
      ];
    }),
  );

  let primaryRivalId: string | null = null;
  if (rivals.length > 0) {
    primaryRivalId = rivals[0].id;
    let maxMatches = h2hByRival[primaryRivalId]?.totalMatches ?? 0;

    for (const rival of rivals) {
      const totalMatches = h2hByRival[rival.id]?.totalMatches ?? 0;
      if (totalMatches > maxMatches) {
        maxMatches = totalMatches;
        primaryRivalId = rival.id;
      }
    }
  }

  return {
    kind: "detail",
    data: {
      team,
      rankingPosition,
      stats,
      recentMatches,
      members,
      rivals,
      h2hByRival,
      primaryRivalId,
    },
  };
}
