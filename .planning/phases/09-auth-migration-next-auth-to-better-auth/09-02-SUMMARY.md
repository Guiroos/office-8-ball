---
phase: 09-auth-migration-next-auth-to-better-auth
plan: 02
subsystem: auth
tags: [better-auth, prisma, bcryptjs, session, account, migration]

# Dependency graph
requires:
  - phase: 09-01
    provides: "Wave 0 test mock updates — auth.test.ts already mocking better-auth"
provides:
  - "better-auth installed, next-auth removed from package.json"
  - "Session and Account models in prisma/schema.prisma with migration applied"
  - "src/lib/auth.ts rewritten with better-auth server singleton"
  - "All guard helpers preserved: hasDatabaseUrl, hasAuthSecret, isAuthAvailable, getAuthUnavailableError, getAuthUnavailableResponse, getAuthRequiredResponse"
  - "hasAuthSecret() checks BETTER_AUTH_SECRET instead of NEXTAUTH_SECRET"
  - "getAuthSession() uses auth.api.getSession({ headers: await headers() })"
  - "getAuthenticatedUser() reads session.user.{id,username} from better-auth session"
  - "Migration hook: createAuthMiddleware intercepts /sign-in/username to seed accounts table from User.passwordHash for existing next-auth users"
affects:
  - "09-03 (login-screen + api/auth route migration — uses auth export)"
  - "09-04 (cleanup — removes leftover next-auth/react imports and next-auth.d.ts)"
  - "middleware.ts (still imports next-auth/middleware — to be replaced in Plan 03)"

# Tech tracking
tech-stack:
  added: ["better-auth ^1.5.6", "better-auth/adapters/prisma", "better-auth/plugins (username)", "better-auth/api (createAuthMiddleware)"]
  patterns:
    - "betterAuth singleton at module level — imported as `auth` across routes"
    - "prismaAdapter(prisma, { provider: 'postgresql' }) — database layer"
    - "username plugin — enables /sign-in/username endpoint with username field on session"
    - "Migration hook pattern — createAuthMiddleware intercepts sign-in to seed account records for legacy users"

key-files:
  created:
    - "prisma/migrations/20260329223001_add_better_auth_tables/migration.sql"
  modified:
    - "src/lib/auth.ts"
    - "prisma/schema.prisma"
    - "package.json"
    - "package-lock.json"

key-decisions:
  - "Migration hook (createAuthMiddleware on /sign-in/username) seeds account.password from User.passwordHash for existing users — enables seamless first sign-in after migration"
  - "password.verify uses standard bcrypt compare against account.password (account is populated by migration hook before the username plugin checks it)"
  - "session.user.username cast via `as any` temporarily — better-auth username plugin adds the field but types not yet augmented (deferred to Plan 04)"
  - "getAuthOptions() removed — was next-auth specific; `auth` export replaces it for route handlers"

patterns-established:
  - "better-auth server singleton: import { auth } from '@/lib/auth' for session access"
  - "Guard helpers unchanged: isAuthAvailable(), getAuthRequiredResponse(), getAuthUnavailableResponse() signatures preserved"

requirements-completed:
  - AUTH-MIGRATION-01
  - AUTH-MIGRATION-02
  - AUTH-MIGRATION-03
  - AUTH-MIGRATION-04

# Metrics
duration: 6min
completed: 2026-03-29
---

# Phase 09 Plan 02: Auth Migration Core Library Swap Summary

**better-auth installed, next-auth removed; src/lib/auth.ts rewritten with betterAuth singleton + prismaAdapter + username plugin + migration hook for existing users; Session/Account tables added to Prisma schema with migration applied**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-29T22:28:55Z
- **Completed:** 2026-03-29T22:34:44Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Replaced next-auth ^4.24.13 with better-auth ^1.5.6; all guard helper signatures preserved
- Added Session and Account Prisma models; migration `add-better-auth-tables` applied to DB
- Rewrote src/lib/auth.ts: betterAuth singleton with prismaAdapter, username plugin, migration hook, bcrypt verify, getAuthSession/getAuthenticatedUser
- auth.test.ts: 5/5 tests pass; auth.ts has zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install better-auth, uninstall next-auth, add Prisma models** - `aafcc29` (chore)
2. **Task 2: Rewrite src/lib/auth.ts with better-auth configuration** - `0b130de` (feat)

**Plan metadata:** (pending — created below)

## Files Created/Modified

- `package.json` / `package-lock.json` — better-auth added, next-auth removed
- `prisma/schema.prisma` — Session and Account models added; User gets sessions/accounts back-relations
- `prisma/migrations/20260329223001_add_better_auth_tables/migration.sql` — CREATE TABLE sessions, CREATE TABLE accounts
- `src/lib/auth.ts` — complete rewrite: betterAuth + prismaAdapter + username plugin + migration hook

## Decisions Made

1. **Migration hook via createAuthMiddleware** — The better-auth username plugin reads `account.password` from the accounts table before calling `password.verify`. Existing next-auth users have no account record. A `hooks.before` middleware intercepts `/sign-in/username` and creates the account row from `User.passwordHash` on first sign-in. This ensures seamless migration without requiring users to reset their passwords.

2. **password.verify is standard bcrypt** — After the migration hook seeds the account record, `verify({ hash: account.password, password })` uses `compare(plaintext, storedHash)` — standard bcrypt path. No special userId lookup needed once account record exists.

3. **`session.user.username` cast via `as any`** — better-auth's username plugin adds `username` to session user at runtime but TypeScript types don't reflect it yet. Deferred to Plan 04 (type cleanup).

4. **`getAuthOptions()` removed** — Was next-auth-specific. The `auth` export (betterAuth singleton) replaces it. `[...nextauth]/route.ts` will be removed in Plan 03.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Migration hook implemented as createAuthMiddleware instead of plain object**

- **Found during:** Task 2 (auth.ts rewrite)
- **Issue:** Plan's `hooks.before` showed an array of `{ pathMatcher, handler }` objects but TypeScript typed `hooks.before` as `AuthMiddleware` (single function from `createAuthMiddleware`). The array approach caused type error TS2322.
- **Fix:** Replaced the array pattern with a single `createAuthMiddleware` call that checks `ctx.path === "/sign-in/username"` internally — same logic, correct type.
- **Files modified:** `src/lib/auth.ts`
- **Verification:** `npm run typecheck` — auth.ts has zero errors; auth.test.ts 5/5 pass
- **Committed in:** `0b130de` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — implementation type correction)
**Impact on plan:** Necessary for TypeScript compliance. Logic is identical — same migration behavior, correct API surface.

## Issues Encountered

- better-auth's username plugin reads `account.password` BEFORE calling `password.verify`, so the `verify` override alone cannot handle existing users with null `account.password`. The migration hook solves this by pre-populating the account record, keeping the verify function as standard bcrypt.

## User Setup Required

**Environment variable change required.** Rename `NEXTAUTH_SECRET` to `BETTER_AUTH_SECRET` in `.env` and production environment variables (Vercel dashboard). Also rename `NEXTAUTH_URL` to `BETTER_AUTH_URL` if set.

## Next Phase Readiness

- Plan 03: Migrate `/api/auth/[...nextauth]/route.ts` to better-auth route handler, update `middleware.ts` to use better-auth session check, migrate `login-screen.tsx` and `app-shell.tsx` to `@/lib/auth-client`
- Plan 04: Remove `src/types/next-auth.d.ts`, clean up `as any` casts, augment better-auth session types

---
*Phase: 09-auth-migration-next-auth-to-better-auth*
*Completed: 2026-03-29*
