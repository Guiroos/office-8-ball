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

const mockGetScoreboard = vi.fn();

vi.mock("@/lib/data", () => ({
  getScoreboard: (...args: unknown[]) => mockGetScoreboard(...args),
}));

const fakeScoreboard = {
  teams: [
    { id: "team-a", wins: 5, losses: 2 },
    { id: "team-b", wins: 2, losses: 5 },
  ],
  leaderTeamId: "team-a",
  leadBy: 3,
  totalMatches: 7,
};

describe("/api/scoreboard", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockGetScoreboard.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe("GET", () => {
    it("returns 200 with scoreboard data when authenticated", async () => {
      mockGetScoreboard.mockResolvedValue(fakeScoreboard);
      const { GET } = await import("@/app/api/scoreboard/route");
      const response = await GET();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.scoreboard).toBeDefined();
      expect(body.scoreboard.teams).toHaveLength(2);
      expect(body.scoreboard.leaderTeamId).toBe("team-a");
      expect(body.scoreboard.leadBy).toBe(3);
      expect(body.scoreboard.totalMatches).toBe(7);
      expect(mockGetScoreboard).toHaveBeenCalledWith("user-abc");
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { GET } = await import("@/app/api/scoreboard/route");
      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("returns 503 when DATABASE_URL is missing", async () => {
      delete process.env.DATABASE_URL;
      const { GET } = await import("@/app/api/scoreboard/route");
      const response = await GET();
      expect(response.status).toBe(503);
    });

    it("returns empty scoreboard when user has no teams", async () => {
      mockGetScoreboard.mockResolvedValue({
        teams: [],
        leaderTeamId: null,
        leadBy: 0,
        totalMatches: 0,
      });
      const { GET } = await import("@/app/api/scoreboard/route");
      const response = await GET();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.scoreboard.teams).toHaveLength(0);
      expect(body.scoreboard.leaderTeamId).toBeNull();
    });
  });
});
