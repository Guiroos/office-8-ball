import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

let currentUser: { id: string; username: string } | null = {
  id: "user-abc",
  username: "gui.dev",
};

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});

const mockFindUserByUsername = vi.fn();

vi.mock("@/lib/teams", () => ({
  findUserByUsername: (...args: unknown[]) => mockFindUserByUsername(...args),
}));

describe("GET /api/users", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockFindUserByUsername.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns user data when username is found", async () => {
    mockFindUserByUsername.mockResolvedValue({
      id: "user-xyz",
      username: "jean.dev",
      displayName: "Jean",
      avatarUrl: null,
    });

    const { GET } = await import("@/app/api/users/route");
    const response = await GET(new Request("http://localhost/api/users?username=jean.dev"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user.id).toBe("user-xyz");
    expect(body.user.username).toBe("jean.dev");
  });

  it("returns 404 when username is not found", async () => {
    mockFindUserByUsername.mockResolvedValue(null);

    const { GET } = await import("@/app/api/users/route");
    const response = await GET(new Request("http://localhost/api/users?username=ghost"));

    expect(response.status).toBe(404);
  });

  it("returns 400 when username param is missing", async () => {
    const { GET } = await import("@/app/api/users/route");
    const response = await GET(new Request("http://localhost/api/users"));

    expect(response.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    currentUser = null;
    const { GET } = await import("@/app/api/users/route");
    const response = await GET(new Request("http://localhost/api/users?username=jean.dev"));
    expect(response.status).toBe(401);
  });
});
