import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/prisma-client";

declare global {
  var __office8ballPrisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  __office8ballPrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const log: Array<"error" | "warn"> =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return new PrismaClient({ log });
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter, log });
}

export const prisma =
  globalForPrisma.__office8ballPrisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__office8ballPrisma = prisma;
}
