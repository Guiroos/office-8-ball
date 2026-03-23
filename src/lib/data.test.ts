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
});
