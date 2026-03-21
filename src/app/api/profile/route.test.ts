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
    vi.resetModules();
    delete process.env.DATABASE_URL;
    currentUser = { id: "user-1", username: "gui.dev", email: "gui@office8ball.dev" };
    mockFindUnique.mockResolvedValue(MOCK_DB_USER);
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

describe("PUT /api/profile", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.DATABASE_URL;
    currentUser = { id: "user-1", username: "gui.dev", email: "gui@office8ball.dev" };
    mockUpdate.mockResolvedValue({ ...MOCK_DB_USER, displayName: "Novo Nome" });
  });

  it("returns 503 when DATABASE_URL is not set", async () => {
    const route = await import("@/app/api/profile/route");
    const response = await route.PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Novo Nome" }),
      }),
    );
    expect(response.status).toBe(503);
  });

  it("returns 401 when user is not authenticated", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    currentUser = null;
    const route = await import("@/app/api/profile/route");
    const response = await route.PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Novo Nome" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 when displayName is too short", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    const route = await import("@/app/api/profile/route");
    const response = await route.PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "x" }),
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when displayName is too long", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    const route = await import("@/app/api/profile/route");
    const response = await route.PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "x".repeat(51) }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("updates and returns the profile on valid input", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    const route = await import("@/app/api/profile/route");
    const response = await route.PUT(
      new Request("http://localhost/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Novo Nome" }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.displayName).toBe("Novo Nome");
  });
});
