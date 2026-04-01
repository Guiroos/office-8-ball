---
phase: 09-auth-migration-next-auth-to-better-auth
plan: "04"
subsystem: auth
tags: [better-auth, next-auth, middleware, proxy, route-handler, env, ci]

# Dependency graph
requires:
  - phase: 09-auth-migration-next-auth-to-better-auth
    provides: auth-client.ts and component migration (plan 09-03)

provides:
  - proxy.ts at project root replacing middleware.ts with better-auth session cookie check
  - src/app/api/auth/[...all]/route.ts replacing [...nextauth] route handler
  - NEXTAUTH_SECRET renamed to BETTER_AUTH_SECRET in all env example files and CI workflows
  - next-auth fully removed from runtime codebase (no imports, no route handlers, no type files)
  - human-verified end-to-end auth flows (login, session persistence, sign-out, redirect guard)

affects:
  - vinext migration
  - CI/CD pipeline (requires GitHub secret rename: NEXTAUTH_SECRET -> BETTER_AUTH_SECRET)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "proxy.ts as middleware replacement: getSessionCookie cookie-presence check, mirrors withAuth security model"
    - "toNextJsHandler(auth) wrapping in catch-all [...all] route"
    - "BETTER_AUTH_SECRET replacing NEXTAUTH_SECRET in all env and CI files"

key-files:
  created:
    - proxy.ts
    - src/app/api/auth/[...all]/route.ts
  modified:
    - src/lib/auth.ts
    - .env.example
    - .env.preview.example
    - .env.production.example
    - .github/workflows/ci.yml
    - .github/workflows/e2e.yml
    - .github/workflows/deploy-production-tag.yml

key-decisions:
  - "proxy.ts uses getSessionCookie for cookie-presence check only — actual session validation stays in getAuthenticatedUser() on every API route, matching the previous withAuth security model"
  - "NEXTAUTH_SECRET renamed to BETTER_AUTH_SECRET in all env example and CI workflow files; GitHub Actions secret requires manual rename in repo settings (Settings -> Secrets -> Actions)"

patterns-established:
  - "better-auth middleware pattern: import getSessionCookie from better-auth/cookies, check presence, redirect to /login if absent"
  - "better-auth route handler pattern: toNextJsHandler(auth) exported as GET and POST from catch-all route"

requirements-completed:
  - AUTH-MIGRATION-07
  - AUTH-MIGRATION-08

# Metrics
duration: ~40min
completed: "2026-03-29"
---

# Phase 09 Plan 04: Final better-auth Wiring Summary

**proxy.ts replaces middleware.ts with better-auth cookie check; [...all] route handler replaces [...nextauth]; next-auth fully removed from runtime codebase and CI — human-verified auth flows pass end-to-end**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-03-29T22:40:00Z
- **Completed:** 2026-03-29T23:20:00Z
- **Tasks:** 3 auto + 1 checkpoint
- **Files modified:** 10

## Accomplishments

- proxy.ts created at project root with `getSessionCookie` guard and same matcher as deleted middleware.ts
- [...all] catch-all route handler created with `toNextJsHandler(auth)`; [...nextauth] folder and next-auth.d.ts deleted
- NEXTAUTH_SECRET renamed to BETTER_AUTH_SECRET in all three env example files and all three CI workflow files
- Full test suite (21 tests), typecheck, and build all pass with zero next-auth imports remaining in src/
- Human checkpoint approved: login, session persistence, sign-out, and redirect guard all verified end-to-end

## Task Commits

Each task was committed atomically:

1. **Task 1: Create proxy.ts, delete middleware.ts, create [...all] route, delete next-auth files** - `4536d48` (feat)
2. **Task 2: Rename NEXTAUTH_SECRET to BETTER_AUTH_SECRET in env files and CI workflows** - `1727742` (chore)
3. **Task 3: Full suite verification — tests, typecheck, build** - `d1026f3` (fix)
4. **Post-checkpoint fix: Remove id field from migration hook account creation** - `0d52b67` (fix)

## Files Created/Modified

- `proxy.ts` - Next.js middleware replacement using better-auth `getSessionCookie`; same route matcher as old middleware.ts
- `src/app/api/auth/[...all]/route.ts` - better-auth catch-all route handler via `toNextJsHandler(auth)`
- `src/lib/auth.ts` - Removed `id: crypto.randomUUID()` from migration hook account creation data
- `.env.example` - NEXTAUTH_SECRET → BETTER_AUTH_SECRET; NEXTAUTH_URL removed
- `.env.preview.example` - NEXTAUTH_SECRET → BETTER_AUTH_SECRET; NEXTAUTH_URL removed
- `.env.production.example` - NEXTAUTH_SECRET → BETTER_AUTH_SECRET; NEXTAUTH_URL removed
- `.github/workflows/ci.yml` - NEXTAUTH_SECRET → BETTER_AUTH_SECRET
- `.github/workflows/e2e.yml` - NEXTAUTH_SECRET → BETTER_AUTH_SECRET; NEXTAUTH_URL removed
- `.github/workflows/deploy-production-tag.yml` - NEXTAUTH_SECRET → BETTER_AUTH_SECRET (uses secret reference)

## Decisions Made

- `proxy.ts` uses `getSessionCookie` for cookie-presence check only — actual session validation remains in `getAuthenticatedUser()` on every protected API route. This mirrors the security model of the previous `withAuth` middleware (which also checked cookie signature but not full session validity).
- GitHub Actions secret rename (`NEXTAUTH_SECRET` → `BETTER_AUTH_SECRET`) is a manual step in repo Settings → Secrets; cannot be automated via file edits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed id field from migration hook account creation**
- **Found during:** Post-checkpoint (after human verification approved)
- **Issue:** `id: crypto.randomUUID()` was included in the account creation data passed to `ctx.context.adapter.create()`. better-auth generates IDs automatically via the adapter — passing an explicit `id` caused duplicate key errors on account creation for migrating next-auth users.
- **Fix:** Removed the `id: crypto.randomUUID()` line from the data object in `migrationMiddleware`
- **Files modified:** `src/lib/auth.ts`
- **Verification:** Fix applied and committed; auth flows verified end-to-end at checkpoint
- **Committed in:** `0d52b67` (post-checkpoint fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Fix required for correct migration hook behavior; no scope creep.

## Issues Encountered

None during planned tasks. The `id` field fix was a correctness issue in the migration hook discovered during manual end-to-end verification.

## User Setup Required

**Manual action required:** Rename the GitHub Actions secret `NEXTAUTH_SECRET` to `BETTER_AUTH_SECRET` in the repository settings (Settings → Secrets and variables → Actions). This is required for CI/CD to continue working after merging this branch. The CI workflow files now reference `${{ secrets.BETTER_AUTH_SECRET }}` instead of `${{ secrets.NEXTAUTH_SECRET }}`.

## Known Stubs

None.

## Next Phase Readiness

- Phase 09 complete: better-auth is fully wired. next-auth has zero presence in src/ (no imports, no route handlers, no type files).
- vinext migration can proceed — auth layer is now better-auth native.
- Reminder: rename GitHub secret before merging to master to keep CI green.

---
*Phase: 09-auth-migration-next-auth-to-better-auth*
*Completed: 2026-03-29*

## Self-Check: PASSED

- FOUND: `.planning/phases/09-auth-migration-next-auth-to-better-auth/09-04-SUMMARY.md`
- FOUND: commit `4536d48` (feat - proxy.ts, [...all] route, delete next-auth files)
- FOUND: commit `1727742` (chore - rename NEXTAUTH_SECRET to BETTER_AUTH_SECRET)
- FOUND: commit `d1026f3` (fix - test update for BETTER_AUTH_SECRET)
- FOUND: commit `0d52b67` (fix - remove id field from migration hook)
- FOUND: commit `31473d6` (docs - SUMMARY.md and state metadata)
