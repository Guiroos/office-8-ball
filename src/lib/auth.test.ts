import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (config: unknown) => config,
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("auth helpers", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    getServerSessionMock.mockReset();
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

  it("treats DATABASE_URL without NEXTAUTH_SECRET as invalid config", async () => {
    process.env.DATABASE_URL = "postgres://local";

    const auth = await import("@/lib/auth");
    const response = auth.getAuthUnavailableResponse();

    expect(auth.hasDatabaseUrl()).toBe(true);
    expect(auth.hasAuthSecret()).toBe(false);
    expect(auth.isAuthAvailable()).toBe(false);
    expect(auth.getAuthUnavailableError()).toBe(
      "Configuracao de autenticacao invalida: defina NEXTAUTH_SECRET para usar o login.",
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "Configuracao de autenticacao invalida: defina NEXTAUTH_SECRET para usar o login.",
    });
    expect(() => auth.getAuthOptions()).toThrow(
      "Configuracao de autenticacao invalida: defina NEXTAUTH_SECRET para usar o login.",
    );
  });

  it("builds secure cookie options when auth is configured for production", async () => {
    process.env.DATABASE_URL = "postgres://local";
    process.env.NEXTAUTH_SECRET = "test-secret";
    process.env.NEXTAUTH_URL = "https://office8ball.example";

    const auth = await import("@/lib/auth");
    const options = auth.getAuthOptions();

    expect(options.secret).toBe("test-secret");
    expect(options.useSecureCookies).toBe(true);
    expect(options.cookies?.sessionToken?.name).toBe("__Secure-next-auth.session-token");
    expect(options.cookies?.sessionToken?.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    });
  });

  it("skips server session resolution when auth is unavailable", async () => {
    const auth = await import("@/lib/auth");
    const session = await auth.getAuthSession();

    expect(session).toBeNull();
    expect(getServerSessionMock).not.toHaveBeenCalled();
  });

  it("resolves the server session with explicit auth options when configured", async () => {
    process.env.DATABASE_URL = "postgres://local";
    process.env.NEXTAUTH_SECRET = "test-secret";
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    const auth = await import("@/lib/auth");
    await auth.getAuthSession();

    expect(getServerSessionMock).toHaveBeenCalledTimes(1);
    expect(getServerSessionMock.mock.calls[0]?.[0]).toMatchObject({
      secret: "test-secret",
      pages: {
        signIn: "/login",
      },
    });
    expect(getServerSessionMock.mock.calls[0]?.[0]?.cookies?.sessionToken?.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  });
});
