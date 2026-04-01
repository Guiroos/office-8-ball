import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const SEED_NOTE_PREFIX = "[seed-uat]";
const SEED_PASSWORD = "123456";

const seedUsers = [
  { username: "uat_ana", displayName: "UAT Ana" },
  { username: "uat_beto", displayName: "UAT Beto" },
  { username: "uat_carla", displayName: "UAT Carla" },
];

const seedTeams = [
  {
    key: "sharks",
    name: "UAT Sharks",
    type: "duo",
    createdBy: "uat_ana",
    members: ["uat_ana", "uat_beto"],
  },
  {
    key: "cobras",
    name: "UAT Cobras",
    type: "duo",
    createdBy: "uat_beto",
    members: ["uat_beto", "uat_carla"],
  },
  {
    key: "falcons",
    name: "UAT Falcons",
    type: "duo",
    createdBy: "uat_carla",
    members: ["uat_carla", "uat_ana"],
  },
  {
    key: "eagles",
    name: "UAT Eagles",
    type: "solo",
    createdBy: "uat_ana",
    members: ["uat_ana"],
  },
  {
    key: "wolves",
    name: "UAT Wolves",
    type: "solo",
    createdBy: "uat_beto",
    members: ["uat_beto"],
  },
  {
    key: "tigers",
    name: "UAT Tigers",
    type: "solo",
    createdBy: "uat_carla",
    members: ["uat_carla"],
  },
];

const seedMatches = [
  {
    teamA: "sharks",
    teamB: "cobras",
    winner: "sharks",
    playedAt: "2026-03-20T19:00:00.000Z",
    note: `${SEED_NOTE_PREFIX} Sharks vs Cobras 1`,
  },
  {
    teamA: "sharks",
    teamB: "falcons",
    winner: "falcons",
    playedAt: "2026-03-21T19:00:00.000Z",
    note: `${SEED_NOTE_PREFIX} Sharks vs Falcons`,
  },
  {
    teamA: "cobras",
    teamB: "falcons",
    winner: "cobras",
    playedAt: "2026-03-22T19:00:00.000Z",
    note: `${SEED_NOTE_PREFIX} Cobras vs Falcons`,
  },
  {
    teamA: "eagles",
    teamB: "wolves",
    winner: "eagles",
    playedAt: "2026-03-23T19:00:00.000Z",
    note: `${SEED_NOTE_PREFIX} Eagles vs Wolves`,
  },
  {
    teamA: "wolves",
    teamB: "tigers",
    winner: "tigers",
    playedAt: "2026-03-24T19:00:00.000Z",
    note: `${SEED_NOTE_PREFIX} Wolves vs Tigers`,
  },
  {
    teamA: "eagles",
    teamB: "tigers",
    winner: "tigers",
    playedAt: "2026-03-25T19:00:00.000Z",
    note: `${SEED_NOTE_PREFIX} Eagles vs Tigers`,
  },
  {
    teamA: "sharks",
    teamB: "eagles",
    winner: "sharks",
    playedAt: "2026-03-26T19:00:00.000Z",
    note: `${SEED_NOTE_PREFIX} Sharks vs Eagles`,
  },
  {
    teamA: "cobras",
    teamB: "wolves",
    winner: "cobras",
    playedAt: "2026-03-27T19:00:00.000Z",
    note: `${SEED_NOTE_PREFIX} Cobras vs Wolves`,
  },
];

async function syncTeamMembers(teamId, userIds) {
  await prisma.teamMember.deleteMany({
    where: {
      teamId,
      userId: { notIn: userIds },
    },
  });

  for (const userId of userIds) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      update: {},
      create: { teamId, userId },
    });
  }
}

async function main() {
  const passwordHash = await hash(SEED_PASSWORD, 12);

  const users = {};
  for (const seedUser of seedUsers) {
    const user = await prisma.user.upsert({
      where: { username: seedUser.username },
      update: {
        displayName: seedUser.displayName,
      },
      create: {
        username: seedUser.username,
        displayName: seedUser.displayName,
        passwordHash,
      },
    });

    users[seedUser.username] = user;
  }

  const teamsByKey = {};
  for (const seedTeam of seedTeams) {
    const team = await prisma.team.upsert({
      where: { name: seedTeam.name },
      update: {
        type: seedTeam.type,
        status: "active",
        createdBy: users[seedTeam.createdBy].id,
      },
      create: {
        name: seedTeam.name,
        type: seedTeam.type,
        status: "active",
        createdBy: users[seedTeam.createdBy].id,
      },
    });

    teamsByKey[seedTeam.key] = team;

    const memberIds = seedTeam.members.map((username) => users[username].id);
    await syncTeamMembers(team.id, memberIds);
  }

  await prisma.match.deleteMany({
    where: { note: { startsWith: SEED_NOTE_PREFIX } },
  });

  await prisma.match.createMany({
    data: seedMatches.map((seedMatch) => ({
      teamAId: teamsByKey[seedMatch.teamA].id,
      teamBId: teamsByKey[seedMatch.teamB].id,
      winnerTeamId: teamsByKey[seedMatch.winner].id,
      playedAt: new Date(seedMatch.playedAt),
      note: seedMatch.note,
    })),
  });

  console.log("Seed UAT ready:");
  console.log("- users: uat_ana, uat_beto, uat_carla");
  console.log("- password: 123456");
  console.log("- teams (duo): UAT Sharks, UAT Cobras, UAT Falcons");
  console.log("- teams (solo): UAT Eagles, UAT Wolves, UAT Tigers");
  console.log("- memberships synced: each UAT user has 3 active teams");
  console.log("- matches: 8 seeded matches with [seed-uat] marker");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
