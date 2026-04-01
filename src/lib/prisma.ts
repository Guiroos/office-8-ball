import { PrismaNeonHttp } from "@prisma/adapter-neon";
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

  // PrismaNeonHttp usa fetch() em vez de WebSocket — funciona em workerd
  // (dev via miniflare e produção) sem depender de pool TCP persistente.
  const adapter = new PrismaNeonHttp(databaseUrl, {});

  return new PrismaClient({ adapter, log });
}

export const prisma =
  globalForPrisma.__office8ballPrisma ??
  (globalForPrisma.__office8ballPrisma = createPrismaClient());
