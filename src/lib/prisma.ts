import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
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

  const pool = new Pool({
    connectionString: databaseUrl,
    allowExitOnIdle: true,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
    max: 5,
  });

  const adapter = new PrismaPg(pool, {
    onConnectionError: (error) => {
      console.error("Prisma PG connection error", error);
    },
    onPoolError: (error) => {
      console.error("Prisma PG pool error", error);
    },
  });

  return new PrismaClient({ adapter, log });
}

export const prisma =
  globalForPrisma.__office8ballPrisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__office8ballPrisma = prisma;
}
