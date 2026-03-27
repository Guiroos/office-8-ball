---
phase: 07-team-details-access-member-actions
plan: 01
subsystem: ui
tags: [next.js, react, prisma, authorization, team-detail]

# Dependency graph
requires:
  - phase: 04-ranking-team-detail-pages
    provides: team-detail page and getTeamDetailData loader
  - phase: 01-dynamic-team-management
    provides: isTeamMember function in src/lib/teams.ts
provides:
  - TeamDetailResult discriminated union (not-found | forbidden | detail)
  - Membership gate in getTeamDetailData before any heavy queries
  - TeamDetailAccessDenied component (403 screen wrapping RouteStateScreen)
  - /times/[id] page branching on TeamDetailResult kind
affects: [07-02-member-actions, any future plan touching team-detail page contract]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Discriminated union result type for server-side loaders (not-found | forbidden | detail)"
    - "Membership-first gate in data loader mirrors existing API pattern in /api/teams/[id]/route.ts"
    - "TeamDetailAccessDenied as thin wrapper around RouteStateScreen — no new UI primitives needed"

key-files:
  created:
    - src/components/teams/team-detail-access-denied.tsx
    - src/components/teams/team-detail-access-denied.test.tsx
  modified:
    - src/lib/team-details.ts
    - src/lib/team-details.test.ts
    - src/app/(authenticated)/times/[id]/page.tsx

key-decisions:
  - "getTeamDetailData now returns TeamDetailResult (discriminated union) instead of TeamDetailData | null — null was overloaded for both missing-team and forbidden; split removes ambiguity"
  - "isTeamMember runs after team existence/active check but before all heavy queries (ranking, matches, users) — prevents data leakage and avoids unnecessary DB work for non-members"
  - "TeamDetailAccessDenied wraps RouteStateScreen directly — no intermediate abstraction needed; consistent with existing route-state surfaces like 404"
  - "Page preserves hasDatabaseUrl() early return unchanged — in-memory mode behavior not affected"

patterns-established:
  - "Pattern: loader returns discriminated union; page switches on .kind before rendering — cleaner than null overloading"
  - "Pattern: membership gate runs before expensive queries in server-side data assemblers"

requirements-completed: [TEAM-02]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 07 Plan 01: Team Detail Access Gate Summary

**Membership gate added to `getTeamDetailData` via `TeamDetailResult` discriminated union, with explicit 403 access-denied screen for non-members on `/times/[id]`**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-26T22:59:16Z
- **Completed:** 2026-03-26T23:02:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `getTeamDetailData` now gates on `isTeamMember` before running ranking/matches/users queries — non-members receive `{ kind: "forbidden", teamId }` and no data is fetched
- New `TeamDetailResult` union type makes the three outcomes explicit: `not-found`, `forbidden`, `detail` — eliminates null overloading
- `TeamDetailAccessDenied` component renders a full RouteStateScreen with code 403, clear message, and CTAs back to `/times` and `/dashboard`
- `/times/[id]` page branches cleanly on `kind` — existing in-memory fallback branch untouched
- 11 tests pass across 2 test files (7 data-layer, 4 component)

## Task Commits

Each task was committed atomically:

1. **Task 1: Redefine getTeamDetailData to TeamDetailResult union type** - `a08d527` (feat)
2. **Task 2: Render TeamDetailAccessDenied for non-members on /times/[id]** - `626ce1d` (feat)

_Note: Both tasks followed TDD (RED tests first, then GREEN implementation)_

## Files Created/Modified

- `src/lib/team-details.ts` - Added `TeamDetailResult` type, `isTeamMember` gate, changed return from `TeamDetailData | null` to `TeamDetailResult`
- `src/lib/team-details.test.ts` - Replaced old unrestricted-access tests with explicit `not-found`, `forbidden`, `detail` cases including a test verifying no heavy queries run for forbidden
- `src/components/teams/team-detail-access-denied.tsx` - New component wrapping RouteStateScreen with 403 props
- `src/components/teams/team-detail-access-denied.test.tsx` - 4 tests covering rendered text, /times link, /dashboard link
- `src/app/(authenticated)/times/[id]/page.tsx` - Updated to consume `TeamDetailResult`, branch on `.kind`

## Decisions Made

- `getTeamDetailData` return type changed from `TeamDetailData | null` to `TeamDetailResult` — null was overloaded for missing-team and forbidden; discriminated union is unambiguous
- Membership check placed after team existence check but before all heavy queries — mirrors the existing API route pattern and avoids unnecessary DB work
- `TeamDetailAccessDenied` is a thin wrapper over the existing `RouteStateScreen` — no new UI primitives needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Authorization contract is stable: `TeamDetailResult` union is the single source of truth for team-detail page outcomes
- Plan 07-02 (member actions) can now build invite/remove UI on top of the established `detail` branch without touching the gate logic
- No blockers

## Self-Check: PASSED

- FOUND: src/lib/team-details.ts
- FOUND: src/lib/team-details.test.ts
- FOUND: src/components/teams/team-detail-access-denied.tsx
- FOUND: src/components/teams/team-detail-access-denied.test.tsx
- FOUND: .planning/phases/07-team-details-access-member-actions/07-01-SUMMARY.md
- FOUND commit: a08d527 (Task 1)
- FOUND commit: 626ce1d (Task 2)

---
*Phase: 07-team-details-access-member-actions*
*Completed: 2026-03-26*
