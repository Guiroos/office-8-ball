import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const teams = [
  {
    id: "frontend",
    name: "frontend",
    displayName: "Frontend",
  },
  {
    id: "backend",
    name: "backend",
    displayName: "Backend",
  },
];

async function main() {
  for (const team of teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: {
        name: team.name,
        displayName: team.displayName,
      },
      create: team,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
