import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextResponse } from "next/server";

import {
  AUTH_RATE_LIMIT_ERROR,
  buildAuthRateLimitKey,
  clearAuthRateLimit,
  getAuthRateLimitStatus,
  registerAuthFailure,
} from "@/lib/auth-rate-limit";
import {
  validateLoginPayload,
} from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, SessionUser } from "@/lib/types";

type AuthRequestLike = {
  headers?: Record<string, string | string[] | undefined>;
};

const AUTH_DISABLED_SECRET = "auth-disabled-no-database";
const AUTH_UNAVAILABLE_DATABASE_ERROR =
  "Autenticacao indisponivel sem DATABASE_URL configurado.";
const AUTH_UNAVAILABLE_SECRET_ERROR =
  "Configuracao de autenticacao invalida: defina NEXTAUTH_SECRET para usar o login.";
const AUTH_REQUIRED_ERROR = "Autenticacao obrigatoria.";

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function hasAuthSecret() {
  return Boolean(process.env.NEXTAUTH_SECRET?.trim());
}

function shouldUseSecureAuthCookies() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.NEXTAUTH_URL?.startsWith("https://")
  );
}

function getAuthSecret() {
  if (!hasDatabaseUrl()) {
    return AUTH_DISABLED_SECRET;
  }

  const secret = process.env.NEXTAUTH_SECRET?.trim();

  if (!secret) {
    throw new Error(AUTH_UNAVAILABLE_SECRET_ERROR);
  }

  return secret;
}

export function isAuthAvailable() {
  return hasDatabaseUrl() && hasAuthSecret();
}

export function getAuthUnavailableError() {
  if (hasDatabaseUrl()) {
    if (!hasAuthSecret()) {
      return AUTH_UNAVAILABLE_SECRET_ERROR;
    }

    return null;
  }

  return AUTH_UNAVAILABLE_DATABASE_ERROR;
}

export function getAuthUnavailableResponse() {
  return NextResponse.json<ApiErrorResponse>(
    { error: getAuthUnavailableError() ?? AUTH_UNAVAILABLE_DATABASE_ERROR },
    { status: hasDatabaseUrl() ? 500 : 503 },
  );
}

export function getAuthRequiredResponse() {
  return NextResponse.json<ApiErrorResponse>(
    { error: AUTH_REQUIRED_ERROR },
    { status: 401 },
  );
}

export function getAuthOptions(): NextAuthOptions {
  const useSecureCookies = shouldUseSecureAuthCookies();

  return {
    secret: getAuthSecret(),
    session: {
      strategy: "jwt",
    },
    useSecureCookies,
    cookies: {
      sessionToken: {
        name: useSecureCookies
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: useSecureCookies,
        },
      },
    },
    pages: {
      signIn: "/login",
    },
    providers: [
      CredentialsProvider({
        name: "Email e senha",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Senha", type: "password" },
        },
        async authorize(credentials, request) {
          if (!isAuthAvailable()) {
            return null;
          }

          const validation = validateLoginPayload({
            email: String(credentials?.email ?? ""),
            password: String(credentials?.password ?? ""),
          });

          if (!validation.data) {
            return null;
          }

          const { email, password } = validation.data;
          const rateLimitKey = buildAuthRateLimitKey({
            action: "login",
            email,
            headers: (request as AuthRequestLike | undefined)?.headers,
          });
          const rateLimitStatus = await getAuthRateLimitStatus(rateLimitKey);

          if (rateLimitStatus.blocked) {
            throw new Error(AUTH_RATE_LIMIT_ERROR);
          }

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            const failure = await registerAuthFailure(rateLimitKey);

            if (failure.blocked) {
              throw new Error(AUTH_RATE_LIMIT_ERROR);
            }

            return null;
          }

          const isPasswordValid = await compare(password, user.passwordHash);

          if (!isPasswordValid) {
            const failure = await registerAuthFailure(rateLimitKey);

            if (failure.blocked) {
              throw new Error(AUTH_RATE_LIMIT_ERROR);
            }

            return null;
          }

          await clearAuthRateLimit(rateLimitKey);

          return {
            id: user.id,
            email: user.email,
            name: user.username,
            username: user.username,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.username = user.username;
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub && token.email) {
          session.user.id = token.sub;
          session.user.email = token.email;
          session.user.username = String(token.username ?? session.user.name ?? "");
          session.user.name = session.user.username;
        }

        return session;
      },
    },
  };
}

export async function getAuthSession() {
  if (!isAuthAvailable()) {
    return null;
  }

  return getServerSession(getAuthOptions());
}

export async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const session = await getAuthSession();

  if (!session?.user?.id || !session.user.email || !session.user.username) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
  };
}
