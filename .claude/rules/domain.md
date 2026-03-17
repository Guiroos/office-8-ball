# Domain

## Invariants

- Only two valid team ids: `frontend` and `backend`
- Team definitions are hard-coded in `src/lib/constants.ts`
- Scoreboard values are always derived from `matches` — never stored as counters
- `leaderTeamId` is `null` on ties
- `leadBy` is the absolute win difference
- `currentStreak` is based on newest consecutive wins by the latest winner

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

### Persistence Modes

- With `DATABASE_URL`: Prisma + Postgres
- Without `DATABASE_URL`: in-memory fallback (local dev only)

Important:
- In-memory data disappears on server restart
- Login/signup require `DATABASE_URL` (users persist only in Postgres)
- Rate limiting also persists only when `DATABASE_URL` is available
- If `DATABASE_URL` exists without `NEXTAUTH_SECRET`, treat as invalid configuration

### Match Creation

`POST /api/matches` accepts `winnerTeamId` (required) and `note` (optional, max 140 chars).

Validation:
- `winnerTeamId` must be `frontend` or `backend`
- `note` is trimmed; empty values normalized to `null`

### UI Data Flow

- Scoreboard UI fetches `/api/scoreboard` and `/api/matches`
- After registering a win, UI re-fetches both endpoints
- No optimistic scoreboard updates before persistence succeeds
- With `DATABASE_URL`, middleware protects the authenticated area; page/API layers also validate session
- Login screen handles both `entrar` and `criar conta`; validates on blur or submit; remote field errors returned on conflict
- Repeated auth failures trigger progressive blocks keyed by `email + IP`
