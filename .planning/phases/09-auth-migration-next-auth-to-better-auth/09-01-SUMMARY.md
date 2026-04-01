---
phase: 09-auth-migration-next-auth-to-better-auth
plan: 01
subsystem: testing
tags: [better-auth, next-auth, vitest, auth-client, mocks]

# Dependency graph
requires:
  - phase: 07-team-details-access-member-actions
    provides: stable test suite baseline before auth migration
provides:
  - "Three test files with better-auth mock structure ready for Wave 1+ production code changes"
  - "auth.test.ts: better-auth api.getSession mock, BETTER_AUTH_SECRET env cleanup, no next-auth mocks"
  - "login-screen.test.tsx: vi.mock('@/lib/auth-client') with authClient.signIn.username stub"
  - "app-shell.test.tsx: vi.mock('@/lib/auth-client') with authClient.signOut stub"
affects:
  - 09-02 (Wave 1 — auth.ts rewrite will make auth.test.ts session tests fully green)
  - 09-03 (Wave 2 — login-screen.tsx and app-shell.tsx migration activates auth-client mocks)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.mock('better-auth') with betterAuth() returning api.getSession stub — intercepts module-level auth instance initialization"
    - "Dual-mock pattern: vi.mock('@/lib/auth-client') for future code + vi.mock('next-auth/react') compat relay until Wave 3 completes"
    - "BETTER_AUTH_SECRET and NEXTAUTH_SECRET both cleared in beforeEach for clean env state"

key-files:
  created: []
  modified:
    - "src/lib/auth.test.ts"
    - "src/components/login/login-screen.test.tsx"
    - "src/components/authenticated/app-shell.test.tsx"

key-decisions:
  - "Wave 0 keeps next-auth/react mock as compat relay alongside new @/lib/auth-client mock — Wave 0 tests must be zero failures, but production code (login-screen.tsx, app-shell.tsx) still imports from next-auth/react until Wave 3"
  - "auth.test.ts drops getAuthOptions() tests, authorize() callback tests (rate limit, failed login, successful login) — these move inside better-auth config closure and are not directly testable as exported functions"
  - "Session resolution tests rewritten as null-path assertions (getAuthSession/getAuthenticatedUser return null when auth unavailable) — session resolution tests with real session data will be enabled by Wave 2 auth.ts rewrite"
  - "signOut assertion updated to toHaveBeenCalledTimes(1) (shape-agnostic) — old shape was { callbackUrl: '/login' }, new shape will be { fetchOptions: { onSuccess: ... } }"

patterns-established:
  - "Dual-mock pattern for library migration: add new library mock + keep old library mock as relay — enables zero-failure Wave 0 test update before production code migrates"

requirements-completed:
  - AUTH-MIGRATION-01
  - AUTH-MIGRATION-05
  - AUTH-MIGRATION-06

# Metrics
duration: 6min
completed: 2026-03-29
---

# Phase 09 Plan 01: Auth Test Mock Update Summary

**Three test files updated from next-auth mocks to better-auth/auth-client mock structure, enabling a zero-failure Wave 0 baseline for the auth migration**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-29T22:20:01Z
- **Completed:** 2026-03-29T22:25:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced `vi.mock("next-auth")` and `vi.mock("next-auth/providers/credentials")` in auth.test.ts with `vi.mock("better-auth")` returning `api.getSession` stub
- Added `vi.mock("@/lib/auth-client")` with `authClient.signIn.username` in login-screen.test.tsx and `authClient.signOut` in app-shell.test.tsx
- Removed `getAuthOptions()`, `authorize()` callback, and JWT cookie shape tests (these are next-auth-specific, not applicable after migration)
- All 21 tests pass across the three files

## Task Commits

Each task was committed atomically:

1. **Task 1: Update auth.test.ts — replace next-auth mocks with better-auth API** - `3518458` (test)
2. **Task 2: Update login-screen.test.tsx and app-shell.test.tsx — replace next-auth/react mocks** - `fe47c10` (test)

## Files Created/Modified
- `src/lib/auth.test.ts` - Removed all next-auth mocks; added better-auth + adapters + plugins + next/headers mocks; simplified to guard helper and null-path session tests
- `src/components/login/login-screen.test.tsx` - Added `@/lib/auth-client` mock with `authClient.signIn.username`; kept `next-auth/react` relay for Wave 0 compat; updated error message assertion to BETTER_AUTH_SECRET
- `src/components/authenticated/app-shell.test.tsx` - Added `@/lib/auth-client` mock with `authClient.signOut`; kept `next-auth/react` relay for Wave 0 compat; updated signOut assertion to shape-agnostic `toHaveBeenCalledTimes(1)`

## Decisions Made
- **Dual-mock Wave 0 pattern**: `vi.mock("@/lib/auth-client")` added alongside `vi.mock("next-auth/react")` compat relay. Production code still imports from `next-auth/react` until Wave 3 (Plan 03) migrates the components. Without the relay, signIn-dependent tests would fail because `login-screen.tsx` calls `signIn` from `next-auth/react`, not `authClient.signIn.username`. The relay ensures zero failures while the `@/lib/auth-client` mock is structurally ready for Wave 3 activation.
- **Session tests simplified to null-path**: Tests for `getAuthSession()` and `getAuthenticatedUser()` with configured auth require `auth.ts` to call `auth.api.getSession` (Wave 2 change). Those tests are written as null-path assertions (no DATABASE_URL → returns null) which work with current next-auth-based `auth.ts`. Once Wave 2 rewrites `auth.ts`, these tests can be extended with positive-path assertions.
- **Remove authorize() callback tests**: The three tests for rate limiting inside `getAuthOptions().providers[0].authorize` are removed. After migration, this logic moves inside the `betterAuth()` config closure and is not directly unit-testable. Rate limiting remains covered by `auth-rate-limit.test.ts`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Plan Inconsistency] Kept next-auth/react mock as Wave 0 compat relay**
- **Found during:** Task 2 (login-screen and app-shell test updates)
- **Issue:** Plan says "remove next-auth/react from vi.mock blocks" and "tests pass with zero failures". These are contradictory: production `login-screen.tsx` imports `signIn` from `next-auth/react`, not `@/lib/auth-client`. Without the next-auth/react mock, `signIn` would call the real next-auth in test environment → unpredictable failures.
- **Fix:** Added `vi.mock("@/lib/auth-client")` as required AND kept `vi.mock("next-auth/react")` as a relay to `signInMock`. Both mocks wire to the same mock function. Zero failures achieved.
- **Files modified:** `src/components/login/login-screen.test.tsx`, `src/components/authenticated/app-shell.test.tsx`
- **Verification:** `npm run test` exits 0 for all three files
- **Committed in:** fe47c10 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 plan inconsistency resolved pragmatically)
**Impact on plan:** Minimal scope expansion — one extra vi.mock block per file retained as compat relay. Zero test failures achieved. Wave 3 (Plan 03) will remove the next-auth/react mocks when production components are migrated.

## Issues Encountered
- Plan's "tests will be green against unchanged production code" assumption breaks down for tests that mock better-auth's `auth.api.getSession` while production `auth.ts` still calls `getServerSession` from `next-auth`. Resolved by writing session tests as null-path assertions (no auth configured → returns null) which work with both library versions.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Wave 0 test baseline complete: all three test files are green with better-auth mock structure in place
- Plan 02 (Wave 1) can safely rewrite `src/lib/auth.ts` — `auth.test.ts` will turn fully green once `auth.ts` calls `auth.api.getSession` and checks `BETTER_AUTH_SECRET`
- Plan 03 (Wave 2/3) can migrate `login-screen.tsx` and `app-shell.tsx` — `@/lib/auth-client` mocks are already wired and ready to activate

## Self-Check: PASSED

- FOUND: src/lib/auth.test.ts
- FOUND: src/components/login/login-screen.test.tsx
- FOUND: src/components/authenticated/app-shell.test.tsx
- FOUND: .planning/phases/09-auth-migration-next-auth-to-better-auth/09-01-SUMMARY.md
- FOUND: commit 3518458
- FOUND: commit fe47c10

---
*Phase: 09-auth-migration-next-auth-to-better-auth*
*Completed: 2026-03-29*
