import { prisma } from "@/lib/prisma";
import type { TeamRecord } from "@/lib/types";

function normalizeTeam(team: {
  id: string;
  name: string;
  type: 'solo' | 'duo';
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
    members: team.members.map((m) => ({
      userId: m.userId,
      joinedAt: m.joinedAt.toISOString(),
    })),
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
  type: 'solo' | 'duo';
  secondMemberUserId?: string;
}): Promise<TeamRecord> {
  const team = await prisma.team.create({
    data: {
      name: input.name.trim().toLowerCase(),
      type: input.type,
      createdBy: input.createdBy,
      members: {
        create: input.type === 'solo'
          ? [{ userId: input.createdBy }]
          : [
              { userId: input.createdBy },
              { userId: input.secondMemberUserId! },
            ],
      },
    },
    include: { members: true },
  });

  return normalizeTeam(team);
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
    include: { team: { include: { members: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => normalizeTeam(m.team));
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
  const team = await prisma.team.update({
    where: { id: teamId },
    data: { status: "archived" },
    include: { members: true },
  });

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
