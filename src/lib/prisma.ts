import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
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

  // Node.js precisa de ws para WebSocket; workerd tem WebSocket nativo.
  if (typeof WebSocket === "undefined") {
    neonConfig.webSocketConstructor = ws;
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl });

  return new PrismaClient({ adapter, log });
}

export const prisma =
  globalForPrisma.__office8ballPrisma ??
  (globalForPrisma.__office8ballPrisma = createPrismaClient());
