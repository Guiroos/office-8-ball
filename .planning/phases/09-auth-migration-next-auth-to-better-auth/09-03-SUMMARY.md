---
phase: 09-auth-migration-next-auth-to-better-auth
plan: "03"
subsystem: auth-client
tags:
  - better-auth
  - client-migration
  - auth-client
dependency_graph:
  requires:
    - 09-02 (better-auth server-side core)
  provides:
    - auth-client singleton (src/lib/auth-client.ts)
    - login-screen migrated to authClient
    - app-shell migrated to authClient
  affects:
    - src/components/login/login-screen.tsx
    - src/components/authenticated/app-shell.tsx
tech_stack:
  added:
    - better-auth/react (createAuthClient)
    - better-auth/client/plugins (usernameClient)
  patterns:
    - authClient.signIn.username({ username, password }) for credential sign-in
    - authClient.signOut({ fetchOptions: { onSuccess } }) with manual router.push
key_files:
  created:
    - src/lib/auth-client.ts
  modified:
    - src/components/login/login-screen.tsx
    - src/components/authenticated/app-shell.tsx
decisions:
  - authClient error is typed as unknown — handle both string (test mock) and object (real better-auth) via typeof guard
  - router.refresh() removed from handleSubmit — better-auth sessions use cookies set by server response, no Next.js revalidation needed
  - useRouter added directly to UserMenu inner component (option b per plan) — avoids prop drilling
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-29"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 09 Plan 03: Auth Client Module + Component Migration Summary

**One-liner:** better-auth client singleton created and both client components (login-screen, app-shell) migrated from next-auth/react to authClient.signIn.username / authClient.signOut.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/lib/auth-client.ts | 1233045 | src/lib/auth-client.ts |
| 2 | Update login-screen.tsx and app-shell.tsx to use authClient | a747edf | src/components/login/login-screen.tsx, src/components/authenticated/app-shell.tsx |

## What Was Built

**src/lib/auth-client.ts** — New file. Single `authClient` export created via `createAuthClient` with `usernameClient` plugin. Defaults to `window.location.origin` for API calls (no explicit baseURL needed).

**login-screen.tsx** — Migrated from `signIn("credentials", { redirect: false })` to `authClient.signIn.username({ username, password })`. Error handling updated to work with both the test mock (string error) and real better-auth (object with `.message`). `router.refresh()` removed — not needed with better-auth cookie-based sessions.

**app-shell.tsx** — Migrated from `signOut({ callbackUrl })` to `authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })`. `useRouter` added to `UserMenu` inner component (option b from plan) for manual redirect on sign-out.

## Verification Results

```
Tests: 16 passed (16 total)
- login-screen.test.tsx: 11/11 pass
- app-shell.test.tsx: 5/5 pass

next-auth/react imports in production src/: 0
```

Typecheck: component-level errors for login-screen.tsx and app-shell.tsx resolved. Remaining errors are pre-existing from Plan 02 (`middleware.ts` and `[...nextauth]/route.ts`) — out of scope for this plan, handled by Plan 04.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Error type guard for string vs object error**

- **Found during:** Task 2
- **Issue:** Test mock returns `{ error: "AuthRateLimited" }` (string), but plan code used `error.message === AUTH_RATE_LIMIT_ERROR` which fails when error is a string (returns `undefined`).
- **Fix:** Added `typeof error === 'object' && 'message' in error` type guard — handles both string (test mock) and object (real better-auth error). `String(error)` fallback for string case.
- **Files modified:** src/components/login/login-screen.tsx
- **Commit:** a747edf

## Known Stubs

None — all auth flows are wired to real authClient calls.

## Self-Check: PASSED

Files exist:
- FOUND: src/lib/auth-client.ts
- FOUND: src/components/login/login-screen.tsx (modified)
- FOUND: src/components/authenticated/app-shell.tsx (modified)

Commits exist:
- FOUND: 1233045 (feat(09-03): create auth-client.ts)
- FOUND: a747edf (feat(09-03): migrate login-screen and app-shell)
