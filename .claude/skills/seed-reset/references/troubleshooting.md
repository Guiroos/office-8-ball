# Seed Reset Troubleshooting

## Connection Errors

**Symptom:** `Can't reach database server` or `ECONNREFUSED`
**Cause:** `DATABASE_URL` not set or pointing to an unreachable host.
**Fix:** Verify `.env.local` contains a valid `DATABASE_URL=postgresql://...`. For Neon, ensure the connection string includes `?sslmode=require`.

## Migration Conflicts

**Symptom:** `Drift detected` or `migration history inconsistency`
**Cause:** Local schema diverged from migration history (e.g., manual DB edits or a failed migration).
**Fix:**
1. Run `npm run prisma:status` to inspect the migration state.
2. If drift is detected, run `npm run prisma:migrate` to resolve, then retry the reset.

## Seed Failures

**Symptom:** `prisma:seed` exits with an error or no records created.
**Common causes:**
- A required field was added to the schema but `prisma/seed.mjs` was not updated.
- Unique constraint violations from a partial previous seed run.

**Fix:**
1. Read `prisma/seed.mjs` to check field completeness against the current schema.
2. If a constraint violation is the cause, re-run the reset (which drops all data) and then re-run the seed.

## Neon Serverless Driver Issues

**Symptom:** Errors mentioning `neon`, `WebSocket`, or `fetch`
**Cause:** The Neon serverless adapter requires a network connection to Neon cloud — it cannot connect to a local PostgreSQL instance.
**Fix:** Use a Neon branch URL in `DATABASE_URL`, or switch to a direct PostgreSQL URL for local development (requires updating `prisma/schema.prisma` adapter config — get explicit user approval first).
