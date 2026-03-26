---
phase: 04-ranking-team-details
plan: 03
subsystem: ui
tags: [teams, h2h, rsc, prisma, vitest]
requires:
  - phase: 04-01
    provides: ranking contract and match-derived stats foundation
  - phase: 04-02
    provides: ranking route and /times detail link conventions
provides:
  - Server-side team detail assembler with ranking, roster, recent matches, and H2H summaries
  - Team list/detail component suite wired to server-precomputed payloads
  - /times and /times/[id] authenticated routes with explicit unavailable/not-found states
affects: [ranking-links, profile-phase]
tech-stack:
  added: []
  patterns: [server-assembled-detail-payload, client-h2h-selector, async-param-routes]
key-files:
  created: [src/lib/team-details.ts, src/lib/team-details.test.ts, src/components/teams/team-card.tsx, src/components/teams/member-list.tsx, src/components/teams/recent-matches-list.tsx, src/components/teams/h2h-section.tsx, src/components/teams/team-detail-view.tsx, src/app/(authenticated)/times/[id]/page.tsx]
  modified: [src/app/(authenticated)/times/page.tsx]
key-decisions:
  - "Team detail access is authenticated-public for active teams (membership not required in /times/[id])."
  - "H2H stays server-computed; client section only selects among precomputed rival summaries."
patterns-established:
  - "Team detail payload includes member display mapping, ranking position, and H2H lastMatchDate."
  - "Times area uses URL-driven tabs with right-column create CTA."
requirements-completed: [TEAM-02]
duration: 12min
completed: 2026-03-25
---

# Phase 4 Plan 3: Team Details Summary

**Server-assembled team detail route with precomputed H2H summaries and tabbed teams page wiring**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-25T22:31:40Z
- **Completed:** 2026-03-25T22:36:20Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Implemented `getTeamDetailData(teamId, viewerId)` with active-team policy, ranking position lookup, member role/name mapping, and rival-scoped H2H summaries (including `lastMatchDate`).
- Added teams UI components for list/detail pages (`TeamCard`, `MemberList`, `RecentMatchesList`, `H2HSection`, `TeamDetailView`) using server-precomputed contracts.
- Replaced `/times` placeholder with tabbed RSC + sidebar CTA and added `/times/[id]` RSC route wired to `getTeamDetailData`.

## Task Commits

1. **Task 1: Build server-side team detail assembler with explicit access policy**
- `52a8589` (test, RED)
- `e25e8ce` (feat, GREEN)
2. **Task 2: Implement teams UI components against server precomputed contracts**
- `70275ce` (feat)
3. **Task 3: Wire /times and /times/[id] pages with tabs, CTA sidebar, and detail access policy**
- `9e76352` (feat)

## Files Created/Modified
- `src/lib/team-details.ts` - Team detail server assembler with rivals/H2H summaries
- `src/lib/team-details.test.ts` - Unit tests for archived/missing guards, ranking, rivals, primary rival, and lastMatchDate
- `src/components/teams/team-card.tsx` - Team list card with /times detail navigation
- `src/components/teams/member-list.tsx` - Roster rendering with `Criador`/`Membro` labels
- `src/components/teams/recent-matches-list.tsx` - Last three matches with pt-BR datetime formatting
- `src/components/teams/h2h-section.tsx` - Client rival selector over server-precomputed H2H payload
- `src/components/teams/team-detail-view.tsx` - Detail layout with required stats block and H2H integration
- `src/app/(authenticated)/times/page.tsx` - Tabbed teams/create page with sidebar create CTA
- `src/app/(authenticated)/times/[id]/page.tsx` - Team detail route using async params and `notFound()`

## Decisions Made
- Kept `/times/[id]` policy as authenticated-public for active teams to align ranking-to-detail navigation.
- Bound H2H rival options to viewer membership teams while excluding the current team, matching D-09/D-10 constraints.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification (Codex)

- `npm run test -- src/lib/team-details.test.ts` — PASS (6/6)
- `npm run typecheck` — PASS

## Next Phase Readiness

Phase 5 can extend this foundation with historical views and richer filters without reworking the team detail data contract.

## Self-Check: PASSED
