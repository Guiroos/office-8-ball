CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  winner_team_id TEXT NOT NULL REFERENCES teams(id),
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

INSERT INTO teams (id, name, display_name)
VALUES
  ('frontend', 'frontend', 'Frontend'),
  ('backend', 'backend', 'Backend')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name;
