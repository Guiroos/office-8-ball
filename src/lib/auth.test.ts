import { beforeEach, describe, expect, it, vi } from "vitest";

const betterAuthMock = vi.fn();
const compareMock = vi.fn();
const getSessionMock = vi.fn();
const prismaAdapterMock = vi.fn();
const deleteManyMock = vi.fn();
const findUniqueRateLimitMock = vi.fn();
const findUniqueUserMock = vi.fn();
const upsertMock = vi.fn();

vi.mock("better-auth", () => ({
  betterAuth: (...args: unknown[]) => betterAuthMock(...args),
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: (...args: unknown[]) => prismaAdapterMock(...args),
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
    delete process.env.BETTER_AUTH_URL;
    delete process.env.NEXTAUTH_SECRET;
    betterAuthMock.mockReset();
    betterAuthMock.mockImplementation(() => ({
      api: {
        getSession: (...args: unknown[]) => getSessionMock(...args),
      },
    }));
    getSessionMock.mockReset();
    compareMock.mockReset();
    deleteManyMock.mockReset();
    prismaAdapterMock.mockReset();
    prismaAdapterMock.mockReturnValue({});
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

  it("configures prisma adapter with transactions disabled", async () => {
    await import("@/lib/auth");

    expect(prismaAdapterMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        provider: "postgresql",
        transaction: false,
      }),
    );
  });

  it("accepts request host origin and local host aliases as trusted origins", async () => {
    await import("@/lib/auth");

    const options = betterAuthMock.mock.calls[0]?.[0] as
      | {
          trustedOrigins?: (
            request?: Request,
          ) => string[] | Promise<Array<string | undefined | null>>;
        }
      | undefined;

    expect(typeof options?.trustedOrigins).toBe("function");

    const localOrigins = await options?.trustedOrigins?.(
      new Request("http://127.0.0.1:3000/api/auth/sign-out"),
    );

    expect(localOrigins).toContain("http://127.0.0.1:3000");
    expect(localOrigins).toContain("http://localhost:3000");

    const productionOrigins = await options?.trustedOrigins?.(
      new Request("https://office-8-ball.example.com/api/auth/sign-out"),
    );

    expect(productionOrigins).toContain("https://office-8-ball.example.com");
  });

  it("returns null from getAuthenticatedUser when session is unavailable", async () => {
    const auth = await import("@/lib/auth");
    const user = await auth.getAuthenticatedUser();

    expect(user).toBeNull();
    expect(findUniqueUserMock).not.toHaveBeenCalled();
  });
});
