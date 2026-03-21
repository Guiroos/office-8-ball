import { beforeEach, describe, expect, it, vi } from "vitest";

let currentUser: { id: string; username: string; email: string } | null = {
  id: "user-1",
  username: "gui.dev",
  email: "gui@office8ball.dev",
};

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

const MOCK_DB_USER = {
  id: "user-1",
  username: "gui.dev",
  email: "gui@office8ball.dev",
  displayName: "Guilherme",
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  passwordHash: "hash",
};

describe("GET /api/profile", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    currentUser = { id: "user-1", username: "gui.dev", email: "gui@office8ball.dev" };
    mockFindUnique.mockResolvedValue(MOCK_DB_USER);
    vi.resetModules();
  });

  it("returns 503 when DATABASE_URL is not set", async () => {
    const route = await import("@/app/api/profile/route");
    const response = await route.GET();
    expect(response.status).toBe(503);
  });

  it("returns 401 when user is not authenticated", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    currentUser = null;
    const route = await import("@/app/api/profile/route");
    const response = await route.GET();
    expect(response.status).toBe(401);
  });

  it("returns the profile for an authenticated user", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    const route = await import("@/app/api/profile/route");
    const response = await route.GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: "user-1",
      username: "gui.dev",
      email: "gui@office8ball.dev",
      displayName: "Guilherme",
    });
    expect(typeof body.createdAt).toBe("string");
  });
});
