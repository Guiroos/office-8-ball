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

  const teamSharks = await prisma.team.upsert({
    where: { name: "UAT Sharks" },
    update: {
      type: "duo",
      status: "active",
      createdBy: users.uat_ana.id,
    },
    create: {
      name: "UAT Sharks",
      type: "duo",
      status: "active",
      createdBy: users.uat_ana.id,
    },
  });

  const teamCobras = await prisma.team.upsert({
    where: { name: "UAT Cobras" },
    update: {
      type: "duo",
      status: "active",
      createdBy: users.uat_beto.id,
    },
    create: {
      name: "UAT Cobras",
      type: "duo",
      status: "active",
      createdBy: users.uat_beto.id,
    },
  });

  const teamEagles = await prisma.team.upsert({
    where: { name: "UAT Eagles" },
    update: {
      type: "solo",
      status: "active",
      createdBy: users.uat_carla.id,
    },
    create: {
      name: "UAT Eagles",
      type: "solo",
      status: "active",
      createdBy: users.uat_carla.id,
    },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamSharks.id, userId: users.uat_ana.id } },
    update: {},
    create: { teamId: teamSharks.id, userId: users.uat_ana.id },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamSharks.id, userId: users.uat_beto.id } },
    update: {},
    create: { teamId: teamSharks.id, userId: users.uat_beto.id },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamCobras.id, userId: users.uat_beto.id } },
    update: {},
    create: { teamId: teamCobras.id, userId: users.uat_beto.id },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamCobras.id, userId: users.uat_carla.id } },
    update: {},
    create: { teamId: teamCobras.id, userId: users.uat_carla.id },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: teamEagles.id, userId: users.uat_carla.id } },
    update: {},
    create: { teamId: teamEagles.id, userId: users.uat_carla.id },
  });

  await prisma.match.deleteMany({
    where: { note: { startsWith: SEED_NOTE_PREFIX } },
  });

  await prisma.match.createMany({
    data: [
      {
        teamAId: teamSharks.id,
        teamBId: teamCobras.id,
        winnerTeamId: teamSharks.id,
        playedAt: new Date("2026-03-20T19:00:00.000Z"),
        note: `${SEED_NOTE_PREFIX} Sharks vs Cobras 1`,
      },
      {
        teamAId: teamSharks.id,
        teamBId: teamCobras.id,
        winnerTeamId: teamCobras.id,
        playedAt: new Date("2026-03-21T19:00:00.000Z"),
        note: `${SEED_NOTE_PREFIX} Sharks vs Cobras 2`,
      },
      {
        teamAId: teamSharks.id,
        teamBId: teamEagles.id,
        winnerTeamId: teamSharks.id,
        playedAt: new Date("2026-03-22T19:00:00.000Z"),
        note: `${SEED_NOTE_PREFIX} Sharks vs Eagles`,
      },
      {
        teamAId: teamCobras.id,
        teamBId: teamEagles.id,
        winnerTeamId: teamEagles.id,
        playedAt: new Date("2026-03-23T19:00:00.000Z"),
        note: `${SEED_NOTE_PREFIX} Cobras vs Eagles`,
      },
    ],
  });

  console.log("Seed UAT ready:");
  console.log("- users: uat_ana, uat_beto, uat_carla");
  console.log("- password: 123456");
  console.log("- teams: UAT Sharks, UAT Cobras, UAT Eagles");
  console.log("- matches: 4 seeded matches with [seed-uat] marker");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
