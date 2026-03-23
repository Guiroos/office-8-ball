-- Add missing foreign key for winner_team_id (idempotent: skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'matches_winner_team_id_fkey'
      AND table_name = 'matches'
  ) THEN
    ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_fkey"
      FOREIGN KEY ("winner_team_id") REFERENCES "teams"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Add missing index for winner_team_id
CREATE INDEX IF NOT EXISTS "matches_winner_team_id_idx" ON "matches"("winner_team_id");
