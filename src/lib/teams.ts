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
  type: "solo" | "duo";
  secondMemberUserId?: string;
}): Promise<TeamRecord> {
  const team = await prisma.team.create({
    data: {
      name: input.name.trim().toLowerCase(),
      type: input.type,
      createdBy: input.createdBy,
      members: {
        create: [
          { userId: input.createdBy },
          ...(input.type === "duo" && input.secondMemberUserId
            ? [{ userId: input.secondMemberUserId }]
            : []),
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
