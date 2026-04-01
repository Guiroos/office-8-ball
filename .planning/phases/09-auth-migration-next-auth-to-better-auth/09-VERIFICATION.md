---
phase: 09-auth-migration-next-auth-to-better-auth
verified: 2026-03-29T23:04:58Z
status: passed
score: 7/7 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Sign-in with existing bcrypt-hashed password (legacy next-auth user)"
    expected: "User can log in with existing credentials; session persists across page reload"
    why_human: "Migration hook seeds account record from User.passwordHash on first sign-in — requires live DB and existing user row. Already verified at Plan 04 checkpoint."
  - test: "Sign-out redirects to /login"
    expected: "Clicking 'Sair' calls authClient.signOut; onSuccess callback fires router.push('/login')"
    why_human: "onSuccess callback is a closure; cannot be verified with grep alone. Already verified at Plan 04 checkpoint."
  - test: "Unauthenticated GET /dashboard redirects to /login"
    expected: "proxy.ts getSessionCookie check redirects browser to /login when no session cookie is present"
    why_human: "Requires running dev server. Already verified at Plan 04 checkpoint."
---

# Phase 09: Auth Migration next-auth to better-auth — Verification Report

**Phase Goal:** Replace next-auth 4.24.13 with better-auth, preserving all existing auth behaviors: username/password login, database sessions, rate limiting, middleware-based route protection, and the DATABASE_URL guard pattern.

**Verified:** 2026-03-29T23:04:58Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | better-auth installed; next-auth fully removed from dependencies and source | VERIFIED | `package.json` has `"better-auth": "^1.5.6"`; no `next-auth` in deps; zero `from "next-auth"` imports in `src/` |
| 2 | Username/password login works with existing bcrypt-hashed passwords (no data migration) | VERIFIED | Migration hook in `auth.ts` seeds `accounts.password` from `User.passwordHash` on first sign-in via `createAuthMiddleware`; `password.verify` uses standard `compare(plaintext, storedHash)` |
| 3 | Sessions stored in database; session shape `{ id, username }` preserved for all consumers | VERIFIED | `prisma/schema.prisma` has `model Session`; `getAuthenticatedUser()` reads `session.user.{id, username}`; `SessionUser` type in `types.ts` unchanged |
| 4 | DATABASE_URL guard helpers preserved with identical signatures; routes return 503 without DB | VERIFIED | `hasDatabaseUrl`, `hasAuthSecret`, `isAuthAvailable`, `getAuthUnavailableError`, `getAuthUnavailableResponse`, `getAuthRequiredResponse` all exported with matching signatures; `hasAuthSecret()` now checks `BETTER_AUTH_SECRET` |
| 5 | Client-side auth via @/lib/auth-client; no next-auth/react imports remain in production source | VERIFIED | `src/lib/auth-client.ts` exists; `login-screen.tsx` and `app-shell.tsx` both import from `@/lib/auth-client`; zero `from "next-auth/react"` in production files |
| 6 | proxy.ts replaces middleware.ts with same route matcher config | VERIFIED | `proxy.ts` exists at project root with `getSessionCookie` guard; `middleware.ts` deleted; matcher identical (7 routes) |
| 7 | npm run test passes; npm run typecheck passes; npm run build succeeds | VERIFIED | 21/21 tests pass; `tsc --noEmit` exits 0 with zero errors; build verified at Plan 04 checkpoint |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/auth.ts` | better-auth server instance + all guard helpers | VERIFIED | Exports `auth`, `hasDatabaseUrl`, `hasAuthSecret`, `isAuthAvailable`, `getAuthUnavailableError`, `getAuthUnavailableResponse`, `getAuthRequiredResponse`, `getAuthSession`, `getAuthenticatedUser`. No next-auth imports. |
| `src/lib/auth-client.ts` | better-auth client singleton with username plugin | VERIFIED | Exports `authClient` via `createAuthClient({ plugins: [usernameClient()] })` |
| `proxy.ts` | Route protection via getSessionCookie | VERIFIED | `getSessionCookie(request)` check; redirects to `/login` on absence; same matcher as deleted `middleware.ts` |
| `src/app/api/auth/[...all]/route.ts` | better-auth handler for all /api/auth/* requests | VERIFIED | `export const { POST, GET } = toNextJsHandler(auth)` |
| `prisma/schema.prisma` | Session and Account models for better-auth | VERIFIED | `model Session` and `model Account` present; User has `sessions Session[]` and `accounts Account[]` back-relations |
| `prisma/migrations/20260329223001_add_better_auth_tables/` | Migration adding session and account tables | VERIFIED | Directory exists |
| `src/lib/auth.test.ts` | Updated auth test — mocks better-auth, preserves guard helper assertions | VERIFIED | `vi.mock("better-auth", ...)` with `api.getSession` stub; `BETTER_AUTH_SECRET` in env cleanup; 5/5 tests pass |
| `src/components/login/login-screen.test.tsx` | Updated login test — mocks @/lib/auth-client | VERIFIED | `vi.mock("@/lib/auth-client", ...)` with `authClient.signIn.username` stub; 11/11 tests pass |
| `src/components/authenticated/app-shell.test.tsx` | Updated app-shell test — mocks @/lib/auth-client signOut | VERIFIED | `vi.mock("@/lib/auth-client", ...)` with `authClient.signOut` stub; 5/5 tests pass |

**Deleted as required:**

| Artifact | Expected State | Status |
|----------|---------------|--------|
| `middleware.ts` | Deleted | VERIFIED — absent |
| `src/app/api/auth/[...nextauth]/route.ts` | Deleted | VERIFIED — directory `[...nextauth]` absent |
| `src/types/next-auth.d.ts` | Deleted | VERIFIED — `src/types/` directory empty |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/lib/auth.ts` | prisma (User model) | `prismaAdapter(prisma, { provider: 'postgresql' })` | WIRED | Line 103 in auth.ts |
| `src/lib/auth.ts` | bcryptjs | `compare(plaintext, storedHash)` in `password.verify` | WIRED | Lines 117-118 in auth.ts |
| `getAuthenticatedUser()` | `auth.api.getSession` | `await auth.api.getSession({ headers: await headers() })` | WIRED | Line 142 in auth.ts |
| `src/components/login/login-screen.tsx` | `src/lib/auth-client.ts` | `import { authClient } from "@/lib/auth-client"` + `authClient.signIn.username(...)` | WIRED | Lines 5, 168, 184 in login-screen.tsx |
| `src/components/authenticated/app-shell.tsx` | `src/lib/auth-client.ts` | `import { authClient } from "@/lib/auth-client"` + `authClient.signOut(...)` | WIRED | Lines 6, 207 in app-shell.tsx |
| `proxy.ts` | `better-auth/cookies` | `getSessionCookie(request)` | WIRED | Line 11 in proxy.ts |
| `src/app/api/auth/[...all]/route.ts` | `src/lib/auth.ts` | `toNextJsHandler(auth)` | WIRED | Lines 1-4 in route.ts |
| `.env.example` | `BETTER_AUTH_SECRET` | Variable rename from `NEXTAUTH_SECRET` | VERIFIED | Line 9 in .env.example |
| `.github/workflows/ci.yml` | `BETTER_AUTH_SECRET` | `BETTER_AUTH_SECRET: ci-test-secret` | VERIFIED | Line 43 |
| `.github/workflows/e2e.yml` | `BETTER_AUTH_SECRET` | `BETTER_AUTH_SECRET: e2e-test-secret` | VERIFIED | Line 41 |
| `.github/workflows/deploy-production-tag.yml` | `BETTER_AUTH_SECRET` | `${{ secrets.BETTER_AUTH_SECRET }}` | VERIFIED | Line 24 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `getAuthenticatedUser()` in `auth.ts` | `session` from `auth.api.getSession` | `auth.api.getSession({ headers: await headers() })` — better-auth reads session cookie, queries `sessions` table | Yes — queries DB via better-auth | FLOWING |
| `getAuthenticatedUser()` — profile enrichment | `profile` from `prisma.user.findUnique` | `prisma.user.findUnique({ where: { id: sessionUser.id }, select: { displayName, avatarUrl } })` | Yes — real DB query | FLOWING |
| Migration hook in `auth.ts` | `user` / `dbUser` | `ctx.context.adapter.findOne` + `prisma.user.findUnique` for `passwordHash` | Yes — DB lookups on sign-in path | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| auth.test.ts all pass | `npm run test -- src/lib/auth.test.ts` | 5/5 pass | PASS |
| login-screen.test.tsx all pass | `npm run test -- src/components/login/login-screen.test.tsx` | 11/11 pass | PASS |
| app-shell.test.tsx all pass | `npm run test -- src/components/authenticated/app-shell.test.tsx` | 5/5 pass | PASS |
| TypeScript zero errors | `npm run typecheck` | exits 0, no errors | PASS |
| No next-auth imports in production src/ | `grep -r 'from "next-auth"' src/ --include="*.ts" --include="*.tsx"` | empty output | PASS |
| next-auth absent from package.json | `grep '"next-auth"' package.json` | no match | PASS |
| proxy.ts present, middleware.ts absent | `ls proxy.ts middleware.ts` | proxy.ts found, middleware.ts absent | PASS |
| better-auth auth route exists | `ls src/app/api/auth/[...all]/route.ts` | found | PASS |

---

### Requirements Coverage

Requirements are defined in ROADMAP.md under Phase 9. REQUIREMENTS.md does not contain AUTH-MIGRATION entries separately — they are tracked in the roadmap.

| Requirement | Source Plans | Description (from roadmap context) | Status |
|-------------|-------------|-------------------------------------|--------|
| AUTH-MIGRATION-01 | 09-01, 09-02 | better-auth installed; next-auth removed | SATISFIED |
| AUTH-MIGRATION-02 | 09-02 | Prisma Session + Account models added with migration | SATISFIED |
| AUTH-MIGRATION-03 | 09-02 | Password migration hook for existing bcrypt users | SATISFIED |
| AUTH-MIGRATION-04 | 09-02 | Guard helpers preserved with identical signatures | SATISFIED |
| AUTH-MIGRATION-05 | 09-01, 09-03 | auth-client.ts created; login-screen.tsx migrated | SATISFIED |
| AUTH-MIGRATION-06 | 09-01, 09-03 | app-shell.tsx migrated; no next-auth/react in production | SATISFIED |
| AUTH-MIGRATION-07 | 09-04 | proxy.ts replaces middleware.ts; same route matcher | SATISFIED |
| AUTH-MIGRATION-08 | 09-04 | [...all] route handler + env/CI secret rename | SATISFIED |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/auth.ts` | 149 | `(session as any)?.user` — TypeScript `as any` cast for session user | Info | Type safety gap for `session.user.username` (username plugin adds field at runtime but types not augmented). Deferred intentionally to post-migration cleanup per Plan 04 decision notes. Does not affect runtime behavior. |
| `src/components/login/login-screen.test.tsx` | 36-38 | `vi.mock("next-auth/react", ...)` — dead Wave 0 compat relay stub | Warning | next-auth is no longer installed; this mock is never invoked. Production `login-screen.tsx` imports from `@/lib/auth-client`. Dead code in test file, no functional impact. Tests pass because `signInMock` is also wired to the `@/lib/auth-client` mock (same function reference). |
| `src/components/authenticated/app-shell.test.tsx` | 48-50 | `vi.mock("next-auth/react", ...)` — dead Wave 0 compat relay stub | Warning | Same as above. Dead relay from Wave 0 migration prep. Never invoked. |
| `src/components/login/login-screen.test.tsx` | 59, 117 | `signInMock.mockResolvedValue({ ok: true, error: undefined })` — old next-auth response shape in test mock | Warning | Production code checks `if (error)` — `undefined` is falsy so tests pass. But the mock shape does not match the real better-auth response shape `{ data: ..., error: null }`. Tests pass but do not exercise the actual return structure. Low risk for current behavior; would mask regressions if `error: undefined` were treated differently from `error: null`. |

No blocker anti-patterns found. All warnings are test-layer issues with zero runtime impact.

---

### Human Verification Required

Human checkpoint was completed as part of Plan 04 and approved. The following items are documented for traceability:

#### 1. Sign-in with existing bcrypt-hashed password

**Test:** Log in with credentials that existed before migration (user row has `passwordHash` set, no `accounts` record).
**Expected:** Migration hook creates `accounts` record from `User.passwordHash`; login succeeds; session cookie set; user lands on `/dashboard`.
**Why human:** Requires live DB with existing user. Verified at Plan 04 checkpoint — approved.

#### 2. Sign-out redirects to /login

**Test:** Click "Sair" in the sidebar user menu.
**Expected:** `authClient.signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })` called; session cookie cleared; browser navigates to `/login`.
**Why human:** `onSuccess` callback is a closure; cookie invalidation requires live server. Verified at Plan 04 checkpoint — approved.

#### 3. Unauthenticated route redirect

**Test:** Visit `/dashboard` in an incognito window without a session.
**Expected:** `proxy.ts` detects no session cookie via `getSessionCookie`; redirects to `/login`.
**Why human:** Requires running dev server. Verified at Plan 04 checkpoint — approved.

#### 4. GitHub Actions secret rename (manual)

**Test:** Rename repo secret `NEXTAUTH_SECRET` → `BETTER_AUTH_SECRET` in GitHub Settings → Secrets → Actions.
**Expected:** CI/CD workflow `deploy-production-tag.yml` finds `secrets.BETTER_AUTH_SECRET` and does not fail with "secret not found".
**Why human:** GitHub repository secrets cannot be managed via file edits. Requires manual action in GitHub UI. Status: pending (flagged in Plan 04 SUMMARY as user action required).

---

### Gaps Summary

No gaps found. All 7 success criteria from ROADMAP.md are satisfied. All 8 AUTH-MIGRATION requirements are covered. All key artifacts exist and are substantively implemented and wired. The migration from next-auth to better-auth is complete.

**Open items (not blocking goal):**

1. **Dead test stubs** — `vi.mock("next-auth/react")` in `login-screen.test.tsx` and `app-shell.test.tsx` are Wave 0 compat relays that were supposed to be cleaned up in Wave 3 (Plan 03) but were retained. They are dead code — next-auth is not installed. Cleanup is safe and recommended but does not affect test results.

2. **Test mock shape mismatch** — `signInMock.mockResolvedValue({ ok: true, error: undefined })` uses old next-auth response shape. Better-auth returns `{ data: ..., error: null | { message: string } }`. Tests pass because production code only checks `if (error)`, and `undefined` is falsy. Recommend updating mocks to `{ data: {}, error: null }` for correctness signal, but not blocking.

3. **`as any` cast in auth.ts** — `(session as any)?.user` at line 149. Intentionally deferred to post-migration type cleanup. Better-auth username plugin adds `username` to session user at runtime but types don't expose it. Type augmentation work is out of scope for this phase.

4. **GitHub secret rename** — Manual action required (cannot be automated). Must be done before merging to master.

---

_Verified: 2026-03-29T23:04:58Z_
_Verifier: Claude (gsd-verifier)_
