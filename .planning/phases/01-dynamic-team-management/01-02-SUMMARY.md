---
phase: 01-dynamic-team-management
plan: 02
subsystem: api
tags: [prisma, nextjs, typescript, api-routes, zod, vitest]

# Dependency graph
requires:
  - phase: 01-dynamic-team-management/01-01
    provides: TeamRecord with type field (solo | duo), isTeamMember, findUserById functions in teams.ts

provides:
  - addTeamMember(teamId, userId) domain function in src/lib/teams.ts
  - removeTeamMember(teamId, userIdToRemove) domain function in src/lib/teams.ts
  - POST /api/teams/:id/members endpoint (add member to team)
  - DELETE /api/teams/:id/members/:userId endpoint (remove member from team)
  - Unit tests for both domain functions (9 tests)

affects:
  - 02-scoreboard-reactivation
  - 04-ranking-page
  - any phase that uses team roster management

# Tech tracking
tech-stack:
  added: []
  patterns:
    - async params pattern for Next.js route handlers (params: Promise<{...}>)
    - membership-first guard (isTeamMember before any mutation)
    - hasDatabaseUrl guard as first line in all team endpoints (503 without DATABASE_URL)
    - domain function throws errors in Portuguese; route handlers catch and convert to HTTP responses
    - vi.mock for Prisma + vi.resetModules in beforeEach for test isolation

key-files:
  created:
    - src/lib/teams.ts (addTeamMember, removeTeamMember appended)
    - src/app/api/teams/[id]/members/route.ts
    - src/app/api/teams/[id]/members/[userId]/route.ts
    - src/lib/teams.test.ts
  modified:
    - src/lib/teams.ts

key-decisions:
  - "All member management endpoints return 503 without DATABASE_URL (no in-memory fallback for member ops per D-10)"
  - "Any team member (not just creator) can add or remove members (per D-06)"
  - "Team creator protected from removal via domain-layer check in removeTeamMember"
  - "Min member enforcement: solo >= 1, duo >= 2 — checked before delete"

patterns-established:
  - "Async params: all dynamic route handlers use { params }: { params: Promise<{...}> } with await"
  - "Membership-first guard: isTeamMember checked before any mutation to prevent enumeration"
  - "Domain function error contract: functions throw with Portuguese messages; routes catch as 400"

requirements-completed: [TEAM-01]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 01 Plan 02: Member Management Summary

**POST and DELETE REST endpoints for team roster management with creator protection, minimum member enforcement, and 503 fallback when DATABASE_URL is absent**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T00:19:28Z
- **Completed:** 2026-03-25T00:22:52Z
- **Tasks:** 6
- **Files modified:** 4

## Accomplishments

- Added `addTeamMember` and `removeTeamMember` domain functions to `src/lib/teams.ts` with full constraint enforcement
- Created `POST /api/teams/:id/members` with auth, membership, and Zod validation guards
- Created `DELETE /api/teams/:id/members/:userId` with auth and membership guards
- All 172 tests pass; 9 new tests cover success and error paths for both domain functions

## Task Commits

Each task was committed atomically:

1. **Task 1: addTeamMember and removeTeamMember domain functions** - `0ed04bd` (feat)
2. **Task 2: POST /api/teams/:id/members endpoint** - `c998d6c` (feat)
3. **Task 3: DELETE /api/teams/:id/members/:userId endpoint** - `64ecb15` (feat)
4. **Task 4: In-memory fallback verification** - (verification only; guards confirmed in Tasks 2-3)
5. **Task 5: Test file for member management** - `6686e14` (test)
6. **Task 6: Type fix in test helper** - `959902c` (fix)

## Files Created/Modified

- `src/lib/teams.ts` - Added `addTeamMember` and `removeTeamMember` functions
- `src/app/api/teams/[id]/members/route.ts` - POST endpoint to add team member
- `src/app/api/teams/[id]/members/[userId]/route.ts` - DELETE endpoint to remove team member
- `src/lib/teams.test.ts` - 9 unit tests for member management domain functions

## Decisions Made

- Async params pattern (`params: Promise<{ id: string }>` with `await params`) used consistently with existing `[id]/route.ts` pattern - plan showed synchronous destructuring but the existing codebase uses the async pattern from Next.js 15+.
- Task 4 (in-memory fallback verification) produced no new code — both new endpoints already include `hasDatabaseUrl()` guard as first line per plan Tasks 2-3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Prisma delete compound key field name**
- **Found during:** Task 1 (addTeamMember/removeTeamMember implementation)
- **Issue:** Plan code used `{ teamId_userId: { teamId, userIdToRemove } }` — but the Prisma compound key uses `userId` as the field name, not `userIdToRemove`
- **Fix:** Changed to `{ teamId_userId: { teamId, userId: userIdToRemove } }`
- **Files modified:** `src/lib/teams.ts`
- **Verification:** `npm run typecheck` passes; test suite passes
- **Committed in:** `0ed04bd` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed TypeScript narrowing error in test helper**
- **Found during:** Task 6 verification (`npm run typecheck`)
- **Issue:** `makeTeam` helper parameter type was inferred as `type: "duo"` from `TEAM_BASE`, blocking `type: "solo"` override in solo min-member test
- **Fix:** Explicitly typed `makeTeam` parameter to accept `"solo" | "duo"` via `Omit<...> & { type: "solo" | "duo" }`
- **Files modified:** `src/lib/teams.test.ts`
- **Verification:** `npm run typecheck` passes; all 172 tests pass
- **Committed in:** `959902c` (Task 6 fix commit)

---

**Total deviations:** 2 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Team member management API complete — any authenticated team member can add/remove members
- Creator protection and minimum member constraints enforced at domain layer
- Dual-mode persistence: all team member endpoints return 503 without DATABASE_URL (consistent with D-10)
- Phase 2 (scoreboard reactivation) can now build on dynamic team rosters

---

*Phase: 01-dynamic-team-management*
*Completed: 2026-03-25*

## Self-Check: PASSED

All files verified present and all commit hashes confirmed in git log.
