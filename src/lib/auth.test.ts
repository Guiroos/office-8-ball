import { beforeEach, describe, expect, it, vi } from "vitest";

const compareMock = vi.fn();
const getSessionMock = vi.fn();
const deleteManyMock = vi.fn();
const findUniqueRateLimitMock = vi.fn();
const findUniqueUserMock = vi.fn();
const upsertMock = vi.fn();

vi.mock("better-auth", () => ({
  betterAuth: () => ({
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  }),
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: () => ({}),
}));

vi.mock("better-auth/plugins", () => ({
  username: () => ({}),
}));

vi.mock("next/headers", () => ({
  headers: () => new Headers(),
}));

vi.mock("bcryptjs", () => ({
  compare: (...args: unknown[]) => compareMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    authRateLimit: {
      findUnique: (...args: unknown[]) => findUniqueRateLimitMock(...args),
      upsert: (...args: unknown[]) => upsertMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => findUniqueUserMock(...args),
    },
  },
}));

describe("auth helpers", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    getSessionMock.mockReset();
    compareMock.mockReset();
    deleteManyMock.mockReset();
    findUniqueRateLimitMock.mockReset();
    findUniqueUserMock.mockReset();
    upsertMock.mockReset();
    vi.resetModules();
  });

  it("reports auth as unavailable without a database url", async () => {
    const auth = await import("@/lib/auth");
    const response = auth.getAuthUnavailableResponse();

    expect(auth.hasDatabaseUrl()).toBe(false);
    expect(auth.hasAuthSecret()).toBe(false);
    expect(auth.isAuthAvailable()).toBe(false);
    expect(auth.getAuthUnavailableError()).toBe(
      "Autenticacao indisponivel sem DATABASE_URL configurado.",
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Autenticacao indisponivel sem DATABASE_URL configurado.",
    });
  });

  it("treats DATABASE_URL without auth secret as invalid config", async () => {
    process.env.DATABASE_URL = "postgres://local";

    const auth = await import("@/lib/auth");
    const response = auth.getAuthUnavailableResponse();

    expect(auth.hasDatabaseUrl()).toBe(true);
    expect(auth.hasAuthSecret()).toBe(false);
    expect(auth.isAuthAvailable()).toBe(false);
    expect(auth.getAuthUnavailableError()).toMatch(
      /Configuracao de autenticacao invalida/,
    );
    expect(response.status).toBe(500);
  });

  it("returns auth required response with 401 status", async () => {
    const auth = await import("@/lib/auth");
    const response = auth.getAuthRequiredResponse();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Autenticacao obrigatoria.",
    });
  });

  it("skips server session resolution when auth is unavailable", async () => {
    const auth = await import("@/lib/auth");
    const session = await auth.getAuthSession();

    expect(session).toBeNull();
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it("returns null from getAuthenticatedUser when session is unavailable", async () => {
    const auth = await import("@/lib/auth");
    const user = await auth.getAuthenticatedUser();

    expect(user).toBeNull();
    expect(findUniqueUserMock).not.toHaveBeenCalled();
  });
});
