# Domain

## Invariants

- Only two valid team ids: `frontend` and `backend`
- Team definitions are hard-coded in `src/lib/constants.ts`
- Scoreboard values are always derived from `matches` — never stored as counters
- `leaderTeamId` is `null` on ties
- `leadBy` is the absolute win difference
- `currentStreak` counts consecutive wins backward from the newest match until a different winner appears
- `getScoreboard()` fetches **all** match records with no limit; `listMatches()` defaults to 12 for UI display. Adding a limit to `getScoreboard()` silently produces wrong `wins`, `leadBy`, and `currentStreak` values.

## Team Behavior Files

When touching team behavior, review all of:

- `src/lib/constants.ts`
- `src/lib/types.ts`
- `src/lib/data.ts`
- `src/app/api/matches/route.ts`
- `prisma/seed.mjs`
- `prisma/schema.prisma`

## Working Rules

**Prefer small, concrete changes.** Avoid unless explicitly requested: multi-team abstractions, admin concepts, caching layers, client state libraries, stored aggregate counters.

**Match the existing UX intent.**
- Scoreboard UX should stay fast and obvious
- Copy should stay short, readable, and playful
- Auth UX: credentials only, no fake providers
- Keep the green billiards-table visual direction unless the task explicitly changes it
- `/dashboard` remains the main authenticated entry; `/scoreboard` remains a legacy redirect

**Be precise about persistence.** When changing `src/lib/data.ts`, verify behavior both with and without `DATABASE_URL`. Do not assume the database is the source of team truth — teams are mirrored in code and seeded into the DB.

**Keep docs honest.** If your change alters real behavior, update:
- `.claude/rules/` files — for agent workflow, domain, or architecture changes
- `techspec/` — for technical decisions or architecture changes
- `README.md` — for setup or runtime usage changes

Prefer short corrections over broad doc rewrites.

## Runtime Behavior

- `DATABASE_URL` absent → in-memory fallback for matches only; auth is unavailable; dashboard stays protected
- `DATABASE_URL` present, `NEXTAUTH_SECRET` absent → invalid configuration; do not treat as degraded mode
- Do not change API status codes (401, 409, 429, 500, 503) without also updating client-side error handling

See `techspec/runtime-environments.md` for the full environment matrix and `techspec/api-contracts.md` for payload details.
