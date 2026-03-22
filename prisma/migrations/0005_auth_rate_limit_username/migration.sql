ALTER TABLE auth_rate_limits RENAME COLUMN email TO username;

DROP INDEX auth_rate_limits_action_email_idx;

CREATE INDEX auth_rate_limits_action_username_idx ON auth_rate_limits (action, username);
