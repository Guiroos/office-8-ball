---
phase: 02-scoreboard-reactivation-match-recording
plan: 01
subsystem: api
tags: [scoreboard, prisma, vitest, tdd, match-history]

# Dependency graph
requires:
  - phase: 01-dynamic-team-management
    provides: TeamMember and Match models in Prisma schema; getAuthenticatedUser + hasDatabaseUrl guards in auth.ts
provides:
  - getScoreboard() exported from src/lib/data.ts — computes wins/losses/leaderTeamId/leadBy/totalMatches from match history
  - ScoreboardTeamEntry, ScoreboardData, ScoreboardResponse types exported from src/lib/types.ts
  - GET /api/scoreboard reactivated — returns 200 with scoreboard, 401 when unauthenticated, 503 without DATABASE_URL
affects:
  - 02-02 (match recording connected to dynamic teams)
  - 03 (stats computation module extending scoreboard with streaks)
  - 04 (ranking page consuming GET /api/scoreboard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Two-step Prisma query: teamMember.findMany → match.findMany with OR clause, no take() limit
    - ScoreboardData computed on-demand from raw match rows — no persisted counters
    - TDD cycle: RED (failing tests) → GREEN (implementation) → each committed separately

key-files:
  created: []
  modified:
    - src/lib/types.ts
    - src/lib/data.ts
    - src/app/api/scoreboard/route.ts
    - src/app/api/scoreboard/route.test.ts
    - src/lib/data.test.ts

key-decisions:
  - "getScoreboard() returns ScoreboardData (not wrapped) — route wraps it in { scoreboard: ... } for API shape"
  - "No take() in match query enforced via test — prevents silent scoreboard corruption at scale"
  - "leaderTeamId is null on exact tie — not the higher-ID team or any tiebreaker"
  - "totalMatches uses Set<string> on match IDs — each match counted once even if both teams belong to user"

patterns-established:
  - "getScoreboard pattern: hasDatabaseUrl guard → membership query → match query (no limit) → derive stats"
  - "Route pattern: hasDatabaseUrl first, then getAuthenticatedUser, then domain call"

requirements-completed: [DASH-02]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 02 Plan 01: Scoreboard API Reactivation Summary

**getScoreboard() implemented with no-limit Prisma query returning wins/losses/leaderTeamId/leadBy per team; GET /api/scoreboard reactivated with full auth guards and 13 passing tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T01:17:59Z
- **Completed:** 2026-03-25T01:21:50Z
- **Tasks:** 2 (TDD: RED commit + GREEN commit)
- **Files modified:** 5

## Accomplishments

- Added ScoreboardTeamEntry, ScoreboardData, ScoreboardResponse to types.ts
- Implemented getScoreboard() in data.ts following the listMatches two-step query pattern with no take() limit
- Rewrote GET /api/scoreboard from 503 stub to fully functional handler with hasDatabaseUrl + auth guards
- 13 new tests: 5 unit tests for getScoreboard (including no-take() enforcement), 4 route tests

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD RED — types + failing tests** - `83ddd7e` (test)
2. **Task 2: TDD GREEN — implementation + route + route tests** - `f9e0698` (feat)

## Files Created/Modified

- `src/lib/types.ts` - Added ScoreboardTeamEntry, ScoreboardData, ScoreboardResponse types
- `src/lib/data.ts` - Added getScoreboard() function; updated import for new types
- `src/app/api/scoreboard/route.ts` - Replaced 503 stub with real handler (hasDatabaseUrl + auth + getScoreboard)
- `src/app/api/scoreboard/route.test.ts` - Replaced placeholder test with full coverage (200, 401, 503, empty)
- `src/lib/data.test.ts` - Added 5 tests for getScoreboard (no-DB guard, no memberships, wins/losses, tie, no-take)

## Decisions Made

- getScoreboard() returns the raw ScoreboardData shape; the route wraps it in `{ scoreboard }` — keeps data layer clean.
- No take() enforced by a test that inspects the mock call args — cannot be accidentally added later without breaking a test.
- leaderTeamId is strictly null on tie (no tiebreakers) — matches the plan's truth.
- Set-based totalMatches deduplication prevents double-counting when a user belongs to both teams in a match.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- GET /api/scoreboard is fully functional and tested — ready for Phase 02-02 (match recording with dynamic teams) and Phase 04 (ranking page).
- ScoreboardResponse type is exported and ready for client-side use in useDashboardData hook.
- No blockers.

## Self-Check: PASSED

- FOUND: 02-01-SUMMARY.md
- FOUND: src/lib/types.ts
- FOUND: src/lib/data.ts
- FOUND: src/app/api/scoreboard/route.ts
- FOUND: commit 83ddd7e (test: failing tests RED)
- FOUND: commit f9e0698 (feat: implementation GREEN)
- All 180 tests pass, TypeScript clean

---
*Phase: 02-scoreboard-reactivation-match-recording*
*Completed: 2026-03-25*
