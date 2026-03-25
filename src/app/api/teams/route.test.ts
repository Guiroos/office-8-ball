import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const mockCreateTeam = vi.fn();
const mockListUserTeams = vi.fn();
const mockFindUserByUsername = vi.fn();
const mockFindUserById = vi.fn();

vi.mock("@/lib/teams", () => ({
  createTeam: (...args: unknown[]) => mockCreateTeam(...args),
  listUserTeams: (...args: unknown[]) => mockListUserTeams(...args),
  findUserByUsername: (...args: unknown[]) => mockFindUserByUsername(...args),
  findUserById: (...args: unknown[]) => mockFindUserById(...args),
}));

describe("/api/teams", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockCreateTeam.mockReset();
    mockListUserTeams.mockReset();
    mockFindUserByUsername.mockReset();
    mockFindUserById.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe("GET", () => {
    it("returns the authenticated user's teams", async () => {
      const fakeTeam = {
        id: "team-1",
        name: "encacapados",
        status: "active",
        createdBy: "user-abc",
        createdAt: "2026-03-22T00:00:00.000Z",
        updatedAt: "2026-03-22T00:00:00.000Z",
        members: [{ userId: "user-abc", joinedAt: "2026-03-22T00:00:00.000Z" }],
      };
      mockListUserTeams.mockResolvedValue([fakeTeam]);

      const { GET } = await import("@/app/api/teams/route");
      const response = await GET(new Request("http://localhost/api/teams"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.teams).toHaveLength(1);
      expect(body.teams[0].name).toBe("encacapados");
    });

    it("passes includeArchived param when query string is set", async () => {
      mockListUserTeams.mockResolvedValue([]);

      const { GET } = await import("@/app/api/teams/route");
      await GET(new Request("http://localhost/api/teams?includeArchived=true"));

      expect(mockListUserTeams).toHaveBeenCalledWith("user-abc", true);
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { GET } = await import("@/app/api/teams/route");
      const response = await GET(new Request("http://localhost/api/teams"));
      expect(response.status).toBe(401);
    });
  });

  describe("POST", () => {
    it("creates a duo team and returns 201", async () => {
      mockFindUserById.mockResolvedValue({ id: "user-xyz" });
      const fakeTeam = {
        id: "team-1",
        name: "encacapados",
        type: "duo",
        status: "active",
        createdBy: "user-abc",
        createdAt: "2026-03-22T00:00:00.000Z",
        updatedAt: "2026-03-22T00:00:00.000Z",
        members: [
          { userId: "user-abc", joinedAt: "2026-03-22T00:00:00.000Z" },
          { userId: "user-xyz", joinedAt: "2026-03-22T00:00:00.000Z" },
        ],
      };
      mockCreateTeam.mockResolvedValue(fakeTeam);

      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Encaçapados", type: "duo", secondMemberUserId: "user-xyz" }),
        }),
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.team.name).toBe("encacapados");
    });

    it("creates a solo team and returns 201", async () => {
      const fakeTeam = {
        id: "team-2",
        name: "solo squad",
        type: "solo",
        status: "active",
        createdBy: "user-abc",
        createdAt: "2026-03-22T00:00:00.000Z",
        updatedAt: "2026-03-22T00:00:00.000Z",
        members: [{ userId: "user-abc", joinedAt: "2026-03-22T00:00:00.000Z" }],
      };
      mockCreateTeam.mockResolvedValue(fakeTeam);

      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Solo Squad", type: "solo" }),
        }),
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.team.type).toBe("solo");
      expect(mockFindUserById).not.toHaveBeenCalled();
    });

    it("returns 400 when type is missing", async () => {
      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test", secondMemberUserId: "user-xyz" }),
        }),
      );

      expect(response.status).toBe(400);
    });

    it("returns 400 when duo team is missing secondMemberUserId", async () => {
      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test", type: "duo" }),
        }),
      );

      expect(response.status).toBe(400);
    });

    it("returns 404 when secondMemberUserId does not exist", async () => {
      mockFindUserById.mockResolvedValue(null);

      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test", type: "duo", secondMemberUserId: "user-ghost" }),
        }),
      );

      expect(response.status).toBe(404);
    });

    it("returns 400 when user tries to create a duo team with themselves", async () => {
      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Dupla", type: "duo", secondMemberUserId: "user-abc" }),
        }),
      );

      expect(response.status).toBe(400);
    });

    it("returns 400 when name is missing", async () => {
      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "duo", secondMemberUserId: "user-xyz" }),
        }),
      );

      expect(response.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test", type: "duo", secondMemberUserId: "user-xyz" }),
        }),
      );
      expect(response.status).toBe(401);
    });
  });
});
