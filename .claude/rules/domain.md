---
paths:
  - "src/lib/**"
  - "src/app/api/**/*.ts"
  - "prisma/**"
---

# Domain

## Invariants

- Only two valid team ids: `frontend` and `backend` — defined in `src/lib/constants.ts`.
- Scoreboard values are always derived from `matches` — never stored as counters.
- `leaderTeamId` is `null` on ties; `leadBy` is the absolute win difference.
- `currentStreak` counts consecutive wins backward from the newest match until a different winner appears.
- `getScoreboard()` fetches **all** match records with no limit. **Why:** Adding a limit silently produces wrong `wins`, `leadBy`, and `currentStreak` — there is no error, just wrong data.
- `listMatches()` defaults to 12 for UI display — this limit is intentional and UI-only.

## Team Behavior Files

When touching anything team-related, review all of:

- `src/lib/constants.ts`
- `src/lib/types.ts`
- `src/lib/data.ts`
- `src/app/api/matches/route.ts`
- `prisma/seed.mjs`
- `prisma/schema.prisma`
