# Phase 9: Auth Migration next-auth to better-auth — Research

**Researched:** 2026-03-28
**Domain:** better-auth, Next.js 16 App Router auth migration
**Confidence:** HIGH (core API), MEDIUM (username-only edge cases)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use better-auth's `username` plugin for username-based login (not email). Existing login form unchanged.
- **D-02:** Preserve bcryptjs password hashing via better-auth's `password.hash` / `password.verify` options so existing hashes remain valid.
- **D-03:** Switch from JWT sessions to better-auth database sessions. `SessionUser` shape (`id`, `username`) must stay identical.
- **D-04:** Preserve session cookie config (httpOnly, sameSite: lax, path: /, secure in production).
- **D-05:** New Prisma tables required: `session` and `account`. Existing `User` table adapted with better-auth mapping.
- **D-06:** `AuthRateLimit` table stays unchanged. Rate limiting NOT migrated to better-auth built-in.
- **D-07:** Schema change (Prisma migration) explicitly approved for this phase.
- **D-08:** Keep custom `/api/auth/register` POST route at current path. Do NOT delegate registration to better-auth.
- **D-09:** Preserve guard helpers: `hasDatabaseUrl()`, `isAuthAvailable()`, `getAuthUnavailableResponse()`, `getAuthRequiredResponse()`.
- **D-10:** Middleware must still pass-through when `DATABASE_URL` absent. Replace `withAuth` from `next-auth/middleware` with better-auth middleware.
- **D-11:** Replace `signIn("credentials", ...)` from `next-auth/react` with better-auth client `signIn.username()` in login-screen.tsx.
- **D-12:** Replace `useSession()` / `SessionProvider` from `next-auth/react` with better-auth's `useSession()`. Session shape must stay identical.
- **D-13:** Remove `src/types/next-auth.d.ts`. Use `auth.$Infer.Session` for type derivation. `SessionUser` type in `src/lib/types.ts` must remain unchanged.
- **D-14:** Unit tests mock `@/lib/auth`. Mock contract unchanged — only implementation changes.

### Claude's Discretion

- Exact better-auth version to install (use latest stable)
- Whether to use better-auth's `nextjs` adapter or the generic `node` adapter
- Internal structure of the new `src/lib/auth.ts` (as long as exported function signatures preserved)
- Prisma migration file naming

### Deferred Ideas (OUT OF SCOPE)

- Running `vinext init` after better-auth migration — that is Phase 10
- Migrating rate limiting to better-auth built-in
- Adding OAuth providers (Google, GitHub)
</user_constraints>

---

## Summary

better-auth 1.5.6 (latest stable as of 2026-03-28) provides a complete credential-based auth system for Next.js App Router with Prisma. The migration from next-auth v4 is well-defined but has one significant constraint: better-auth's username plugin requires `emailAndPassword.enabled: true` because email remains a required field internally even when using username sign-in. This project has no email in its login form and stores no email on most users — the standard pattern is to use a deterministic placeholder email (`{username}@placeholder.invalid`) internally. This is the established community workaround and is safe since email verification is never triggered.

The core migration path: install `better-auth`, replace the NextAuth handler at `/api/auth/[...nextauth]/route.ts` with `toNextJsHandler(auth)` at `/api/auth/[...all]/route.ts`, replace `withAuth` middleware with better-auth's `getSessionCookie` cookie check (Next.js 16 uses `proxy.ts` instead of `middleware.ts`), replace `next-auth/react` client imports with `createAuthClient` from `better-auth/react`, and add `session` + `account` Prisma models via migration.

The `getAuthenticatedUser()` function — called by every API route — can be reimplemented calling `auth.api.getSession({ headers })` with identical return type. The bcryptjs hashing is preserved via the `emailAndPassword.password.hash` / `password.verify` API. The `AuthRateLimit` table and rate limiting logic are untouched — they have no next-auth dependency.

**Primary recommendation:** Migrate in waves: (1) install better-auth and write new `src/lib/auth.ts`, (2) add Prisma migration for session/account tables, (3) replace handler and middleware, (4) replace client imports in login-screen and app-shell, (5) remove next-auth.

---

## Project Constraints (from CLAUDE.md)

- Never modify `prisma/schema.prisma` without explicit approval — **approved for this phase** (D-07)
- Never install new packages without asking — **better-auth is the explicit goal; approved**
- Never skip tests or bypass git hooks (`--no-verify`)
- Import with `@/` alias — no relative `../` paths
- Named exports everywhere except Next.js page/layout/route files
- Error messages in Brazilian Portuguese; code identifiers in English
- Semantic design tokens only — no arbitrary Tailwind values
- `DATABASE_URL` required guard pattern must survive migration

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | 1.5.6 | Auth framework replacing next-auth | Latest stable; Prisma + username plugin built-in |
| better-auth (username plugin) | 1.5.6 (bundled) | Username-based sign-in | Bundled in better-auth/plugins |
| better-auth (Prisma adapter) | 1.5.6 (bundled) | ORM adapter | Bundled in better-auth/adapters/prisma |
| bcryptjs | 3.0.3 (existing) | Password hashing/verification | Preserved via custom hash/verify API |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| better-auth/react | 1.5.6 (bundled) | Client hooks + signIn/signOut | In client components (login-screen, app-shell) |

### Removed

| Package | Replacement |
|---------|-------------|
| next-auth 4.24.13 | better-auth 1.5.6 |
| next-auth/react (signIn, signOut) | better-auth/react (authClient.signIn.username, authClient.signOut) |
| next-auth/middleware (withAuth) | better-auth/next-js (getSessionCookie) or auth.api.getSession |

**Installation:**
```bash
npm install better-auth
npm uninstall next-auth
```

**Version verification (performed 2026-03-28):**
```
better-auth: 1.5.6 (published 2026-03-23)
latest dist-tag: 1.5.6
```

---

## Architecture Patterns

### New File Layout

```
src/
├── lib/
│   ├── auth.ts            # Rewritten: betterAuth config + all exported helpers
│   ├── auth-client.ts     # NEW: createAuthClient instance for client components
│   ├── auth-rate-limit.ts # UNCHANGED
│   ├── auth-validation.ts # UNCHANGED
│   └── prisma.ts          # UNCHANGED
├── types/
│   └── next-auth.d.ts     # DELETED — replaced by auth.$Infer.Session
src/app/
├── api/
│   └── auth/
│       ├── [...all]/      # RENAMED from [...nextauth]
│       │   └── route.ts   # Replaced: toNextJsHandler(auth)
│       └── register/
│           └── route.ts   # UNCHANGED (custom, no next-auth deps)
proxy.ts                   # RENAMED/REPLACED from middleware.ts (Next.js 16)
```

### Pattern 1: better-auth Server Instance

**What:** Central auth configuration in `src/lib/auth.ts` replacing `getAuthOptions()`.

**When to use:** Imported by route handler, middleware/proxy, and `getAuthenticatedUser()`.

```typescript
// Source: https://www.better-auth.com/docs/installation
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true, // Required even with username plugin — email used internally
    password: {
      hash: (password) => hash(password, 12),
      verify: ({ hash: storedHash, password }) => compare(password, storedHash),
    },
  },
  plugins: [username()],
  user: {
    modelName: "User",     // matches existing Prisma model
    fields: {
      // Map better-auth field names to existing column names
      // 'email' stored as placeholder internally
    },
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
});
```

### Pattern 2: Route Handler (Next.js App Router)

**What:** Replace `[...nextauth]/route.ts` with `[...all]/route.ts`.

```typescript
// Source: https://www.better-auth.com/docs/installation
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

Note: Route must be at `src/app/api/auth/[...all]/route.ts` (not `[...nextauth]`). The old folder must be deleted.

### Pattern 3: Server-Side Session (getAuthenticatedUser)

**What:** Replace `getServerSession(getAuthOptions())` with `auth.api.getSession({ headers })`.

```typescript
// Source: https://better-auth.com/docs/integrations/next
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getAuthSession() {
  if (!isAuthAvailable()) {
    return null;
  }
  return auth.api.getSession({ headers: await headers() });
}

export async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.username) {
    return null;
  }
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, avatarUrl: true },
  });
  return {
    id: session.user.id,
    username: session.user.username,
    displayName: profile?.displayName ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
  };
}
```

The `session.user.username` is available because the username plugin adds it to the session user object.

### Pattern 4: Middleware / Proxy Route Protection

**What:** Replace `withAuth` from `next-auth/middleware`.

In Next.js 16, `middleware.ts` is replaced by `proxy.ts`. The matcher config at the bottom of `middleware.ts` moves to `proxy.ts`.

```typescript
// Source: https://better-auth.com/docs/integrations/next
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const authRequired = Boolean(process.env.DATABASE_URL?.trim());

export default async function proxy(request: NextRequest) {
  if (!authRequired) {
    return NextResponse.next();
  }
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scoreboard",
    "/times/:path*",
    "/ranking/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/head-to-head/:path*",
  ],
};
```

**Security note:** `getSessionCookie` only checks cookie existence — it does NOT validate the session. This is intentional for performance; actual session validation occurs in server components and API routes via `auth.api.getSession()`. This mirrors the security model previously used with `withAuth`.

### Pattern 5: Auth Client (Client Components)

**What:** Replace `next-auth/react` imports with better-auth client.

```typescript
// src/lib/auth-client.ts — NEW FILE
// Source: https://www.better-auth.com/docs/concepts/client
import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient()],
});

export const { useSession, signOut } = authClient;
```

**In login-screen.tsx** (replaces `signIn("credentials", ...)` from `next-auth/react`):

```typescript
// Replace next-auth/react import:
import { authClient } from "@/lib/auth-client";

// Login handler (replaces signIn("credentials", { redirect: false })):
const { data, error } = await authClient.signIn.username({
  username: form.username,
  password: form.password,
});

// NOTE: callbackUrl is NOT supported in username plugin (known issue #6297).
// Use router.push("/dashboard") manually after successful sign-in.
if (error) {
  setGeneralError("Username ou senha invalidos.");
  return;
}
router.push("/dashboard");
```

**In app-shell.tsx** (replaces `signOut` from `next-auth/react`):
```typescript
import { authClient } from "@/lib/auth-client";
// Replace: void signOut({ callbackUrl: "/login" })
// With:
void authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
```

### Pattern 6: Custom bcryptjs Hashing

**What:** Configure better-auth to use bcryptjs instead of its default scrypt.

**Why critical:** All existing users have bcrypt-hashed passwords stored in `passwordHash` column. If better-auth defaults to scrypt, every existing password becomes invalid.

```typescript
// Source: https://better-auth.com/docs/authentication/email-password
import { compare, hash } from "bcryptjs";

emailAndPassword: {
  enabled: true,
  password: {
    hash: (password: string) => hash(password, 12),
    verify: ({ hash: storedHash, password }: { hash: string; password: string }) =>
      compare(password, storedHash),
  },
},
```

**Important:** The `verify` function receives `{ hash, password }` as a destructured object, not two separate arguments.

### Pattern 7: Username-Only Auth (Email Placeholder Strategy)

**What:** Handling better-auth's email requirement when the project has no email field.

**Context:** The username plugin requires `emailAndPassword.enabled: true`. better-auth internally requires a unique email on the user table. This project's User model has an optional `email` field (`String? @unique`). New users registered via the existing custom `/api/auth/register` route are created with `prisma.user.create()` and no email. When better-auth's sign-in handler looks up the user by username, it uses the username plugin's credential lookup (not email lookup), so the missing email does not cause lookup failures.

**The registration concern:** The custom `/api/auth/register` route (D-08) creates users directly via Prisma — this continues unchanged. It does NOT go through better-auth's sign-up endpoint. After registration, the client calls `authClient.signIn.username()` to establish a session. No email placeholder is injected.

**The account table concern:** When a user signs in via the username plugin, better-auth creates a row in the `account` table linking `userId` → credentials provider. This row holds the `password` field (better-auth's own password store). **Conflict:** The project stores passwords in `User.passwordHash` but better-auth expects to store/read them from `account.password`. The custom `verify` function must read from `User.passwordHash` via Prisma, not from `account.password`.

**Resolution:** Use a fully custom credential verify flow. The `emailAndPassword.password.verify` function calls `prisma.user.findUnique({ where: { username } })` and compares `user.passwordHash`. This is equivalent to how the current `authorize()` function works. The `account.password` field will be null/empty — that is acceptable since verification bypasses it.

Alternatively, use better-auth's `onSignIn` hook or the credential provider plugin to fully control the authentication flow. **Verify this approach against the actual better-auth username plugin behavior during implementation.**

### Anti-Patterns to Avoid

- **Do NOT** use `getSessionCookie` as the sole security check in server components — always call `auth.api.getSession()` for actual protection.
- **Do NOT** call `getServerSession(getAuthOptions())` after migration — this is the next-auth API and will error.
- **Do NOT** import from `next-auth` or `next-auth/react` anywhere after migration.
- **Do NOT** use `middleware.ts` as the file name in Next.js 16 — it is now `proxy.ts`.
- **Do NOT** delete the `[...nextauth]` folder without first creating `[...all]` — brief downtime otherwise.
- **Do NOT** assume `session.user.username` is automatically populated without verifying the username plugin returns it in the session.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session storage / DB sessions | Custom session table logic | `better-auth` built-in session model | Session expiry, rotation, token invalidation are complex |
| Cookie signing / verification | Custom cookie crypto | `getSessionCookie()` from `better-auth/cookies` | Safe defaults; tamper-resistant |
| Password verify function | Custom bcrypt wrapper | `emailAndPassword.password.verify` config | Plugs into the auth flow; gets called on sign-in automatically |
| Next.js handler adapter | Custom request/response mapping | `toNextJsHandler(auth)` | Handles streaming, edge runtime, and response headers |
| Client session reactivity | Custom React context | `useSession` from `better-auth/react` | Nano-store reactive; no Provider needed |

**Key insight:** better-auth's main complexity is the initial schema migration and the username plugin's email requirement workaround. Once configured, the runtime behavior is simpler than next-auth — no JWT token introspection, direct DB session lookup.

---

## Common Pitfalls

### Pitfall 1: Password Stored in Wrong Place

**What goes wrong:** better-auth's emailAndPassword provider stores hashed passwords in `account.password`, not `user.passwordHash`. Existing users have passwords in `user.passwordHash`. Sign-in will fail for all existing users.

**Why it happens:** better-auth's default credential flow reads `account.password` for verification. The custom `verify` function must explicitly read `user.passwordHash` via Prisma lookup instead.

**How to avoid:** In the `verify` function, always look up the user by username from `users` table and compare against `passwordHash`. Do not rely on the `hash` parameter passed to `verify` — it may come from `account.password` which is null for existing users.

**Warning signs:** Existing users get "invalid credentials" immediately after migration.

### Pitfall 2: Route Handler URL Mismatch

**What goes wrong:** Auth endpoints move from `/api/auth/[...nextauth]` to `/api/auth/[...all]`. If client code hardcodes the old path, auth requests will 404.

**Why it happens:** better-auth uses `/api/auth` as its base by default, but the catch-all segment must be `[...all]` not `[...nextauth]`.

**How to avoid:** Verify `createAuthClient` uses the same base URL as the handler. Delete `src/app/api/auth/[...nextauth]/` folder after creating `src/app/api/auth/[...all]/`.

**Warning signs:** `authClient.signIn.username()` returns network errors or 404.

### Pitfall 3: middleware.ts vs proxy.ts in Next.js 16

**What goes wrong:** The project runs Next.js 16.1.6. In Next.js 16, `middleware.ts` is renamed to `proxy.ts`. If `middleware.ts` is kept, it may still work in some versions but the recommended approach is `proxy.ts`.

**Why it happens:** Next.js 16 replaced the middleware concept with "proxy" for clarity and to support Node.js runtime by default.

**How to avoid:** Create `proxy.ts` at project root (same location as current `middleware.ts`). Keep the same `matcher` config. Delete `middleware.ts` after `proxy.ts` is confirmed working.

**Warning signs:** Route protection not triggering, or getting deprecation warnings in build output.

### Pitfall 4: username Plugin Requires emailAndPassword Enabled

**What goes wrong:** Setting `emailAndPassword: { enabled: false }` and only using the username plugin will break sign-in — the username plugin depends on the emailAndPassword internals.

**Why it happens:** The username plugin extends emailAndPassword rather than replacing it. The email is stored internally even if not shown to users.

**How to avoid:** Always set `emailAndPassword: { enabled: true }` alongside `plugins: [username()]`.

**Warning signs:** `authClient.signIn.username()` returns an error about the provider not being configured.

### Pitfall 5: callbackUrl Not Supported in Username Plugin

**What goes wrong:** Passing a `callbackUrl` to `signIn.username()` does not trigger a redirect — the response only returns `{ token, user }`, not `{ redirect, url }`. This is a known issue (#6297, not yet fixed in 1.5.6).

**Why it happens:** The username plugin's signIn endpoint was not updated to include redirect information in its response.

**How to avoid:** After `authClient.signIn.username()` succeeds, manually call `router.push("/dashboard")`. Do not pass `callbackUrl` to the username signIn method.

**Warning signs:** After login, user stays on `/login` page despite successful authentication.

### Pitfall 6: useSession Has Different Return Shape

**What goes wrong:** next-auth's `useSession` returns `{ data: session, status }`. better-auth's `useSession` returns `{ data: { session, user }, isPending, error }`. Code accessing `data.user` or `data.username` needs to be updated.

**Why it happens:** Different API design between libraries.

**How to avoid:** Audit every consumer of `useSession`. The app-shell currently receives `SessionUser` as a prop from the server layout — it does NOT call `useSession` directly. Check if any other component uses it.

**Warning signs:** TypeScript errors or runtime `undefined` on `session.user.username` in client components.

### Pitfall 7: env Var Name Change

**What goes wrong:** `NEXTAUTH_SECRET` is no longer read. `BETTER_AUTH_SECRET` is required. Deployment will silently fall back to an insecure development secret if not set.

**Why it happens:** Different env var naming convention.

**How to avoid:** Update `.env`, Vercel environment variables, and the secret check in `hasAuthSecret()` / `isAuthAvailable()`. The guard helpers in `auth.ts` check `NEXTAUTH_SECRET` — must update to check `BETTER_AUTH_SECRET`.

**Warning signs:** Auth works in dev but fails in production with "session invalid" errors.

### Pitfall 8: Schema Conflict — better-auth User vs Existing User

**What goes wrong:** better-auth's generated schema has `User` with `name`, `email`, `emailVerified`, `image` as required fields. The project's `User` has `username`, `passwordHash`, `displayName`, `avatarUrl`. The `@@map("users")` and field mapping must be done via `modelName` + `fields` config.

**Why it happens:** better-auth defaults to its own naming convention; the project uses snake_case DB names.

**How to avoid:** Use `user.modelName: "User"` and `user.fields` config in betterAuth(). The Prisma migration only adds `session` and `account` models — it does NOT recreate the `User` model. Run `npx auth@latest generate` to preview, then hand-edit the output to match existing User model.

**Warning signs:** Prisma migration fails with column not found, or better-auth can't find users.

---

## Code Examples

### Complete `src/lib/auth.ts` Skeleton

```typescript
// Source: https://www.better-auth.com/docs/installation + username plugin docs
import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, SessionUser } from "@/lib/types";

const BETTER_AUTH_DATABASE_ERROR =
  "Autenticacao indisponivel sem DATABASE_URL configurado.";
const BETTER_AUTH_SECRET_ERROR =
  "Configuracao de autenticacao invalida: defina BETTER_AUTH_SECRET para usar o login.";
const AUTH_REQUIRED_ERROR = "Autenticacao obrigatoria.";

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function hasAuthSecret() {
  return Boolean(process.env.BETTER_AUTH_SECRET?.trim());
}

export function isAuthAvailable() {
  return hasDatabaseUrl() && hasAuthSecret();
}

export function getAuthUnavailableError() {
  if (!hasDatabaseUrl()) return BETTER_AUTH_DATABASE_ERROR;
  if (!hasAuthSecret()) return BETTER_AUTH_SECRET_ERROR;
  return null;
}

export function getAuthUnavailableResponse() {
  return NextResponse.json<ApiErrorResponse>(
    { error: getAuthUnavailableError() ?? BETTER_AUTH_DATABASE_ERROR },
    { status: hasDatabaseUrl() ? 500 : 503 },
  );
}

export function getAuthRequiredResponse() {
  return NextResponse.json<ApiErrorResponse>(
    { error: AUTH_REQUIRED_ERROR },
    { status: 401 },
  );
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "auth-disabled-no-database",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password: string) => hash(password, 12),
      verify: async ({ hash: storedHash, password }: { hash: string; password: string }) =>
        compare(password, storedHash),
    },
  },
  plugins: [username()],
  user: {
    modelName: "User",
  },
  advanced: {
    cookiePrefix: "office8ball",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
});

export async function getAuthSession() {
  if (!isAuthAvailable()) return null;
  return auth.api.getSession({ headers: await headers() });
}

export async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const session = await getAuthSession();
  if (!session?.user?.id) return null;
  // username is added by the username plugin to the session user
  const username_val = (session.user as { username?: string }).username;
  if (!username_val) return null;
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, avatarUrl: true },
  });
  return {
    id: session.user.id,
    username: username_val,
    displayName: profile?.displayName ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
  };
}
```

### Prisma Schema Additions

The following models must be added to `prisma/schema.prisma`. These are generated by `npx auth@latest generate` and then adapted to match existing naming conventions:

```prisma
model Session {
  id        String   @id @default(cuid()) @db.Text
  expiresAt DateTime @db.Timestamptz(6)
  token     String   @unique @db.Text
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @db.Timestamptz(6)
  ipAddress String?  @db.Text
  userAgent String?  @db.Text
  userId    String   @map("user_id") @db.Text
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Account {
  id                   String    @id @default(cuid()) @db.Text
  accountId            String    @map("account_id") @db.Text
  providerId           String    @map("provider_id") @db.Text
  userId               String    @map("user_id") @db.Text
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken          String?   @map("access_token") @db.Text
  refreshToken         String?   @map("refresh_token") @db.Text
  idToken              String?   @map("id_token") @db.Text
  accessTokenExpiresAt DateTime? @map("access_token_expires_at") @db.Timestamptz(6)
  refreshTokenExpiresAt DateTime? @map("refresh_token_expires_at") @db.Timestamptz(6)
  scope                String?   @db.Text
  password             String?   @db.Text
  createdAt            DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt            DateTime  @updatedAt @db.Timestamptz(6)

  @@map("accounts")
}

// Add to existing User model:
// sessions  Session[]
// accounts  Account[]
// username  String? @unique @db.Text (needed by username plugin)
// displayUsername String? @map("display_username") @db.Text
```

**Note:** The `email` field already exists on the User model as optional (`String? @unique`). The username plugin adds `username` and `displayUsername` fields. These must be added to the existing User model in schema.prisma.

### Proxy (Route Protection) — proxy.ts

```typescript
// Source: https://better-auth.com/docs/integrations/next
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const authRequired = Boolean(process.env.DATABASE_URL?.trim());

export default async function proxy(request: NextRequest) {
  if (!authRequired) {
    return NextResponse.next();
  }
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scoreboard",
    "/times/:path*",
    "/ranking/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/head-to-head/:path*",
  ],
};
```

### Auth Client — src/lib/auth-client.ts

```typescript
// Source: https://www.better-auth.com/docs/concepts/client
"use client";
import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient()],
});

export const { useSession, signOut } = authClient;
export type Session = typeof authClient.$Infer.Session;
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `withAuth` from `next-auth/middleware` | `getSessionCookie` from `better-auth/cookies` in `proxy.ts` | proxy.ts replaces middleware.ts in Next.js 16 |
| `getServerSession(getAuthOptions())` | `auth.api.getSession({ headers })` | Returns `{ session, user }` not just session |
| JWT session tokens (stateless) | DB session tokens (server-side, revocable) | More secure; sessions can be invalidated server-side |
| `SessionProvider` wrapper | No provider needed | better-auth uses nano-store; no React context provider required |
| `NEXTAUTH_SECRET` env var | `BETTER_AUTH_SECRET` env var | Must update all environments |
| Module augmentation in `next-auth.d.ts` | `auth.$Infer.Session` type inference | Cleaner; no declaration merging |
| `/api/auth/[...nextauth]` catch-all | `/api/auth/[...all]` catch-all | Folder rename required |

**Deprecated/outdated:**
- `getServerSession` from `next-auth`: not available in better-auth — use `auth.api.getSession`
- `CredentialsProvider` from `next-auth`: replaced by `emailAndPassword` + `username` plugin config
- `jwt`/`session` callbacks: replaced by `user.additionalFields` and plugin session data

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | better-auth runtime | Yes | v24.14.0 | — |
| PostgreSQL | DB sessions | Yes (via DATABASE_URL) | Neon / configured | 503 guard |
| npm | Package install | Yes | present | — |
| Prisma CLI | Migration | Yes | 6.19.2 | — |

**Note on env vars:** `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` must be set in Vercel and any CI environment before the migrated code is deployed. Both are new; `NEXTAUTH_SECRET` and `NEXTAUTH_URL` can be removed after migration is confirmed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- src/lib/auth.test.ts src/components/login/login-screen.test.tsx` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| AUTH-MIGRATION-01 | `hasDatabaseUrl()` / `isAuthAvailable()` / guard helpers work identically | unit | `npm run test -- src/lib/auth.test.ts` | Needs update (Wave 0) |
| AUTH-MIGRATION-02 | `getAuthenticatedUser()` returns `SessionUser \| null` from better-auth session | unit | `npm run test -- src/lib/auth.test.ts` | Needs update (Wave 0) |
| AUTH-MIGRATION-03 | Login with correct username+password creates session | unit/integration | `npm run test -- src/lib/auth.test.ts` | Needs update (Wave 0) |
| AUTH-MIGRATION-04 | Login with wrong password returns null/error (rate limit still fires) | unit | `npm run test -- src/lib/auth.test.ts` | Needs update (Wave 0) |
| AUTH-MIGRATION-05 | LoginScreen calls `authClient.signIn.username()` not `next-auth signIn` | unit | `npm run test -- src/components/login/login-screen.test.tsx` | Needs mock update (Wave 0) |
| AUTH-MIGRATION-06 | App shell signOut calls `authClient.signOut()` | unit | `npm run test -- src/components/authenticated/app-shell.test.tsx` | Needs mock update (Wave 0) |
| AUTH-MIGRATION-07 | Proxy protects `/dashboard` — redirects to `/login` without cookie | e2e | `npm run e2e` | Existing tests may cover |

### Wave 0 Gaps

- [ ] `src/lib/auth.test.ts` — Update mocks: replace `vi.mock("next-auth", ...)` and `vi.mock("next-auth/providers/credentials", ...)` with `vi.mock("better-auth", ...)` and `vi.mock("better-auth/adapters/prisma", ...)`. Replace `getServerSessionMock` with mock for `auth.api.getSession`.
- [ ] `src/components/login/login-screen.test.tsx` — Replace `vi.mock("next-auth/react", ...)` with `vi.mock("@/lib/auth-client", ...)`. Update `signInMock` to match `authClient.signIn.username` return shape `{ data, error }`.
- [ ] `src/components/authenticated/app-shell.test.tsx` — Replace `vi.mock("next-auth/react", ...)` with `vi.mock("@/lib/auth-client", ...)`. Update `signOut` mock.

**Key test isolation pattern to preserve (from CLAUDE.md `testing.md`):**
- Never import Prisma in test files directly.
- Mock `@/lib/auth` to stub `getAuthenticatedUser` — this contract is UNCHANGED.
- Tests that mock `@/lib/auth-client` instead of `next-auth/react` are the only wave-0 change to test files.

### Sampling Rate

- **Per task commit:** `npm run test -- src/lib/auth.test.ts`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green + `npm run typecheck` before `/gsd:verify-work`

---

## Open Questions

1. **username plugin session shape — does `session.user.username` exist?**
   - What we know: The username plugin extends the session user. The docs say it adds username to the user table and session.
   - What's unclear: The exact TypeScript type of `auth.api.getSession()` response — whether `user.username` is typed or needs `as any`.
   - Recommendation: During implementation, run `npx ts-node -e "console.log(typeof auth.$Infer.Session)"` or check the inferred type to confirm `username` appears. Use `(session.user as { username?: string }).username` as a safe fallback.

2. **Password verification — does better-auth pass `account.password` or `user.passwordHash` to the verify function?**
   - What we know: The `verify` function receives `{ hash, password }`. For existing users, `account.password` is null. The custom verify function must look up `user.passwordHash` by username.
   - What's unclear: Whether better-auth calls `verify` at all when `account.password` is null, or short-circuits.
   - Recommendation: Look at the source code or test with a dummy user to verify the flow. If better-auth skips verify when `account.password` is null, the authorize flow must be customized differently.

3. **getSessionCookie configuration — cookie name prefix**
   - What we know: `getSessionCookie(request)` reads better-auth's session cookie. The cookie name is `better-auth.session_token` by default, or `{cookiePrefix}.session_token` if `advanced.cookiePrefix` is set.
   - What's unclear: Whether the cookie prefix in `auth.ts` must exactly match what `getSessionCookie()` expects, or if it auto-reads from config.
   - Recommendation: Pass the auth config to `getSessionCookie` if needed: `getSessionCookie(request, { cookieName: "office8ball.session_token" })`.

4. **vitest.config.ts `__dirname` issue (mentioned in CONTEXT.md specifics)**
   - What we know: `vinext check` flagged a CJS→ESM issue in `vitest.config.ts` using `__dirname`. This is separate from better-auth migration.
   - What's unclear: Whether this must be fixed in Phase 9 or can be deferred to Phase 10.
   - Recommendation: Fix `__dirname` → `import.meta.dirname` in this phase since it's a low-risk 1-line change that avoids leaving a known build issue.

---

## Sources

### Primary (HIGH confidence)

- [better-auth official docs: installation](https://www.better-auth.com/docs/installation) — auth instance setup, Next.js route handler
- [better-auth official docs: email/password](https://better-auth.com/docs/authentication/email-password) — custom `password.hash` / `verify` API
- [better-auth official docs: username plugin](https://better-auth.com/docs/plugins/username) — plugin setup, schema requirements, signIn.username
- [better-auth official docs: Prisma adapter](https://www.better-auth.com/docs/adapters/prisma) — prismaAdapter config, generate command
- [better-auth official docs: database](https://www.better-auth.com/docs/concepts/database) — modelName, fields customization
- [better-auth official docs: client](https://www.better-auth.com/docs/concepts/client) — createAuthClient, useSession return shape
- [better-auth official docs: TypeScript](https://www.better-auth.com/docs/concepts/typescript) — `auth.$Infer.Session`
- [Prisma + better-auth guide](https://www.prisma.io/docs/guides/betterauth-nextjs) — exact Prisma schema models for Session/Account
- npm registry: `better-auth` v1.5.6 (verified 2026-03-28)

### Secondary (MEDIUM confidence)

- [better-auth Next.js integration](https://better-auth.com/docs/integrations/next) — proxy middleware, getSessionCookie, App Router patterns
- [better-auth reference options](https://better-auth.com/docs/reference/options) — cookie attributes, defaultCookieAttributes, cookiePrefix
- [GitHub discussion #5896: username-only auth](https://github.com/better-auth/better-auth/discussions/5896) — email workaround community consensus

### Tertiary (LOW confidence — flag for validation)

- [GitHub issue #6297: callbackUrl in username plugin](https://github.com/better-auth/better-auth/issues/6297) — callbackUrl not supported; closed as NOT_PLANNED but PRs open (#7200)
- [GitHub issue #2215: users without email](https://github.com/better-auth/better-auth/issues/2215) — email placeholder workaround community approach

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from official docs + npm registry
- Architecture patterns: HIGH — from official docs; route handler + adapter patterns well-documented
- Username-only (no email) approach: MEDIUM — community workaround; not official; email placeholder may need validation
- Password verify flow: MEDIUM — documented API but exact call site (when `account.password` is null) needs verification during implementation
- Pitfalls: HIGH for env/route rename; MEDIUM for password/username edge cases
- Proxy middleware: HIGH for cookie-check pattern; LOW for full session validation in proxy (performance vs security tradeoff)

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (better-auth is actively developed; 30-day window)
