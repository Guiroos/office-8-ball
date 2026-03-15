import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteManyMock = vi.fn();
const findUniqueMock = vi.fn();
const upsertMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    authRateLimit: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      upsert: (...args: unknown[]) => upsertMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
    },
  },
}));

describe("auth rate limit helpers", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    upsertMock.mockReset();
    deleteManyMock.mockReset();
  });

  it("uses the first forwarded ip and normalizes the email", async () => {
    const authRateLimit = await import("@/lib/auth-rate-limit");

    expect(
      authRateLimit.buildAuthRateLimitKey({
        action: "login",
        email: " GUI@office8ball.dev ",
        headers: {
          "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        },
      }),
    ).toEqual({
      id: "login:gui@office8ball.dev:203.0.113.10",
      action: "login",
      email: "gui@office8ball.dev",
      ip: "203.0.113.10",
    });
  });

  it("falls back to unknown ip when no headers are present", async () => {
    const authRateLimit = await import("@/lib/auth-rate-limit");

    expect(
      authRateLimit.buildAuthRateLimitKey({
        action: "register",
        email: "gui@office8ball.dev",
      }),
    ).toMatchObject({
      id: "register:gui@office8ball.dev:unknown",
      ip: "unknown",
    });
  });

  it("reports an active block with retryAfterSeconds", async () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    findUniqueMock.mockResolvedValue({
      blockedUntil: new Date("2026-03-15T12:05:30.000Z"),
    });
    const authRateLimit = await import("@/lib/auth-rate-limit");

    await expect(
      authRateLimit.getAuthRateLimitStatus(
        {
          id: "login:gui@office8ball.dev:unknown",
          action: "login",
          email: "gui@office8ball.dev",
          ip: "unknown",
        },
        now,
      ),
    ).resolves.toEqual({
      blocked: true,
      retryAfterSeconds: 330,
    });
  });

  it("starts a new failure window on the first failed attempt", async () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    findUniqueMock.mockResolvedValue(null);
    const authRateLimit = await import("@/lib/auth-rate-limit");

    await expect(
      authRateLimit.registerAuthFailure(
        {
          id: "login:gui@office8ball.dev:unknown",
          action: "login",
          email: "gui@office8ball.dev",
          ip: "unknown",
        },
        now,
      ),
    ).resolves.toEqual({
      blocked: false,
      retryAfterSeconds: 0,
    });

    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: "login:gui@office8ball.dev:unknown" },
      create: expect.objectContaining({
        failCount: 1,
        blockLevel: 0,
        windowStartedAt: now,
        blockedUntil: null,
        lastFailedAt: now,
      }),
      update: expect.objectContaining({
        failCount: 1,
        windowStartedAt: now,
        blockedUntil: null,
      }),
    });
  });

  it("blocks after the fifth failure and escalates the first block to 15 minutes", async () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    findUniqueMock.mockResolvedValue({
      id: "login:gui@office8ball.dev:unknown",
      action: "login",
      email: "gui@office8ball.dev",
      ip: "unknown",
      failCount: 4,
      blockLevel: 0,
      windowStartedAt: new Date("2026-03-15T11:55:00.000Z"),
      blockedUntil: null,
    });
    const authRateLimit = await import("@/lib/auth-rate-limit");

    await expect(
      authRateLimit.registerAuthFailure(
        {
          id: "login:gui@office8ball.dev:unknown",
          action: "login",
          email: "gui@office8ball.dev",
          ip: "unknown",
        },
        now,
      ),
    ).resolves.toEqual({
      blocked: true,
      retryAfterSeconds: 900,
    });

    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: "login:gui@office8ball.dev:unknown" },
      create: expect.objectContaining({
        failCount: 0,
        blockLevel: 1,
        blockedUntil: new Date("2026-03-15T12:15:00.000Z"),
      }),
      update: expect.objectContaining({
        failCount: 0,
        blockLevel: 1,
        blockedUntil: new Date("2026-03-15T12:15:00.000Z"),
      }),
    });
  });

  it("clears the stored limiter state on success", async () => {
    const authRateLimit = await import("@/lib/auth-rate-limit");

    await authRateLimit.clearAuthRateLimit({
      id: "register:gui@office8ball.dev:unknown",
      action: "register",
      email: "gui@office8ball.dev",
      ip: "unknown",
    });

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { id: "register:gui@office8ball.dev:unknown" },
    });
  });
});
