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

