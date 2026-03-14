import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextResponse } from "next/server";

import {
  validateLoginPayload,
} from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, SessionUser } from "@/lib/types";

const AUTH_SECRET_FALLBACK = "auth-disabled-missing-secret";
const AUTH_UNAVAILABLE_DATABASE_ERROR =
  "Autenticacao indisponivel sem DATABASE_URL configurado.";
const AUTH_UNAVAILABLE_SECRET_ERROR =
  "Autenticacao indisponivel sem NEXTAUTH_SECRET configurado.";
const AUTH_REQUIRED_ERROR = "Autenticacao obrigatoria.";

function getAuthSecret() {
  return process.env.NEXTAUTH_SECRET?.trim() || AUTH_SECRET_FALLBACK;
}

export function isAuthAvailable() {
  return Boolean(process.env.DATABASE_URL && process.env.NEXTAUTH_SECRET?.trim());
}

export function getAuthUnavailableError() {
  if (process.env.DATABASE_URL) {
    if (!process.env.NEXTAUTH_SECRET?.trim()) {
      return AUTH_UNAVAILABLE_SECRET_ERROR;
    }

    return null;
  }

  return AUTH_UNAVAILABLE_DATABASE_ERROR;
}

export function getAuthUnavailableResponse() {
  return NextResponse.json<ApiErrorResponse>(
    { error: getAuthUnavailableError() ?? AUTH_UNAVAILABLE_DATABASE_ERROR },
    { status: 503 },
  );
}

export function getAuthRequiredResponse() {
  return NextResponse.json<ApiErrorResponse>(
    { error: AUTH_REQUIRED_ERROR },
    { status: 401 },
  );
}

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: "jwt",
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
      async authorize(credentials) {
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
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

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

export async function getAuthSession() {
  if (!isAuthAvailable()) {
    return null;
  }

  return getServerSession(authOptions);
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
