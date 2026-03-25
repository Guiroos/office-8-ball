---
phase: 03-stats-computation-module
plan: 01
subsystem: domain
tags: [typescript, zod, vitest, pure-functions, stats, streak-detection]

# Dependency graph
requires:
  - phase: 02-scoreboard-reactivation-match-recording
    provides: MatchRecord type and match data patterns used as input to stats functions

provides:
  - computeTeamStats pure function for W/L aggregation, win rate, and streak detection
  - computeHeadToHead pure function for two-team head-to-head metrics
  - TeamStatsSchema and HeadToHeadStatsSchema Zod validation schemas
  - TeamStats and HeadToHeadStats TypeScript types (re-exported from types.ts)
  - 21 edge-case unit tests covering all success criteria SC-1..SC-6

affects:
  - 04-ranking-page
  - 05-user-profiles-time-filters

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure function pattern — stats functions accept MatchRecord[] only, no side effects, no DB access
    - Zod output validation — TeamStatsSchema.parse() at function boundary prevents NaN/invalid values escaping
    - Oldest-to-newest iteration for streak detection — iterating in reverse order ensures currentStreak reflects most recent run

key-files:
  created:
    - src/lib/stats.ts
    - src/lib/stats.test.ts
  modified:
    - src/lib/types.ts

key-decisions:
  - "Iterate match array oldest-to-newest for streak detection so currentStreak reflects the most recent continuous run, not the oldest"
  - "detectStreaks is an internal helper (not exported) — callers only need computeTeamStats"
  - "recentMatchIds field name (not recentMatches) used in HeadToHeadStatsSchema to match plan action spec"
  - "types.ts re-exports TeamStats and HeadToHeadStats from stats.ts — types co-located with Zod schemas via z.infer"

patterns-established:
  - "Pure function contract: all stats functions accept MatchRecord[], return validated output via Zod.parse()"
  - "Zero-guard before division: total === 0 ? 0 : (wins / total) * 100 prevents NaN win rate"
  - "Streak detection: reverse iteration (oldest first) makes final loop value = current (most recent) streak"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 03 Plan 01: Stats Computation Module Summary

**Pure functions `computeTeamStats` and `computeHeadToHead` with Zod boundary validation, streak detection, and 21 edge-case unit tests covering zero/single/large datasets, asymmetric H2H ordering, and NaN rejection**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-25T22:45:57Z
- **Completed:** 2026-03-25T22:48:52Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `src/lib/stats.ts` with `computeTeamStats`, `computeHeadToHead`, Zod schemas, and internal `detectStreaks` helper
- Extended `src/lib/types.ts` with re-exports of `TeamStats` and `HeadToHeadStats` for downstream consumers
- Created `src/lib/stats.test.ts` with 21 test cases covering all 6 success criteria; full suite (201 tests) green

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend types.ts and implement stats.ts** - `7fa3fcb` (feat)
2. **Task 2: Write comprehensive edge case tests** - `f64c180` (test + fix)

_Note: Task 2 commit includes an auto-fix to the iteration order in detectStreaks (Rule 1 - Bug)_

## Files Created/Modified

- `src/lib/stats.ts` — Pure stats module: `computeTeamStats`, `computeHeadToHead`, `detectStreaks`, `TeamStatsSchema`, `HeadToHeadStatsSchema`, `TeamStats`, `HeadToHeadStats`
- `src/lib/stats.test.ts` — 21 edge-case unit tests, no mocks, pure function coverage SC-1..SC-6
- `src/lib/types.ts` — Re-exports `TeamStats` and `HeadToHeadStats` from `@/lib/stats`

## Decisions Made

- **Iteration direction for streak detection:** Reversed iteration order (oldest-to-newest) ensures `currentStreak` reflects the most recent continuous run. Forward iteration (most-recent-first) would track the oldest streak as "current".
- **Types co-located with schemas:** `TeamStats` and `HeadToHeadStats` defined via `z.infer<>` in `stats.ts`, re-exported through `types.ts` for consumers who import from `@/lib/types`.
- **No new dependencies:** All functionality built on existing Zod + TypeScript stack.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed detectStreaks iteration direction**
- **Found during:** Task 2 (running tests)
- **Issue:** Plan's `detectStreaks` iterated matches in descending order (most-recent-first), causing `currentStreak` to reflect the OLDEST continuous run rather than the most recent. Tests for "broken streak" and "longest streak in middle" failed.
- **Fix:** Changed loop to iterate `teamMatches` in reverse (oldest-to-newest) so the final `runType/runCount` at loop end always reflects the most recent sequence.
- **Files modified:** `src/lib/stats.ts`
- **Verification:** All 21 stats tests pass, including the two that caught the bug
- **Committed in:** `f64c180` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix was essential for correctness — broken streak detection would produce wrong currentStreak results in Phase 4 ranking page. No scope creep.

## Issues Encountered

- Vitest 4 does not support `-x` flag from plan's verify command — removed flag from test run commands. Tests run and pass without it.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `computeTeamStats` and `computeHeadToHead` are ready for Phase 4 (ranking page) to call per team from the full match history
- Phase 4 can call `computeTeamStats(teamId, allMatches)` in a loop for all teams, then sort by wins
- Both functions accept any team IDs — no hardcoded constants
- `TeamStats` and `HeadToHeadStats` types importable from either `@/lib/stats` or `@/lib/types`

## Self-Check: PASSED

All created files exist and commits verified on disk.

---
*Phase: 03-stats-computation-module*
*Completed: 2026-03-25*
