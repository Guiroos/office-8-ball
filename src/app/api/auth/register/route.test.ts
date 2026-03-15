import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();
const deleteManyMock = vi.fn();
const findFirstMock = vi.fn();
const findUniqueMock = vi.fn();
const hashMock = vi.fn();
const upsertMock = vi.fn();

vi.mock("bcryptjs", () => ({
  hash: (...args: unknown[]) => hashMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    authRateLimit: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      upsert: (...args: unknown[]) => upsertMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
    },
    user: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      create: (...args: unknown[]) => createMock(...args),
    },
  },
}));

describe("/api/auth/register", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://local";
    process.env.NEXTAUTH_SECRET = "test-secret";
    findUniqueMock.mockReset();
    upsertMock.mockReset();
    deleteManyMock.mockReset();
    findFirstMock.mockReset();
    createMock.mockReset();
    hashMock.mockReset();
    vi.resetModules();
  });

  it("creates a user with normalized credentials and password hash", async () => {
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    findFirstMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "user-1",
      username: "gui.dev",
      email: "gui@office8ball.dev",
    });

    const route = await import("@/app/api/auth/register/route");

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Gui.Dev",
          email: "GUI@office8ball.dev",
          password: "secret123",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(hashMock).toHaveBeenCalledWith("secret123", 12);
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        OR: [{ email: "gui@office8ball.dev" }, { username: "gui.dev" }],
      },
      select: {
        email: true,
        username: true,
      },
    });
    expect(createMock).toHaveBeenCalled();
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        id: "register:gui@office8ball.dev:unknown",
      },
    });
    await expect(response.json()).resolves.toEqual({
      user: {
        id: "user-1",
        username: "gui.dev",
        email: "gui@office8ball.dev",
      },
    });
  });

  it("rejects invalid payloads with field errors", async () => {
    const route = await import("@/app/api/auth/register/route");

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "x",
          email: "invalido",
          password: "123",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Revise os campos obrigatorios antes de continuar.",
      fieldErrors: {
        username:
          "Use de 3 a 24 caracteres com letras, numeros, ponto, tracinho ou underscore.",
        email: "Informe um email valido.",
        password: "A senha precisa ter pelo menos 8 caracteres.",
      },
    });
  });

  it("accepts uppercase credentials because the shared schema normalizes them", async () => {
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    findFirstMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "user-1",
      username: "gui.dev",
      email: "gui@office8ball.dev",
    });

    const route = await import("@/app/api/auth/register/route");

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: " Gui.Dev ",
          email: " GUI@office8ball.dev ",
          password: "secret123",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        OR: [{ email: "gui@office8ball.dev" }, { username: "gui.dev" }],
      },
      select: {
        email: true,
        username: true,
      },
    });
  });

  it("rejects duplicated username or email", async () => {
    findUniqueMock.mockResolvedValue(null);
    findFirstMock.mockResolvedValue({
      username: "gui.dev",
      email: "gui@office8ball.dev",
    });

    const route = await import("@/app/api/auth/register/route");

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "gui.dev",
          email: "gui@office8ball.dev",
          password: "secret123",
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Ja existe uma conta com esses dados.",
      fieldErrors: {
        username: "Este username ja esta em uso.",
        email: "Este email ja esta em uso.",
      },
    });
    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: "register:gui@office8ball.dev:unknown" },
      create: expect.objectContaining({
        failCount: 1,
      }),
      update: expect.objectContaining({
        failCount: 1,
      }),
    });
  });

  it("returns 429 when register is already blocked", async () => {
    findUniqueMock.mockResolvedValue({
      blockedUntil: new Date(Date.now() + 60_000),
    });

    const route = await import("@/app/api/auth/register/route");

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "gui.dev",
          email: "gui@office8ball.dev",
          password: "secret123",
        }),
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: "Muitas tentativas seguidas. Aguarde um pouco antes de tentar novamente.",
      retryAfterSeconds: expect.any(Number),
    });
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("returns 503 when auth is unavailable", async () => {
    delete process.env.DATABASE_URL;
    const route = await import("@/app/api/auth/register/route");

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "gui.dev",
          email: "gui@office8ball.dev",
          password: "secret123",
        }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Autenticacao indisponivel sem DATABASE_URL configurado.",
    });
  });

  it("returns 503 when NEXTAUTH_SECRET is missing", async () => {
    delete process.env.NEXTAUTH_SECRET;
    const route = await import("@/app/api/auth/register/route");

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "gui.dev",
          email: "gui@office8ball.dev",
          password: "secret123",
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "Configuracao de autenticacao invalida: defina NEXTAUTH_SECRET para usar o login.",
    });
  });
});
