CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  email TEXT NOT NULL,
  ip TEXT NOT NULL,
  fail_count INTEGER NOT NULL DEFAULT 0,
  block_level INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL,
  blocked_until TIMESTAMPTZ,
  last_failed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_rate_limits_action_email_idx
  ON auth_rate_limits (action, email);
