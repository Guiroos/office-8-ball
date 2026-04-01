# Phase 9: Auth Migration next-auth to better-auth — Context

**Gathered:** 2026-03-28 (assumptions mode — auto)
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the Auth.js v4 (`next-auth`) credentials stack with `better-auth`, preserving all existing auth behaviors: username/password login, user registration, JWT-compatible sessions, rate limiting, middleware-based route protection, and the `DATABASE_URL` guard pattern. No new auth features are introduced; this is a drop-in library swap.
</domain>

<decisions>
## Implementation Decisions

### Auth Provider & Credentials
- **D-01:** Use better-auth's `username` plugin to support username-based login (not email). The current system uses `username` as the primary identifier — no change to the user-facing login form.
- **D-02:** Preserve bcryptjs password hashing. better-auth supports custom password hashing via a `password` option — wire it to use the same bcrypt hashing so existing password hashes remain valid.

### Session Strategy
- **D-03:** Switch from JWT sessions to better-auth database sessions. better-auth manages sessions in a `session` table natively. This is more secure than stateless JWT and aligns with better-auth's default. The `SessionUser` shape (`id`, `username`) must remain identical.
- **D-04:** Session cookie configuration (httpOnly, sameSite: lax, path: /, secure in production) must be preserved. better-auth handles cookie config via its options.

### Schema Changes
- **D-05:** New Prisma tables required: `session` (better-auth session store) and `account` (better-auth account link, needed even for credential-only auth). The existing `User` table is adapted — better-auth can map to an existing user model.
- **D-06:** The `AuthRateLimit` table stays unchanged. Rate limiting is NOT migrated to better-auth's built-in — we preserve the custom Prisma-based implementation (well-tested, project-specific logic).
- **D-07:** Schema change requires a new Prisma migration. This is explicitly approved as part of this migration request.

### Register Route
- **D-08:** Keep the custom `/api/auth/register` POST route at its current path. Do NOT delegate registration to better-auth's built-in sign-up endpoint. This preserves the existing API contract (validation, field errors, 409 conflict, 201 response shape) and keeps `auth-rate-limit` wired for registration.

### `DATABASE_URL` Guard
- **D-09:** Preserve all guard helpers in `src/lib/auth.ts`: `hasDatabaseUrl()`, `isAuthAvailable()`, `getAuthUnavailableResponse()`, `getAuthRequiredResponse()`. These are called by every API route — the pattern must survive the migration unchanged.
- **D-10:** Middleware must still pass-through when `DATABASE_URL` is absent. Replace `withAuth` from `next-auth/middleware` with better-auth middleware, preserving the conditional `authRequired` logic.

### Client-Side Auth
- **D-11:** Replace `signIn("credentials", ...)` from `next-auth/react` in `login-screen.tsx` with better-auth's client `signIn.email` or equivalent credentials call. The form UI is unchanged.
- **D-12:** Replace `useSession()` / `SessionProvider` from `next-auth/react` with better-auth's `useSession()` client hook. Session shape (`user.id`, `user.username`) must stay identical so all components that read session data require zero changes.

### Type Augmentation
- **D-13:** Remove `src/types/next-auth.d.ts`. Replace with better-auth's type system — use `auth.$Infer.Session` to derive session types. The exported `SessionUser` type in `src/lib/types.ts` must remain unchanged.

### Test Isolation
- **D-14:** All unit tests mock `@/lib/auth` (stub `getAuthenticatedUser`). The mock contract doesn't change — only the implementation of the real module changes. Test files themselves need no updates.

### Claude's Discretion
- Exact better-auth version to install (use latest stable at time of implementation)
- Whether to use better-auth's `nextjs` adapter or the generic `node` adapter
- Internal structure of the new `src/lib/auth.ts` (as long as exported function signatures are preserved)
- Prisma migration file naming
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Auth Implementation
- `src/lib/auth.ts` — Full auth config: `getAuthOptions`, `getAuthSession`, `getAuthenticatedUser`, guard helpers
- `src/lib/auth-rate-limit.ts` — Custom Prisma-based rate limiting (to be preserved as-is)
- `src/lib/auth-validation.ts` — Zod schemas for login/register payloads (unchanged)
- `src/app/api/auth/[...nextauth]/route.ts` — Current NextAuth handler (to be replaced)
- `src/app/api/auth/register/route.ts` — Custom register route (to be preserved)
- `middleware.ts` — Route protection (to be migrated from `withAuth`)
- `src/types/next-auth.d.ts` — Session type augmentation (to be replaced)

### Client-Side Auth Usage
- `src/components/login/login-screen.tsx` — Uses `signIn("credentials", ...)` from `next-auth/react`
- `src/components/authenticated/app-shell.tsx` — Likely uses `useSession()` or session props

### Schema
- `prisma/schema.prisma` — `User`, `AuthRateLimit` models (reference for adapter mapping)

### Architecture Constraints
- `.claude/rules/architecture.md` — No new services, DATABASE_URL guard, schema change rules
- `.claude/rules/auth.md` — Auth constraints (if exists)
- `CLAUDE.md` — "Never modify prisma/schema.prisma without explicit approval" (approved for this phase)

### Better-Auth Migration Guide
- https://authjs.dev/getting-started/migrate-to-better-auth — Official migration guide referenced by vinext check report
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/auth-rate-limit.ts` — Fully reusable; no next-auth dependency; keeps working after migration
- `src/lib/auth-validation.ts` — Fully reusable; pure Zod schemas; no auth library dependency
- `src/lib/prisma.ts` — Prisma client singleton; better-auth will use the same client
- `src/app/api/auth/register/route.ts` — Reusable with minimal changes (replace `isAuthAvailable` import, no other next-auth deps)

### Established Patterns
- `getAuthenticatedUser()` → called by every protected API route; must preserve exact signature and return type (`SessionUser | null`)
- `getAuthRequiredResponse()` / `getAuthUnavailableResponse()` → standard 401/503 response helpers; all routes depend on these
- `hasDatabaseUrl()` → feature flag for disabling auth in dev; middleware reads this at module init
- Error messages in Brazilian Portuguese (e.g., `AUTH_UNAVAILABLE_DATABASE_ERROR`, `AUTH_REQUIRED_ERROR`)

### Integration Points
- `middleware.ts` — single file; replace `withAuth` import; keep matcher config unchanged
- `src/app/api/auth/[...nextauth]/route.ts` — replace with better-auth's `handler`
- `src/components/login/login-screen.tsx` — replace `signIn` import only; form logic unchanged
- `src/components/authenticated/app-shell.tsx` — may need session hook replacement
- All API routes that call `getAuthenticatedUser()` — zero changes needed if function signature preserved
</code_context>

<specifics>
## Specific Ideas

- The register flow is: POST `/api/auth/register` → validate → rate-limit → create user → `signIn("credentials")` auto-login. After migration, the auto-login step must use better-auth's client sign-in instead of next-auth's.
- Session shape used throughout the app: `{ id: string, username: string, displayName: string | null, avatarUrl: string | null }`. This is the `SessionUser` type from `src/lib/types.ts` — must not change.
- The `__dirname` / `__filename` issue in `vitest.config.ts` flagged by `vinext check` should be fixed in this phase (or a separate quick fix) — it's a CJS→ESM issue that `vinext init` can't auto-fix.
</specifics>

<deferred>
## Deferred Ideas

- Running `vinext init` after better-auth migration is complete — that is Phase 10 (the actual vinext swap)
- Migrating rate limiting to better-auth's built-in system — out of scope; custom implementation stays
- Adding OAuth providers (Google, GitHub) — explicitly out of scope for v1 (credentials-only)
- None — discussion stayed within phase scope
</deferred>

---

*Phase: 09-auth-migration-next-auth-to-better-auth*
*Context gathered: 2026-03-28*
