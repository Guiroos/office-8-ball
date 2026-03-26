---
phase: 05-user-profiles-advanced-features
plan: "05"
subsystem: ui
tags: [next.js, react, typescript, head-to-head, query-params, url-sync]

# Dependency graph
requires:
  - phase: 05-01
    provides: profile-stats module and time-period domain contracts used by same phase
  - phase: 03-stats-computation-module
    provides: computeHeadToHead pure function used in resolveHeadToHeadData

provides:
  - resolveHeadToHeadData() assembler with D-15/D-16/D-17 fallback logic in src/lib/head-to-head.ts
  - Protected /head-to-head route with server-side data assembly
  - HeadToHeadView client component with explicit Team A/Team B selectors synced to URL

affects: [head-to-head route consumers, middleware, any future H2H feature]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dual-mode page guard pattern (hasDatabaseUrl check before any DB access)
    - Query-param sync via useRouter().push() without full page reload (D-18)
    - Same-team prevention via filtered option lists in each selector

key-files:
  created:
    - src/lib/head-to-head.ts
    - src/lib/head-to-head.test.ts
    - src/app/(authenticated)/head-to-head/page.tsx
    - src/app/(authenticated)/head-to-head/page.test.tsx
    - src/components/head-to-head/head-to-head-view.tsx
  modified:
    - middleware.ts

key-decisions:
  - "resolveHeadToHeadData is a pure function with no DB access — page assembler handles data fetching then passes results"
  - "Dual-mode guard returns IconCallout without DATABASE_URL — consistent with hasDatabaseUrl pattern from team-details"
  - "HeadToHeadView filters options list per selector to prevent same-team selection (D-17) without extra validation state"

patterns-established:
  - "Pattern 1: Pure domain assembler (resolveHeadToHeadData) receives pre-fetched data, returns structured result with pair/warning/summary"
  - "Pattern 2: URL sync via router.push with URLSearchParams — no full reload (D-18)"
  - "Pattern 3: Test coverage uses vi.resetModules() + dynamic import per established testing.md pattern"

requirements-completed: [PROF-01]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 05 Plan 05: Head-to-Head Dedicated Route Summary

**Dedicated `/head-to-head` route with URL-synced Team A/Team B selectors, robust fallback for invalid params, and pure domain assembler implementing decisions D-14..D-18**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-26T19:57:00Z
- **Completed:** 2026-03-26T23:00:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Pure `resolveHeadToHeadData()` assembler with deterministic fallback to first valid pair (D-15), warning + recovery for invalid/unauthorized params (D-16), and same-team rejection (D-17)
- Protected `/head-to-head` page route with dual-mode guard (`hasDatabaseUrl`) — graceful degradation without DATABASE_URL
- `HeadToHeadView` client component with two explicit selectors (Team A / Team B) that prevent same-team selection and sync URL immediately via `router.push()` without full reload (D-18)
- Middleware updated to protect `/head-to-head/:path*`
- 11 tests: 6 unit tests on assembler, 5 integration tests on page route

## Task Commits

1. **Task 1: H2H assembler with validation and fallback** - `b11abd0` (feat)
2. **Task 2: Protected /head-to-head route and UI** - `f658949` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/lib/head-to-head.ts` - Pure assembler: resolveHeadToHeadData with D-15/D-16/D-17 logic
- `src/lib/head-to-head.test.ts` - 6 unit tests covering fallback, invalid params, same-team rejection
- `src/app/(authenticated)/head-to-head/page.tsx` - Async RSC with dual-mode guard and server-side data assembly
- `src/app/(authenticated)/head-to-head/page.test.tsx` - 5 page tests with vi.resetModules() + dynamic import pattern
- `src/components/head-to-head/head-to-head-view.tsx` - Client component with URL-synced selectors and warning banner
- `middleware.ts` - Added `/head-to-head/:path*` to protected matcher

## Decisions Made

- Pure assembler pattern: `resolveHeadToHeadData` accepts pre-fetched teams/matches arrays and returns structured result with pair, warning, options, summary — no DB access inside the function
- Dual-mode guard consistent with existing team-details and profile page patterns — returns `IconCallout` without DATABASE_URL
- Options filtered per selector to prevent same-team selection without client-side validation state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict null errors in test assertions**
- **Found during:** Task 1 (post-implementation typecheck)
- **Issue:** `result.pair.teamA.id` and `result.pair.teamB.id` caused TS18047 (possibly null) since `HeadToHeadPair` uses `TeamRecord | null`
- **Fix:** Updated all test assertions to use optional chaining (`?.id`) matching the nullable type
- **Files modified:** `src/lib/head-to-head.test.ts`
- **Verification:** `npm run typecheck` passes with no errors
- **Committed in:** `f658949` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (type correctness)
**Impact on plan:** Necessary for strict TypeScript compliance. No scope creep.

## Issues Encountered

None — plan executed as specified after the auto-fixed type issue.

## Known Stubs

None — all data is wired from real DB/in-memory sources via `listUserTeams` and `listMatches`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All decisions D-14..D-18 are implemented and covered by tests
- Route is deep-linkable via `?teamA=x&teamB=y` query params
- In-memory mode (no DATABASE_URL) gracefully shows an `IconCallout` — no broken state

## Self-Check: PASSED

All created files verified on disk. All task commits verified in git log.

---
*Phase: 05-user-profiles-advanced-features*
*Completed: 2026-03-26*
