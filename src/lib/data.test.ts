import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    teamMember: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    match: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

describe("data.ts", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindMany.mockReset();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe("listMatches", () => {
    it("returns empty array when DATABASE_URL is not set", async () => {
      delete process.env.DATABASE_URL;
      const { listMatches } = await import("@/lib/data");
      const result = await listMatches("user-abc");
      expect(result).toEqual([]);
      expect(mockFindMany).not.toHaveBeenCalled();
    });

    it("returns empty array when user has no team memberships", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      mockFindMany.mockResolvedValueOnce([]); // teamMember.findMany returns no memberships

      const { listMatches } = await import("@/lib/data");
      const result = await listMatches("user-abc");
      expect(result).toEqual([]);
    });

    it("derives loserTeamId from teamAId/teamBId/winnerTeamId", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      // First call: teamMember.findMany
      mockFindMany.mockResolvedValueOnce([{ teamId: "team-a" }]);
      // Second call: match.findMany
      mockFindMany.mockResolvedValueOnce([
        {
          id: "match-1",
          teamAId: "team-a",
          teamBId: "team-b",
          winnerTeamId: "team-a",
          playedAt: new Date("2026-03-22T10:00:00.000Z"),
          note: null,
        },
      ]);

      const { listMatches } = await import("@/lib/data");
      const result = await listMatches("user-abc");
      expect(result[0].loserTeamId).toBe("team-b");
    });
  });

  describe("createMatch", () => {
    it("returns the created match with derived loserTeamId", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      mockFindMany.mockResolvedValueOnce({
        id: "match-1",
        teamAId: "team-a",
        teamBId: "team-b",
        winnerTeamId: "team-b",
        playedAt: new Date("2026-03-22T10:00:00.000Z"),
        note: null,
      });

      const { createMatch } = await import("@/lib/data");
      const result = await createMatch({
        teamAId: "team-a",
        teamBId: "team-b",
        winnerTeamId: "team-b",
      });
      expect(result.match.loserTeamId).toBe("team-a");
    });
  });

  describe("getScoreboard", () => {
    it("returns empty scoreboard when DATABASE_URL is not set", async () => {
      delete process.env.DATABASE_URL;
      const { getScoreboard } = await import("@/lib/data");
      const result = await getScoreboard("user-abc");
      expect(result).toEqual({
        teams: [],
        leaderTeamId: null,
        leadBy: 0,
        totalMatches: 0,
      });
      expect(mockFindMany).not.toHaveBeenCalled();
    });

    it("returns empty scoreboard when user has no team memberships", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      mockFindMany.mockResolvedValueOnce([]); // teamMember.findMany → no memberships
      const { getScoreboard } = await import("@/lib/data");
      const result = await getScoreboard("user-abc");
      expect(result).toEqual({
        teams: [],
        leaderTeamId: null,
        leadBy: 0,
        totalMatches: 0,
      });
    });

    it("computes wins and losses for each team from match history", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      // teamMember.findMany returns memberships for two teams
      mockFindMany.mockResolvedValueOnce([
        { teamId: "team-a" },
        { teamId: "team-b" },
      ]);
      // match.findMany returns 3 matches: team-a wins 2, team-b wins 1
      mockFindMany.mockResolvedValueOnce([
        { id: "m1", teamAId: "team-a", teamBId: "team-b", winnerTeamId: "team-a", playedAt: new Date(), note: null },
        { id: "m2", teamAId: "team-a", teamBId: "team-b", winnerTeamId: "team-a", playedAt: new Date(), note: null },
        { id: "m3", teamAId: "team-b", teamBId: "team-a", winnerTeamId: "team-b", playedAt: new Date(), note: null },
      ]);
      const { getScoreboard } = await import("@/lib/data");
      const result = await getScoreboard("user-abc");
      const teamA = result.teams.find((t) => t.id === "team-a");
      const teamB = result.teams.find((t) => t.id === "team-b");
      expect(teamA).toEqual({ id: "team-a", wins: 2, losses: 1 });
      expect(teamB).toEqual({ id: "team-b", wins: 1, losses: 2 });
      expect(result.leaderTeamId).toBe("team-a");
      expect(result.leadBy).toBe(1);
      expect(result.totalMatches).toBe(3);
    });

    it("sets leaderTeamId to null when teams are tied", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      mockFindMany.mockResolvedValueOnce([{ teamId: "team-a" }, { teamId: "team-b" }]);
      mockFindMany.mockResolvedValueOnce([
        { id: "m1", teamAId: "team-a", teamBId: "team-b", winnerTeamId: "team-a", playedAt: new Date(), note: null },
        { id: "m2", teamAId: "team-b", teamBId: "team-a", winnerTeamId: "team-b", playedAt: new Date(), note: null },
      ]);
      const { getScoreboard } = await import("@/lib/data");
      const result = await getScoreboard("user-abc");
      expect(result.leaderTeamId).toBeNull();
      expect(result.leadBy).toBe(0);
    });

    it("does NOT call match.findMany with take() — no query limit", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      mockFindMany.mockResolvedValueOnce([{ teamId: "team-a" }]);
      mockFindMany.mockResolvedValueOnce([]);
      const { getScoreboard } = await import("@/lib/data");
      await getScoreboard("user-abc");
      // The second call is match.findMany; it must not include a 'take' key
      const matchQueryCall = mockFindMany.mock.calls[1]?.[0] as Record<string, unknown> | undefined;
      expect(matchQueryCall).toBeDefined();
      expect(matchQueryCall).not.toHaveProperty("take");
    });
  });
});
