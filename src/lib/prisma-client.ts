import type { PrismaClient as GeneratedPrismaClient } from "@/generated/prisma/client/client";
import { getPrismaClientClass } from "@/generated/prisma/client/internal/class";
import * as PrismaNamespace from "@/generated/prisma/client/internal/prismaNamespace";

const WORKER_PRISMA_DIRNAME = "/";

export const Prisma = PrismaNamespace;
export type Prisma = typeof PrismaNamespace;
export const PrismaClient = getPrismaClientClass(WORKER_PRISMA_DIRNAME);
export type PrismaClient = GeneratedPrismaClient;
