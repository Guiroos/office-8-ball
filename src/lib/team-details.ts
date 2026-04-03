import { prisma } from "@/lib/prisma";
import { listAllTeamsWithStats } from "@/lib/ranking";
import { computeHeadToHead, computeTeamStats } from "@/lib/stats";
import { listUserTeams } from "@/lib/teams";
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

export type TeamMatchView = {
  id: string;
  name: string;
  type: "solo" | "duo" | null;
  members: Array<{
    userId: string;
    displayName: string;
  }>;
};

export type TeamDetailMatch = MatchRecord & {
  teamA: TeamMatchView;
  teamB: TeamMatchView;
  winnerTeam: TeamMatchView;
  loserTeam: TeamMatchView;
};

export type TeamDetailData = {
  team: TeamRecord;
  viewerCanManage: boolean;
  rankingPosition: number | null;
  stats: TeamStats;
  recentMatches: TeamDetailMatch[];
  members: TeamMemberView[];
  rivals: { id: string; name: string; type: "solo" | "duo"; memberLabels: string[] }[];
  h2hByRival: Record<string, TeamH2HSummary>;
  primaryRivalId: string | null;
};

export type TeamDetailResult =
  | { kind: "not-found" }
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

function normalizeTeamMatchView(team: {
  id: string;
  name: string;
  type: "solo" | "duo";
  members: Array<{
    userId: string;
    user: {
      username: string;
      displayName: string | null;
    } | null;
  }>;
}): TeamMatchView {
  return {
    id: team.id,
    name: team.name,
    type: team.type,
    members: team.members.map((member) => {
      const username = member.user?.username ?? member.userId;
      return {
        userId: member.userId,
        displayName: member.user?.displayName ?? username,
      };
    }),
  };
}

function buildUnknownTeamMatchView(teamId: string): TeamMatchView {
  return {
    id: teamId,
    name: teamId,
    type: null,
    members: [],
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

  const viewerCanManage = teamRow.members.some((member) => member.userId === viewerId);
  const team = normalizeTeam(teamRow);

  const [ranking, viewerTeams, teamMatchRows] = await Promise.all([
    listAllTeamsWithStats(),
    viewerCanManage ? listUserTeams(viewerId) : Promise.resolve<TeamRecord[]>([]),
    prisma.match.findMany({
      where: {
        OR: [{ teamAId: teamId }, { teamBId: teamId }],
      },
      orderBy: { playedAt: "desc" },
    }),
  ]);

  const rankingPosition = ranking.find((entry) => entry.id === teamId)?.rank ?? null;
  const normalizedRecentMatches = teamMatchRows.map(normalizeMatch);
  const stats = computeTeamStats(teamId, normalizedRecentMatches);

  const memberIds = Array.from(
    new Set([
      ...team.members.map((member) => member.userId),
      ...viewerTeams.flatMap((rival) => rival.members.map((member) => member.userId)),
    ]),
  );
  const users = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, username: true, displayName: true },
  });
  const userById = new Map(users.map((user) => [user.id, user]));
  const getMemberLabel = (userId: string) => {
    const user = userById.get(userId);
    const username = user?.username ?? userId;
    return user?.displayName ?? username;
  };

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

  const recentMatchTeamIds = Array.from(
    new Set(teamMatchRows.flatMap((match) => [match.teamAId, match.teamBId])),
  );
  const recentMatchTeams =
    recentMatchTeamIds.length > 0
      ? await prisma.team.findMany({
          where: { id: { in: recentMatchTeamIds } },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        })
      : [];
  const recentMatchTeamById = new Map(
    recentMatchTeams.map((matchTeam) => [matchTeam.id, normalizeTeamMatchView(matchTeam)]),
  );

  const rivalById = new Map<
    string,
    { id: string; name: string; type: "solo" | "duo"; memberLabels: string[] }
  >();

  for (const rival of viewerTeams) {
    if (rival.id === teamId || rival.status !== "active") continue;

    rivalById.set(rival.id, {
      id: rival.id,
      name: rival.name,
      type: rival.type,
      memberLabels: rival.members.map((member) => getMemberLabel(member.userId)),
    });
  }

  for (const matchTeam of recentMatchTeams) {
    if (matchTeam.id === teamId) continue;

    const matchTeamView = recentMatchTeamById.get(matchTeam.id);
    const recentMemberLabels = matchTeamView
      ? matchTeamView.members.map((member) => member.displayName)
      : [];

    if (!rivalById.has(matchTeam.id)) {
      rivalById.set(matchTeam.id, {
        id: matchTeam.id,
        name: matchTeam.name,
        type: matchTeam.type,
        memberLabels: recentMemberLabels,
      });
      continue;
    }

    const existing = rivalById.get(matchTeam.id);
    if (existing && existing.memberLabels.length === 0 && recentMemberLabels.length > 0) {
      rivalById.set(matchTeam.id, {
        ...existing,
        memberLabels: recentMemberLabels,
      });
    }
  }

  const rivals = Array.from(rivalById.values());
  const rivalIds = rivals.map((rival) => rival.id);

  const recentMatches: TeamDetailMatch[] = normalizedRecentMatches.map((match) => {
    const teamA =
      recentMatchTeamById.get(match.teamAId) ?? buildUnknownTeamMatchView(match.teamAId);
    const teamB =
      recentMatchTeamById.get(match.teamBId) ?? buildUnknownTeamMatchView(match.teamBId);
    const winnerTeam =
      recentMatchTeamById.get(match.winnerTeamId) ??
      (match.winnerTeamId === teamA.id ? teamA : teamB.id === match.winnerTeamId ? teamB : buildUnknownTeamMatchView(match.winnerTeamId));
    const loserTeam =
      recentMatchTeamById.get(match.loserTeamId) ??
      (match.loserTeamId === teamA.id ? teamA : teamB.id === match.loserTeamId ? teamB : buildUnknownTeamMatchView(match.loserTeamId));

    return {
      ...match,
      teamA,
      teamB,
      winnerTeam,
      loserTeam,
    };
  });

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
      viewerCanManage,
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
