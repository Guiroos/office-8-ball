import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, SessionUser } from "@/lib/types";

const AUTH_UNAVAILABLE_DATABASE_ERROR =
  "Autenticacao indisponivel sem DATABASE_URL configurado.";
const BETTER_AUTH_SECRET_ERROR =
  "Configuracao de autenticacao invalida: defina BETTER_AUTH_SECRET para usar o login.";
const AUTH_REQUIRED_ERROR = "Autenticacao obrigatoria.";
const AUTH_OPERATION_TIMEOUT_MS = Number(
  process.env.AUTH_OPERATION_TIMEOUT_MS ?? 8_000,
);

async function withTimeout<T>(
  label: string,
  operation: Promise<T>,
  fallback: T,
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      // Catch errors so a rejected operation returns fallback instead of
      // propagating — this ensures failed DB queries release pool connections
      // immediately rather than leaving them stuck until the timer fires.
      operation.catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${label} failed: ${msg}`);
        return fallback;
      }),
      new Promise<T>((resolve) => {
        timeoutHandle = setTimeout(() => {
          console.error(`${label} timed out after ${AUTH_OPERATION_TIMEOUT_MS}ms`);
          resolve(fallback);
        }, AUTH_OPERATION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function hasAuthSecret(): boolean {
  return Boolean(process.env.BETTER_AUTH_SECRET?.trim());
}

export function isAuthAvailable(): boolean {
  return hasDatabaseUrl() && hasAuthSecret();
}

export function getAuthUnavailableError(): string | null {
  if (!hasDatabaseUrl()) return AUTH_UNAVAILABLE_DATABASE_ERROR;
  if (!hasAuthSecret()) return BETTER_AUTH_SECRET_ERROR;
  return null;
}

export function getAuthUnavailableResponse(): NextResponse {
  return NextResponse.json<ApiErrorResponse>(
    { error: getAuthUnavailableError() ?? AUTH_UNAVAILABLE_DATABASE_ERROR },
    { status: hasDatabaseUrl() ? 500 : 503 },
  );
}

export function getAuthRequiredResponse(): NextResponse {
  return NextResponse.json<ApiErrorResponse>(
    { error: AUTH_REQUIRED_ERROR },
    { status: 401 },
  );
}

// Migration hook: ensures existing next-auth users (who have bcrypt hashes in
// User.passwordHash but no account record) can sign in via better-auth.
// On first sign-in, creates the account row by copying User.passwordHash
// into accounts.password so the username plugin can verify it.
const migrationMiddleware = createAuthMiddleware(async (ctx) => {
  const path = ctx.path;
  if (path !== "/sign-in/username") return;

  const body = ctx.body as { username?: string } | undefined;
  const inputUsername = body?.username;
  if (!inputUsername) return;

  const user = await ctx.context.adapter.findOne<{ id: string }>({
    model: "user",
    where: [{ field: "username", value: inputUsername.toLowerCase() }],
  });

  if (!user?.id) return;

  const existingAccount = await ctx.context.adapter.findOne({
    model: "account",
    where: [
      { field: "userId", value: user.id },
      { field: "providerId", value: "credential" },
    ],
  });

  if (!existingAccount) {
    // User signed up via next-auth — migrate their passwordHash to the accounts table.
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true },
    });

    if (dbUser?.passwordHash) {
      await ctx.context.adapter.create({
        model: "account",
        data: {
          accountId: dbUser.id,
          providerId: "credential",
          userId: dbUser.id,
          password: dbUser.passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "auth-disabled-no-database",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password: string) => hash(password, 12),
      // Standard bcrypt verification. The migration hook above ensures account.password
      // is populated from User.passwordHash for users migrated from next-auth.
      verify: async ({
        hash: storedHash,
        password: plaintext,
      }: {
        hash: string;
        password: string;
      }) => {
        return compare(plaintext, storedHash);
      },
    },
  },
  plugins: [username()],
  user: {
    modelName: "User",
  },
  hooks: {
    before: migrationMiddleware,
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
});

export async function getAuthSession() {
  if (!isAuthAvailable()) {
    return null;
  }

  return withTimeout(
    "Auth session lookup",
    auth.api.getSession({ headers: await headers() }),
    null,
  );
}

export async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const session = await getAuthSession();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUser = (session as any)?.user;

  if (!sessionUser?.id || !sessionUser?.username) {
    return null;
  }

  const profile = await withTimeout(
    "Authenticated user profile lookup",
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        displayName: true,
        avatarUrl: true,
      },
    }),
    null,
  );

  return {
    id: sessionUser.id,
    username: sessionUser.username,
    displayName: profile?.displayName ?? sessionUser.displayName ?? null,
    avatarUrl: profile?.avatarUrl ?? sessionUser.avatarUrl ?? null,
  };
}
