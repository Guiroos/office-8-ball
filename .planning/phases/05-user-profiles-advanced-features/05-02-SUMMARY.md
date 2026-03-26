---
phase: 05-user-profiles-advanced-features
plan: 02
subsystem: profile
tags: [rsc, server-first, profile-stats, tdd]
dependency_graph:
  requires: [05-01]
  provides: [profile-rsc-wiring, profile-page-props]
  affects: [profile-route, profile-ui]
tech_stack:
  added: []
  patterns:
    - Async RSC assembler pattern for server-side data composition
    - Props-based presentational component (ProfilePage receives ProfilePageData)
key_files:
  created:
    - src/app/(authenticated)/profile/page.test.tsx
  modified:
    - src/app/(authenticated)/profile/page.tsx
    - src/components/profile/profile-page.tsx
    - src/components/profile/profile-page.test.tsx
decisions:
  - "ProfileRoute assembles all data server-side: hasDatabaseUrl guard → getAuthenticatedUser → DB user lookup → listUserTeams(includeArchived=true) + listMatches → computeProfilePageData → identity override"
  - "ProfilePage receives ProfilePageData & { email } as props — no client fetches for primary metrics"
  - "profile-page.test.tsx rewritten to test props-based API; old fetch-mock pattern removed"
metrics:
  duration: ~10 minutes
  completed: 2026-03-26
  tasks_completed: 2
  files_modified: 4
---

# Phase 05 Plan 02: Profile Server-Side Wiring Summary

**One-liner:** Server-first `/profile` route that assembles ProfilePageData from user DB + teams + matches and renders it via props-based ProfilePage, fulfilling PROF-01/02/03.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wiring server-side da rota /profile com payload agregado | c780c72 | page.tsx, page.test.tsx |
| 2 | Reescrever ProfilePage para consumir props agregadas | e4087e9 | profile-page.tsx, profile-page.test.tsx |

## What Was Built

**Task 1 (TDD):** Transformed `src/app/(authenticated)/profile/page.tsx` from a synchronous passthrough into an async RSC that:
1. Guards on `hasDatabaseUrl()` — returns `IconCallout` unavailable state if DB absent
2. Calls `getAuthenticatedUser()` — returns unavailable callout if not authenticated
3. Fetches `prisma.user.findUnique` for identity fields (email, displayName, avatarUrl, bio, createdAt)
4. Fetches `listUserTeams(userId, true)` (archived included per D-07) and `listMatches(userId)` in parallel
5. Calls `computeProfilePageData(userId, teams, matches)` from the domain module
6. Overrides placeholder identity fields with real DB values (D-01)
7. Passes assembled `ProfilePageData & { email }` to `<ProfilePage data={...} />`

Created `page.test.tsx` with 3 tests covering: no-DB unavailable state, authenticated user renders ProfilePage with correct payload, unauthenticated user gets unavailable state.

**Task 2:** Rewrote `src/components/profile/profile-page.tsx`:
- Removed `const TEAMS = [...]` hardcode
- Removed `useEffect` fetches for `/api/profile` and `/api/matches`
- Now accepts `ProfilePageProps = { data: ProfilePageData & { email: string | null } }`
- Renders real `aggregate.wins`, `aggregate.losses`, `aggregate.winRate`, `aggregate.totalMatches` via `StatTile`
- Renders `teamRows` list with per-team W/D/WinRate stats (or empty state callout)
- Preserves `ProfileEditDialog` for account field editing via `PUT /api/profile`
- Updated `profile-page.test.tsx` to test props-based API with 8 tests

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Out-of-scope pre-existing issue noted

`src/lib/head-to-head.test.ts` has 11 TypeScript errors (`'result.pair.teamA' is possibly 'null'`) that pre-existed before this plan. Documented here, not fixed.

## Known Stubs

- **Recent matches section** (`src/components/profile/profile-page.tsx`): The right column shows "Histórico de partidas disponível em breve." — match history display is intentionally deferred. The primary goal of this plan (PROF-01/02/03: aggregate stats + team rows) is fully wired. Match history display is a future enhancement.

## Self-Check: PASSED

Files exist:
- FOUND: src/app/(authenticated)/profile/page.tsx
- FOUND: src/app/(authenticated)/profile/page.test.tsx
- FOUND: src/components/profile/profile-page.tsx
- FOUND: src/components/profile/profile-page.test.tsx

Commits exist:
- FOUND: c780c72 (feat(05-02): wire /profile as async RSC)
- FOUND: e4087e9 (feat(05-02): rewrite ProfilePage to consume ProfilePageData props)

Tests: 11/11 passed across both test files
Typecheck: clean (excluding pre-existing head-to-head.test.ts errors)
