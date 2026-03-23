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

const mockListMatches = vi.fn();
const mockCreateMatch = vi.fn();

vi.mock("@/lib/data", () => ({
  listMatches: (...args: unknown[]) => mockListMatches(...args),
  createMatch: (...args: unknown[]) => mockCreateMatch(...args),
}));

const mockIsTeamMember = vi.fn();

vi.mock("@/lib/teams", () => ({
  isTeamMember: (...args: unknown[]) => mockIsTeamMember(...args),
}));

// Mock Prisma for team status checks inline in the route
const mockTeamFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    team: {
      findMany: (...args: unknown[]) => mockTeamFindMany(...args),
    },
  },
}));

const fakeMatch = {
  id: "match-1",
  teamAId: "team-a",
  teamBId: "team-b",
  winnerTeamId: "team-a",
  loserTeamId: "team-b",
  playedAt: "2026-03-22T10:00:00.000Z",
  note: null,
};

describe("/api/matches", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockListMatches.mockReset();
    mockCreateMatch.mockReset();
    mockIsTeamMember.mockReset();
    mockTeamFindMany.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe("GET", () => {
    it("returns matches for the authenticated user's teams", async () => {
      mockListMatches.mockResolvedValue([fakeMatch]);

      const { GET } = await import("@/app/api/matches/route");
      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.matches).toHaveLength(1);
      expect(body.matches[0].teamAId).toBe("team-a");
      expect(mockListMatches).toHaveBeenCalledWith("user-abc");
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { GET } = await import("@/app/api/matches/route");
      const response = await GET();
      expect(response.status).toBe(401);
    });
  });

  describe("POST", () => {
    it("registers a match and returns 201", async () => {
      // Both teams are active
      mockTeamFindMany.mockResolvedValue([
        { id: "team-a", status: "active" },
        { id: "team-b", status: "active" },
      ]);
      // User is member of teamA
      mockIsTeamMember.mockResolvedValue(true);
      mockCreateMatch.mockResolvedValue({ match: fakeMatch });

      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-a",
          }),
        }),
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.match.winnerTeamId).toBe("team-a");
    });

    it("returns 400 when teamAId equals teamBId", async () => {
      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-a",
            winnerTeamId: "team-a",
          }),
        }),
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when winnerTeamId is not one of the two teams", async () => {
      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-c",
          }),
        }),
      );
      expect(response.status).toBe(400);
    });

    it("returns 422 when a team is archived", async () => {
      mockTeamFindMany.mockResolvedValue([
        { id: "team-a", status: "archived" },
        { id: "team-b", status: "active" },
      ]);

      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-a",
          }),
        }),
      );
      expect(response.status).toBe(422);
    });

    it("returns 403 when user is not a member of either team", async () => {
      mockTeamFindMany.mockResolvedValue([
        { id: "team-a", status: "active" },
        { id: "team-b", status: "active" },
      ]);
      mockIsTeamMember.mockResolvedValue(false);

      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-a",
          }),
        }),
      );
      expect(response.status).toBe(403);
    });

    it("returns 400 when note exceeds 140 characters", async () => {
      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-a",
            note: "x".repeat(141),
          }),
        }),
      );
      expect(response.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamAId: "a", teamBId: "b", winnerTeamId: "a" }),
        }),
      );
      expect(response.status).toBe(401);
    });
  });
});
