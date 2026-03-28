---
paths:
  - "src/lib/**"
  - "src/app/api/**/*.ts"
  - "prisma/**"
---

# Domain

## Invariants

- Teams are fully dynamic and user-created. `src/lib/constants.ts` is intentionally empty — there are no hardcoded team IDs.
- Scoreboard values are always derived from `matches` — never stored as counters.
- `leaderTeamId` is `null` on ties; `leadBy` is the absolute win difference.
- `currentStreak` counts consecutive wins backward from the newest match until a different winner appears.
- `getScoreboard()` fetches **all** match records with no limit. **Why:** Adding a limit silently produces wrong `wins`, `leadBy`, and `currentStreak` — there is no error, just wrong data.
- `listMatches()` defaults to 12 for UI display — this limit is intentional and UI-only.

## Team Behavior Files

When touching anything team-related, review all of:

- `src/lib/teams.ts` — team CRUD domain layer (createTeam, listUserTeams, getTeamById)
- `src/lib/team-details.ts` — team detail assembly (getTeamDetailData, discriminated union result)
- `src/lib/types.ts`
- `src/lib/data.ts`
- `src/app/api/teams/route.ts`
- `src/app/api/teams/[id]/route.ts`
- `src/app/api/matches/route.ts`
- `prisma/seed.mjs`
- `prisma/schema.prisma`

## Stats Computation

- Stats functions (`computeStats`, `buildRanking`, `resolveHeadToHeadData`, `computeProfilePageData`) are pure — they receive match and team arrays as arguments and never call Prisma directly. This makes them fully testable without DB mocks.
- Stats types are defined via `z.infer` in `stats.ts` and re-exported from `types.ts`; import from `@/lib/types` in consumers.

## Domain Function Results

- Domain assemblers that can fail for multiple reasons return a discriminated union, not null. Example: `getTeamDetailData()` returns `{ kind: 'not-found' | 'forbidden' | 'detail', ... }`. Pages must branch on `.kind`; `not-found` calls `notFound()`, `forbidden` renders an access-denied component instead.
- Using null for multiple failure states is not acceptable — it collapses distinct error cases into one, breaking the ability to render the correct UI.
