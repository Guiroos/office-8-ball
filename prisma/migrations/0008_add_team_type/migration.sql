-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('solo', 'duo');

-- AlterTable
ALTER TABLE "teams" ADD COLUMN "type" "TeamType" NOT NULL DEFAULT 'duo';
