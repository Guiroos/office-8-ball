# CONCERNS.md — Technical Debt & Risk Areas

## High-Impact Invariants (Must Not Break)

These are not bugs — they are intentional design constraints that are easy to violate accidentally:

### Scoreboard Derivation
- `getScoreboard()` must fetch **all** match records with no limit
- Adding a `take` or `limit` to the Prisma query silently produces wrong `wins`, `leadBy`, and `currentStreak`
- **Risk:** Any performance optimization of the scoreboard query that adds pagination will silently corrupt data

### In-Memory / DB Duality
- Every function in `src/lib/data.ts` and `src/lib/auth.ts` checks `hasDatabaseUrl()` before DB access
- The in-memory path returns empty arrays — it is the local dev and test path
- **Risk:** Adding a new route that skips this guard will work in dev (no error) but fail in prod; or vice versa — break local dev silently

### Team ID Constants
- `TEAMS` in `src/lib/constants.ts` is the authoritative source of team IDs
- The database `teams` table must be seeded to match these constants via `prisma/seed.mjs`
- **Risk:** Adding/changing a team requires updating constants, schema, seed, and UI simultaneously — missing any one causes silent failures in in-memory mode vs DB mode

## Architecture Constraints (Intentional Limits)

| Constraint | Why It's Load-Bearing |
|------------|----------------------|
| No stored scoreboard counters | Counters diverge from match history; derivation is the only correct approach |
| Two teams only | Constants, seed, and UI assume exactly two teams; generalizing breaks all three |
| No separate backend service | Adds operational complexity with no user benefit at this scale |
| In-memory fallback must remain | Test harness and local dev path — breaking it breaks all unit/route tests |

## Active Incomplete Work (In-Progress Features)

### Scoreboard API Disabled (High-Severity)
- `src/app/api/scoreboard/route.ts` always returns 503 with a placeholder message
- **Impact:** Any client consuming `/api/scoreboard` receives an error — the endpoint is non-functional
- **Root cause:** Suspended during dynamic teams refactor; needs reimplementation for dynamic team aggregation
- **File:** `src/app/api/scoreboard/route.ts`

### Dashboard Has Hardcoded Teams (High-Severity)
- `src/components/dashboard/index.tsx` (lines 13–32) defines a local `TEAMS` constant with hardcoded `frontend`/`backend` entries including display names, rosters, and slogans
- A `// TODO(Task 5+): replace with dynamic teams fetched from /api/teams` comment marks this as incomplete
- **Impact:** Dashboard cannot display dynamically created teams from `/api/teams`; UI is disconnected from the dynamic teams API
- **File:** `src/components/dashboard/index.tsx:12`

### Direct Prisma Import in Route Handler
- `src/app/api/matches/route.ts` imports `prisma` directly (line 12) for team status checks
- This bypasses the data layer abstraction in `src/lib/data.ts` / `src/lib/teams.ts`
- **Risk:** Business logic leaks into the route handler; harder to test and maintain
- **File:** `src/app/api/matches/route.ts:12`

## Known Technical Debt

### Rate Limiter Storage (Low-Severity)
- `auth-rate-limit.ts` stores rate limit state in the `auth_rate_limits` DB table
- **Concern:** This table is queried on every login/register attempt; at scale, it's a hot row
- **Mitigation:** Currently not a problem at office scale; if load increases, move to Redis
- **File:** `src/lib/auth-rate-limit.ts`

### Static Teams in Constants (Medium-Severity)
- Teams are hardcoded in `src/lib/constants.ts` as `TEAMS` array
- The dynamic teams feature (`/api/teams`) was added but the old constants-based path still exists
- **Risk:** `isValidTeamId()` in old code may still check against the static constants rather than DB
- **Files:** `src/lib/constants.ts`, `src/app/api/matches/route.ts`

### Placeholder Pages (Low-Severity)
- Several authenticated routes are placeholder pages with no real content:
  - `/ranking` — `src/app/(authenticated)/ranking/page.tsx`
  - `/settings` — `src/app/(authenticated)/settings/page.tsx`
  - `/times` — `src/app/(authenticated)/times/page.tsx`
- These render `<PlaceholderPage>` component with "Em construção" message

### Test Coverage Gaps
- E2E tests (`e2e/`) require a real Postgres instance — not runnable locally without DB
- Some newer API routes (teams, users, profile) have tests but coverage of edge cases may be incomplete
- No visual regression testing

## Security Observations

### Handled
- Password hashing via `bcryptjs` before storage
- Rate limiting on login/register (5 failures → 15-min block, escalating to 60 min)
- Session tokens via Auth.js JWT (not stored in plain form)
- Route protection via `middleware.ts` + `getAuthenticatedUser()` guard in all API handlers
- `NEXTAUTH_SECRET` required in production; app fails safely without it

### Watch Areas
- **NEXTAUTH_URL** not strictly required in dev — could cause CSRF misconfiguration if not set in staging
- **Avatar URL** (`avatarUrl` in profile): stored as-is from user input — no validation that it's a valid image URL or from a trusted domain
- **Bio field**: stored as-is, but rendered in React (XSS-safe by default in JSX)
- **Note field on matches**: max 140 chars via Zod but no content filtering

## Performance Observations

### Scoreboard Query
- `getScoreboard()` fetches all matches ever with no pagination — correct by design
- At very high match volume (10,000+), this becomes a full table scan
- **Mitigation for future:** Add DB indexes on `winner_team_id` and `played_at`; the current schema has indexes on `team_a_id`, `team_b_id`, `winner_team_id`

### No Caching
- Every dashboard load fetches fresh from DB
- No React Query, SWR, or server-side caching
- **Acceptable at current scale**; `use-dashboard-data.ts` hook fetches on mount

## Migration Safety

- Migrations are numbered sequentially (`001_`, `002_`, etc.)
- `prisma migrate deploy` must run before the Vercel build in CI
- **Risk:** Wrong deploy order (Vercel build before migration) causes schema mismatch errors in production
- See `techspec/git-conventions.md` for deploy prerequisites

## Dependencies to Watch

| Dependency | Concern |
|------------|---------|
| `next-auth@4.24.x` | Auth.js v4 is in maintenance mode; v5 migration path exists but is breaking |
| `zod@4.3.x` | Zod v4 has API changes from v3; ensure `z.string()` patterns still work |
| `prisma@6.19.x` | Major version; check migration compatibility before upgrading |
