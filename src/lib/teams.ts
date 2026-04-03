import { prisma } from "@/lib/prisma";
import { computeTeamStats } from "@/lib/stats";
import type { MatchRecord, TeamRecord } from "@/lib/types";

export type TeamPartnerRecord = {
  userId: string;
  username: string;
  displayName: string;
};

export type UserTeamOverview = TeamRecord & {
  partners: TeamPartnerRecord[];
  summary: {
    wins: number;
    losses: number;
    winRate: number;
    totalMatches: number;
    lastFiveResults: Array<"win" | "loss">;
    lastPlayedAt: string | null;
  };
};

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

function normalizeTeam(team: {
  id: string;
  name: string;
  type: 'solo' | 'duo';
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    userId: string;
    joinedAt: Date;
    user?: {
      username: string;
      displayName: string | null;
    } | null;
  }>;
}): TeamRecord {
  const memberNames = team.members.flatMap((member) => {
    if (!member.user) return [];
    return [member.user.displayName ?? member.user.username];
  });

  return {
    id: team.id,
    name: team.name,
    type: team.type,
    status: team.status as "active" | "archived",
    createdBy: team.createdBy,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    members: team.members.map((m) => ({
      userId: m.userId,
      joinedAt: m.joinedAt.toISOString(),
    })),
    ...(memberNames.length > 0 ? { memberNames } : {}),
  };
}

export async function isTeamMember(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return Boolean(member);
}

export async function createTeam(input: {
  name: string;
  createdBy: string;
  type: "solo" | "duo";
  secondMemberUserId?: string;
}): Promise<TeamRecord> {
  const team = await prisma.team.create({
    data: {
      name: input.name.trim().toLowerCase(),
      type: input.type,
      createdBy: input.createdBy,
    },
  });

  try {
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: input.createdBy,
      },
    });

    if (input.type === "duo" && input.secondMemberUserId) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: input.secondMemberUserId,
        },
      });
    }
  } catch (error) {
    await prisma.teamMember
      .deleteMany({ where: { teamId: team.id } })
      .catch(() => undefined);
    await prisma.team.delete({ where: { id: team.id } }).catch(() => undefined);
    throw error;
  }

  const teamWithMembers = await prisma.team.findUnique({
    where: { id: team.id },
    include: { members: true },
  });

  if (!teamWithMembers) {
    throw new Error("Time não encontrado após criação.");
  }

  return normalizeTeam(teamWithMembers);
}

export async function listUserTeams(
  userId: string,
  includeArchived = false,
): Promise<TeamRecord[]> {
  const memberships = await prisma.teamMember.findMany({
    where: {
      userId,
      ...(includeArchived ? {} : { team: { status: "active" } }),
    },
    include: {
      team: {
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
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => normalizeTeam(m.team));
}

export async function listActiveTeams(): Promise<TeamRecord[]> {
  const teams = await prisma.team.findMany({
    where: { status: "active" },
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
    orderBy: { createdAt: "asc" },
  });

  return teams.map(normalizeTeam);
}

export async function listUserTeamsWithPartners(
  userId: string,
  includeArchived = false,
): Promise<UserTeamOverview[]> {
  const memberships = await prisma.teamMember.findMany({
    where: {
      userId,
      ...(includeArchived ? {} : { team: { status: "active" } }),
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const teams = memberships.map(({ team }) => team);
  if (teams.length === 0) return [];

  const teamIds = teams.map((team) => team.id);
  const matchRows = await prisma.match.findMany({
    where: {
      OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }],
    },
    orderBy: { playedAt: "desc" },
  });
  const matches = matchRows.map(normalizeMatch);

  return teams.map((team) => {
    const summary = computeTeamStats(team.id, matches);
    const lastPlayedAt =
      matches.find((match) => match.teamAId === team.id || match.teamBId === team.id)?.playedAt ?? null;

    return {
      ...normalizeTeam(team),
      partners: team.members
        .filter((member) => member.userId !== userId)
        .map((member) => {
          const username = member.user?.username ?? member.userId;

          return {
            userId: member.userId,
            username,
            displayName: member.user?.displayName ?? username,
          };
        }),
      summary: {
        wins: summary.wins,
        losses: summary.losses,
        winRate: summary.winRate,
        totalMatches: summary.totalMatches,
        lastFiveResults: summary.lastFiveResults,
        lastPlayedAt,
      },
    };
  });
}

export async function getTeamById(teamId: string): Promise<TeamRecord | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) return null;

  return normalizeTeam(team);
}

export async function archiveTeam(teamId: string): Promise<TeamRecord> {
  await prisma.team.update({
    where: { id: teamId },
    data: { status: "archived" },
  });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    throw new Error("Time não encontrado após arquivamento.");
  }

  return normalizeTeam(team);
}

export async function findUserByUsername(
  username: string,
): Promise<{ id: string; username: string; displayName: string | null; avatarUrl: string | null } | null> {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  });
}

export async function findUserById(
  userId: string,
): Promise<{ id: string } | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
}

export async function addTeamMember(
  teamId: string,
  userId: string,
): Promise<TeamRecord> {
  // Check if user is already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (existingMember) {
    throw new Error("Usuário já é membro deste time.");
  }

  // Add user as team member
  await prisma.teamMember.create({
    data: { teamId, userId },
  });

  // Return updated team
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) throw new Error("Time não encontrado.");
  return normalizeTeam(team);
}

export async function removeTeamMember(
  teamId: string,
  userIdToRemove: string,
): Promise<TeamRecord> {
  // Get team to check type and member count
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) throw new Error("Time não encontrado.");

  // Prevent removing creator
  if (team.createdBy === userIdToRemove) {
    throw new Error("Não é possível remover o criador do time.");
  }

  // Check minimum member count based on type
  const memberCount = team.members.length;
  const minMembers = team.type === "solo" ? 1 : 2;

  if (memberCount <= minMembers) {
    throw new Error(
      team.type === "solo"
        ? "Solo team precisa ter pelo menos 1 membro."
        : "Time duo precisa ter pelo menos 2 membros.",
    );
  }

  // Remove user from team
  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId: userIdToRemove } },
  });

  // Return updated team
  const updatedTeam = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!updatedTeam) throw new Error("Time não encontrado após remoção.");
  return normalizeTeam(updatedTeam);
}
