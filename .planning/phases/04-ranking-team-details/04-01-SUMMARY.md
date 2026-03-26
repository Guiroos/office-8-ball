---
phase: 04-ranking-team-details
plan: 01
subsystem: api
tags: [ranking, stats, cache, prisma, vitest]
requires:
  - phase: 03-stats-computation-module
    provides: computeTeamStats and stable stats schemas
provides:
  - Ranking domain function with deterministic ordering and rank assignment
  - Match POST cache invalidation for ranking and team detail subtree
  - Unit and route tests for ranking and revalidation behavior
affects: [ranking-ui, team-details]
tech-stack:
  added: []
  patterns: [prisma-normalization, deterministic-sort, route-revalidation]
key-files:
  created: [src/lib/ranking.ts, src/lib/ranking.test.ts]
  modified: [src/app/api/matches/route.ts, src/app/api/matches/route.test.ts]
key-decisions:
  - "Ranking order is wins desc, winRate desc, then pt-BR name asc for stable ties."
  - "Match creation revalidates /ranking plus /times layout to refresh /times/[id]."
patterns-established:
  - "Ranking data is assembled server-side from active teams and full match history."
  - "Route-level cache invalidation is asserted in route tests."
requirements-completed: [RANK-01, RANK-02, RANK-03, RANK-04]
duration: 8min
completed: 2026-03-25
---

# Phase 4 Plan 1: Data Foundation Summary

**Ranking data foundation with deterministic tie-breaking and match-triggered cache refresh for ranking and team-detail routes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-25T22:25:39Z
- **Completed:** 2026-03-25T22:27:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `listAllTeamsWithStats(type?)` with active-team filtering, full-history stats, deterministic sorting, and rank assignment.
- Added tests for in-memory fallback, type filtering, archived exclusion behavior, ordering, and zero-match teams.
- Added POST `/api/matches` cache invalidation for `/ranking` and `/times` layout with route-level assertions.

## Task Commits

1. **Task 1: Implement ranking domain contract and stable ordering**
- `fa7b732` (test, RED)
- `8025e6f` (feat, GREEN)
2. **Task 2: Add route cache revalidation for ranking and team subtree**
- `29a7230` (test, RED)
- `6764ef9` (feat, GREEN)

## Files Created/Modified
- `src/lib/ranking.ts` - Ranked team contract and ranking query/sort pipeline
- `src/lib/ranking.test.ts` - Ranking behavior tests with D-02/D-03 traceability in descriptions
- `src/app/api/matches/route.ts` - Revalidation calls after successful match creation
- `src/app/api/matches/route.test.ts` - Revalidation assertions on successful POST

## Decisions Made
- Stable tie-break explicitly uses locale-aware team name comparison (`pt-BR`) after wins and win rate.
- Revalidation scope includes `/times` layout to ensure `/times/[id]` freshness, not only `/ranking`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Wave 2 ranking UI and team detail pages can now consume the ranking data contract and rely on route revalidation after match writes.

## Self-Check: PASSED
