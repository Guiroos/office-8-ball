---
phase: quick-260330-wnc
plan: 01
subsystem: testing
tags: [vitest, mock-factory, hoisting, login-redirect]
key-files:
  modified:
    - src/app/(authenticated)/head-to-head/page.test.tsx
    - src/components/ranking/ranking-view.test.tsx
    - src/components/login/login-screen.tsx
    - vitest.config.ts
decisions:
  - "Replace vi.importActual(@/lib/auth) with direct mock factory to avoid Prisma initialization at mock time"
  - "Replace vi.importActual(@/lib/ranking) with direct mock factory since only listAllTeamsWithStats needed"
  - "Exclude .claude/worktrees/** from vitest test discovery to prevent worktree test duplication"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 3
  files_changed: 4
---

# Phase quick-260330-wnc Plan 01: Fix 10 Failing Tests (Vitest Mock Factory) Summary

**One-liner:** Fixed Vitest mock hoisting violations via vi.hoisted() + dropped vi.importActual for modules that trigger Prisma initialization, and corrected login redirect from /profile to /dashboard.

## What Was Done

### Task 1: Fix vi.hoisted() mock factory violations

**head-to-head/page.test.tsx:**
- Replaced two standalone `const mockListUserTeams = vi.fn<...>()` and `const mockListMatches = vi.fn<...>()` declarations with a single `vi.hoisted()` block
- Replaced `vi.mock("@/lib/auth", async () => { const actual = await vi.importActual(...) })` with a direct mock factory — `vi.importActual` was triggering Prisma client initialization (PrismaClientInitializationError: Missing configured driver adapter) even though the mock was supposed to intercept it
- The `vi.hoisted()` fix alone was not sufficient; the root cause was `vi.importActual(@/lib/auth)` loading the real `auth.ts` which imports `@/lib/prisma` synchronously

**ranking-view.test.tsx:**
- Replaced three standalone `const mock* = vi.fn()` declarations with a single `vi.hoisted()` block
- Replaced `vi.mock("@/lib/auth", async () => { const actual = await vi.importActual(...) })` with a direct mock factory (same Prisma issue)
- Replaced `vi.mock("@/lib/ranking", async () => { const actual = await vi.importActual(...) })` with a direct mock factory — ranking.ts also imports Prisma client

**vitest.config.ts:**
- Added `.claude/worktrees/**` to the `exclude` array. The previous exclude only had `.worktrees/**` which did not match the actual path. This prevented worktree test files from being discovered and run twice (once from the main repo and once from the worktree), which was causing 2x test duplication in output.

### Task 2: Fix login redirect destination

**login-screen.tsx:**
- Changed `router.push("/profile")` to `router.push("/dashboard")` on line 230 inside `handleSubmit`
- Applies to both login and registration success paths
- Matches the documented app flow: "login → /dashboard"
- Two previously failing tests now pass: "submits login credentials and redirects to the dashboard" and "submits registration, signs in, and redirects"

### Task 3: Full suite verification

- 306 tests pass across 45 test files
- `npm run typecheck` exits clean

## Tests Fixed

| # | Test File | Test Name | Fix Applied |
|---|-----------|-----------|-------------|
| 1 | head-to-head/page.test.tsx | shows unavailable callout when DATABASE_URL is absent | vi.hoisted() + remove importActual |
| 2 | head-to-head/page.test.tsx | shows unavailable callout when user is not authenticated | vi.hoisted() + remove importActual |
| 3 | head-to-head/page.test.tsx | renders HeadToHeadView with fallback pair when no params provided (D-15) | vi.hoisted() + remove importActual |
| 4 | head-to-head/page.test.tsx | renders warning when invalid teamA param provided (D-16) | vi.hoisted() + remove importActual |
| 5 | head-to-head/page.test.tsx | renders warning when same team selected for both sides (D-17) | vi.hoisted() + remove importActual |
| 6 | ranking-view.test.tsx | RankingPage: fetches rankings with validated searchParams type | vi.hoisted() + remove importActual |
| 7 | ranking-view.test.tsx | RankingPage: fetches rankings with validated period param | vi.hoisted() + remove importActual |
| 8 | ranking-view.test.tsx | RankingPage: defaults period to 'all' when param is missing | vi.hoisted() + remove importActual |
| 9 | login-screen.test.tsx | submits login credentials and redirects to the dashboard | router.push('/dashboard') |
| 10 | login-screen.test.tsx | submits registration, signs in, and redirects | router.push('/dashboard') |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.importActual for @/lib/auth and @/lib/ranking triggers Prisma**
- **Found during:** Task 1 — after applying vi.hoisted() the tests still failed with PrismaClientInitializationError
- **Issue:** `vi.importActual("@/lib/auth")` inside the `vi.mock` factory loads the real `auth.ts` module synchronously, which imports `@/lib/prisma`, which tries to instantiate PrismaClient with a Neon WebSocket driver adapter that requires a runtime DATABASE_URL. Even though the factory is supposed to intercept the module, `importActual` bypasses that to get the un-mocked version. Similarly for `@/lib/ranking`.
- **Fix:** Replaced `async () => { const actual = await vi.importActual(...); return { ...actual, mockFn } }` with a direct non-async factory `() => ({ mockFn, ...only-needed-exports })`. The tests only needed `hasDatabaseUrl`, `getAuthenticatedUser`, and `listAllTeamsWithStats` from these modules — no actual utilities were needed from the `actual` spread.
- **Files modified:** `src/app/(authenticated)/head-to-head/page.test.tsx`, `src/components/ranking/ranking-view.test.tsx`
- **Commits:** 02e3061

**2. [Rule 3 - Blocking] Vitest discovering worktree test files causing duplication**
- **Found during:** Task 1 — test output showed failures from `.claude/worktrees/agent-a0cf6879/src/...` paths (old master codebase that still has next-auth and cannot import auth.ts)
- **Issue:** `vitest.config.ts` only excluded `.worktrees/**` but the actual worktree path is `.claude/worktrees/agent-a0cf6879/...`. The worktree contains the old master branch code with next-auth which fails to import.
- **Fix:** Added `.claude/worktrees/**` to the `exclude` array in `vitest.config.ts`
- **Files modified:** `vitest.config.ts`
- **Commit:** 02e3061

## Commits

| Hash | Message |
|------|---------|
| 02e3061 | fix(quick-260330-wnc): fix vi.mock hoisting violations in head-to-head and ranking tests |
| 2370955 | fix(quick-260330-wnc): redirect to /dashboard after successful login or registration |

## Self-Check: PASSED
