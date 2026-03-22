-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_winner_team_id_fkey";

-- AlterTable
ALTER TABLE "auth_rate_limits" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "bio" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_fkey" FOREIGN KEY ("winner_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
