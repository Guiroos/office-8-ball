-- Dynamic teams migration
-- Truncate incompatible data before schema changes (dev environment only)
TRUNCATE TABLE "matches" CASCADE;
TRUNCATE TABLE "teams" CASCADE;

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('active', 'archived');

-- AlterTable: matches — add team_a_id and team_b_id
ALTER TABLE "matches" ADD COLUMN "team_a_id" TEXT NOT NULL DEFAULT '',
ADD COLUMN "team_b_id" TEXT NOT NULL DEFAULT '';

-- Remove the temporary defaults (columns are now NOT NULL without default after data is clean)
ALTER TABLE "matches" ALTER COLUMN "team_a_id" DROP DEFAULT;
ALTER TABLE "matches" ALTER COLUMN "team_b_id" DROP DEFAULT;

-- AlterTable: teams — drop display_name, add new columns
ALTER TABLE "teams" DROP COLUMN "display_name",
ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "created_by" TEXT NOT NULL DEFAULT '',
ADD COLUMN "status" "TeamStatus" NOT NULL DEFAULT 'active',
ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Remove temporary default for created_by
ALTER TABLE "teams" ALTER COLUMN "created_by" DROP DEFAULT;
ALTER TABLE "teams" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable: team_members
CREATE TABLE "team_members" (
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id","user_id")
);

-- CreateIndex
CREATE INDEX "team_members_team_id_idx" ON "team_members"("team_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- CreateIndex
CREATE INDEX "matches_team_a_id_idx" ON "matches"("team_a_id");

-- CreateIndex
CREATE INDEX "matches_team_b_id_idx" ON "matches"("team_b_id");

-- AddForeignKey: teams.created_by -> users.id
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: team_members.team_id -> teams.id
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: team_members.user_id -> users.id
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: matches.team_a_id -> teams.id
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_a_id_fkey" FOREIGN KEY ("team_a_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: matches.team_b_id -> teams.id
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_b_id_fkey" FOREIGN KEY ("team_b_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECK constraints
ALTER TABLE "matches" ADD CONSTRAINT "matches_teams_different" CHECK (team_a_id <> team_b_id);
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_is_participant" CHECK (winner_team_id IN (team_a_id, team_b_id));
