---
phase: 02-scoreboard-reactivation-match-recording
plan: "02"
subsystem: ui
tags: [react, hooks, dashboard, scoreboard, match-recording, dynamic-teams]

# Dependency graph
requires:
  - phase: 02-01
    provides: getScoreboard() domain function, GET /api/scoreboard route returning ScoreboardData, ScoreboardData/ScoreboardResponse types in src/lib/types.ts
  - phase: 01-01
    provides: TeamRecord and TeamsResponse types, GET /api/teams route returning dynamic teams
provides:
  - useTeamsData() hook fetching /api/teams — exports from use-dashboard-data.ts
  - Dashboard component using dynamic TeamRecord[] from useTeamsData (no hardcoded constants)
  - registerWin sends full 3-field payload (teamAId, teamBId, winnerTeamId) to POST /api/matches
  - CVA variants using alpha/beta positional keys instead of frontend/backend literal IDs
affects: [phase-3, phase-4, phase-5]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Positional team color mapping: index 0 = team-alpha, index 1 = team-beta (via getTeamVariant helper)"
    - "Dual hook pattern in use-dashboard-data.ts: useDashboardData() for match state, useTeamsData() for team list"
    - "Dynamic handleRegisterWin: derives teamAId/teamBId from dynamicTeams array at call time"

key-files:
  created: []
  modified:
    - src/components/dashboard/use-dashboard-data.ts
    - src/components/dashboard/index.tsx

key-decisions:
  - "useTeamsData() follows same error-toast pattern as useDashboardData — fetch errors surface via sonner toast.error"
  - "Team color variant is positional (array index) not identity-based — first team is always alpha, second always beta"
  - "handleRegisterWin derives otherTeam with Array.find() at call time — no team pair state stored"
  - "TeamScoreCard receives TeamRecord directly — no intermediate display shape; member count derived inline"
  - "Slogan field removed from UI (not in TeamRecord); replaced by member count summary (e.g., '2 membros')"

patterns-established:
  - "Pattern: import shared domain types (ScoreboardData, TeamsResponse) from @/lib/types — never redefine inline in hooks"
  - "Pattern: RegisterWinInput requires all 3 match fields (teamAId, teamBId, winnerTeamId) — never send partial payload"

requirements-completed: [DASH-01]

# Metrics
duration: 30min
completed: 2026-03-25
---

# Phase 02 Plan 02: Dynamic Dashboard & registerWin Payload Fix Summary

**Dashboard refactored to fetch teams from /api/teams via useTeamsData() hook; TEAMS constant removed; registerWin now sends full teamAId+teamBId+winnerTeamId payload to POST /api/matches**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-25
- **Completed:** 2026-03-25
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 2

## Accomplishments

- Removed hardcoded TEAMS constant and TEAM_BUTTON_VARIANT map from dashboard/index.tsx
- Added useTeamsData() hook that fetches /api/teams and returns TeamRecord[] with loading state
- Fixed registerWin payload to include teamAId, teamBId, and winnerTeamId — matching POST /api/matches schema
- CVA variants migrated from "frontend"/"backend" keys to positional "alpha"/"beta" keys
- Human verification confirmed: teams load dynamically, match registration succeeds, wins counter updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Add useTeamsData() hook and fix registerWin payload** - `9f39f1a` (feat)
2. **Task 2: Refactor Dashboard component to use dynamic teams** - `613ba64` (feat)
3. **Task 3: Human verification — dynamic dashboard end-to-end** - approved (no commit — human-verify checkpoint)

## Files Created/Modified

- `src/components/dashboard/use-dashboard-data.ts` — Added useTeamsData() hook; removed local ScoreboardData type (now imported from @/lib/types); updated RegisterWinInput with teamAId/teamBId; fixed registerWin fetch body
- `src/components/dashboard/index.tsx` — Removed TEAMS constant and TEAM_BUTTON_VARIANT map; added getTeamVariant/getButtonVariant helpers; TeamScoreCard now receives TeamRecord; Dashboard uses dynamicTeams from useTeamsData(); handleRegisterWin derives team pair at call time

## Decisions Made

- Team color variant uses positional mapping (index 0 = alpha, index 1 = beta) rather than identity-based mapping — decouples UI color scheme from database team IDs
- useTeamsData() follows the existing error-toast pattern (sonner toast.error) for consistency with useDashboardData()
- handleRegisterWin finds the "other team" via Array.find() at call time, keeping team pair logic co-located with match registration

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dashboard is fully dynamic: no hardcoded team IDs remain in UI components
- POST /api/matches receives the correct 3-field payload required by the schema
- Both DASH-01 and DASH-02 success criteria met (teams fetched dynamically, match recording works)
- Phase 3 can begin: Stats Computation Module (pure W/L aggregation, win rates, streaks, H2H)

---
*Phase: 02-scoreboard-reactivation-match-recording*
*Completed: 2026-03-25*
