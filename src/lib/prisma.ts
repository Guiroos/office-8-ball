import { PrismaClient } from "@prisma/client";

declare global {
  var __office8ballPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__office8ballPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__office8ballPrisma = prisma;
}
