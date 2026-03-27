import { describe, expect, it } from "vitest";
import {
  computeHeadToHead,
  computeTeamStats,
  HeadToHeadStatsSchema,
  TeamStatsSchema,
} from "@/lib/stats";
import type { MatchRecord } from "@/lib/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMatch(
  id: string,
  teamAId: string,
  teamBId: string,
  winnerTeamId: string,
  playedAt = "2026-03-25T10:00:00Z"
): MatchRecord {
  return {
    id,
    teamAId,
    teamBId,
    winnerTeamId,
    loserTeamId: winnerTeamId === teamAId ? teamBId : teamAId,
    playedAt,
    note: null,
  };
}

// ─── computeTeamStats ─────────────────────────────────────────────────────────

describe("computeTeamStats", () => {
  describe("SC-1: wins and losses", () => {
    it("counts wins and losses correctly from mixed match history", () => {
      const matches: MatchRecord[] = [
        makeMatch("m1", "team-a", "team-b", "team-a"),
        makeMatch("m2", "team-a", "team-b", "team-a"),
        makeMatch("m3", "team-b", "team-a", "team-b"),
      ];
      const result = computeTeamStats("team-a", matches);
      expect(result.wins).toBe(2);
      expect(result.losses).toBe(1);
    });

    it("excludes matches that do not involve the given team", () => {
      const matches: MatchRecord[] = [
        makeMatch("m1", "team-a", "team-b", "team-a"),
        makeMatch("m2", "team-c", "team-d", "team-c"), // unrelated
      ];
      const result = computeTeamStats("team-a", matches);
      expect(result.totalMatches).toBe(1);
    });
  });

  describe("SC-2: edge cases — zero matches", () => {
    it("returns 0% win rate and no streaks for zero matches", () => {
      const result = computeTeamStats("team-a", []);
      expect(result.wins).toBe(0);
      expect(result.losses).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.currentStreak).toEqual({ type: "none", count: 0 });
      expect(result.longestStreak).toEqual({ type: "none", count: 0 });
      expect(result.totalMatches).toBe(0);
      expect(result.lastFiveResults).toEqual([]);
    });
  });

  describe("SC-2: edge cases — single match", () => {
    it("returns 100% win rate and win streak of 1 for single win", () => {
      const result = computeTeamStats("team-a", [
        makeMatch("m1", "team-a", "team-b", "team-a"),
      ]);
      expect(result.winRate).toBe(100);
      expect(result.wins).toBe(1);
      expect(result.losses).toBe(0);
      expect(result.currentStreak).toEqual({ type: "win", count: 1 });
      expect(result.longestStreak).toEqual({ type: "win", count: 1 });
      expect(result.lastFiveResults).toEqual(["win"]);
    });

    it("returns 0% win rate and loss streak of 1 for single loss", () => {
      const result = computeTeamStats("team-a", [
        makeMatch("m1", "team-a", "team-b", "team-b"),
      ]);
      expect(result.winRate).toBe(0);
      expect(result.wins).toBe(0);
      expect(result.losses).toBe(1);
      expect(result.currentStreak).toEqual({ type: "loss", count: 1 });
      expect(result.longestStreak).toEqual({ type: "loss", count: 1 });
      expect(result.lastFiveResults).toEqual(["loss"]);
    });
  });

  describe("SC-2: edge cases — large dataset", () => {
    it("computes accurate aggregation for 100+ matches", () => {
      // 70 wins, 30 losses
      const matches: MatchRecord[] = Array.from({ length: 100 }, (_, i) =>
        makeMatch(
          `m${i}`,
          "team-a",
          "team-b",
          i < 70 ? "team-a" : "team-b",
          `2026-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`
        )
      );
      const result = computeTeamStats("team-a", matches);
      expect(result.wins).toBe(70);
      expect(result.losses).toBe(30);
      expect(result.winRate).toBeCloseTo(70, 5);
      expect(result.totalMatches).toBe(100);
      expect(result.lastFiveResults).toEqual(["win", "win", "win", "win", "win"]);
    });
  });

  describe("SC-3: streak detection — current streak", () => {
    it("detects 3-game winning streak as currentStreak win/3", () => {
      // Most recent first (descending playedAt order)
      const matches: MatchRecord[] = [
        makeMatch("m3", "team-a", "team-b", "team-a", "2026-03-25T10:00:00Z"),
        makeMatch("m2", "team-a", "team-b", "team-a", "2026-03-24T10:00:00Z"),
        makeMatch("m1", "team-a", "team-b", "team-a", "2026-03-23T10:00:00Z"),
      ];
      const result = computeTeamStats("team-a", matches);
      expect(result.currentStreak).toEqual({ type: "win", count: 3 });
      expect(result.longestStreak).toEqual({ type: "win", count: 3 });
    });

    it("detects current streak broken by loss: currentStreak is loss/1", () => {
      // Most recent first: loss, then two wins
      const matches: MatchRecord[] = [
        makeMatch("m3", "team-a", "team-b", "team-b", "2026-03-25T10:00:00Z"), // loss (most recent)
        makeMatch("m2", "team-a", "team-b", "team-a", "2026-03-24T10:00:00Z"), // win
        makeMatch("m1", "team-a", "team-b", "team-a", "2026-03-23T10:00:00Z"), // win
      ];
      const result = computeTeamStats("team-a", matches);
      expect(result.currentStreak).toEqual({ type: "loss", count: 1 });
      expect(result.longestStreak).toEqual({ type: "win", count: 2 });
    });
  });

  describe("SC-3: streak detection — longest streak", () => {
    it("detects longest streak correctly when it occurs in the middle of match history", () => {
      // Sequence (most recent first): win, loss, win, win, win, loss
      // currentStreak = win/1, longestStreak = win/3
      const matches: MatchRecord[] = [
        makeMatch("m6", "team-a", "team-b", "team-a", "2026-03-26T10:00:00Z"), // win
        makeMatch("m5", "team-a", "team-b", "team-b", "2026-03-25T10:00:00Z"), // loss
        makeMatch("m4", "team-a", "team-b", "team-a", "2026-03-24T10:00:00Z"), // win
        makeMatch("m3", "team-a", "team-b", "team-a", "2026-03-23T10:00:00Z"), // win
        makeMatch("m2", "team-a", "team-b", "team-a", "2026-03-22T10:00:00Z"), // win
        makeMatch("m1", "team-a", "team-b", "team-b", "2026-03-21T10:00:00Z"), // loss
      ];
      const result = computeTeamStats("team-a", matches);
      expect(result.currentStreak).toEqual({ type: "win", count: 1 });
      expect(result.longestStreak).toEqual({ type: "win", count: 3 });
    });

    it("longestStreak equals currentStreak when no streak break occurs", () => {
      const matches: MatchRecord[] = [
        makeMatch("m2", "team-a", "team-b", "team-a", "2026-03-25T10:00:00Z"),
        makeMatch("m1", "team-a", "team-b", "team-a", "2026-03-24T10:00:00Z"),
      ];
      const result = computeTeamStats("team-a", matches);
      expect(result.currentStreak).toEqual({ type: "win", count: 2 });
      expect(result.longestStreak).toEqual({ type: "win", count: 2 });
    });

    it("stores up to the 5 most recent results in descending order", () => {
      const matches: MatchRecord[] = [
        makeMatch("m6", "team-a", "team-b", "team-a", "2026-03-26T10:00:00Z"),
        makeMatch("m5", "team-a", "team-b", "team-b", "2026-03-25T10:00:00Z"),
        makeMatch("m4", "team-a", "team-b", "team-a", "2026-03-24T10:00:00Z"),
        makeMatch("m3", "team-a", "team-b", "team-b", "2026-03-23T10:00:00Z"),
        makeMatch("m2", "team-a", "team-b", "team-a", "2026-03-22T10:00:00Z"),
        makeMatch("m1", "team-a", "team-b", "team-b", "2026-03-21T10:00:00Z"),
      ];

      const result = computeTeamStats("team-a", matches);

      expect(result.lastFiveResults).toEqual(["win", "loss", "win", "loss", "win"]);
    });
  });
});

// ─── computeHeadToHead ────────────────────────────────────────────────────────

describe("computeHeadToHead", () => {
  describe("SC-4: head-to-head filtering", () => {
    it("filters to only matches between the two teams", () => {
      const matches: MatchRecord[] = [
        makeMatch("m1", "red", "blue", "red"),
        makeMatch("m2", "red", "green", "red"), // different opponent — excluded
        makeMatch("m3", "blue", "red", "blue"),
      ];
      const result = computeHeadToHead("red", "blue", matches);
      expect(result.totalMatches).toBe(2);
    });

    it("handles asymmetric team order — counts matches regardless of slot", () => {
      const matches: MatchRecord[] = [
        makeMatch("m1", "red", "blue", "red"),   // red wins (normal order)
        makeMatch("m2", "blue", "red", "blue"),   // blue wins (reversed order)
        makeMatch("m3", "red", "blue", "blue"),   // blue wins (normal order)
      ];
      const result = computeHeadToHead("red", "blue", matches);
      expect(result.teamAWins).toBe(1); // red wins
      expect(result.teamBWins).toBe(2); // blue wins
      expect(result.totalMatches).toBe(3);
    });

    it("teamAWins + teamBWins equals totalMatches", () => {
      const matches: MatchRecord[] = [
        makeMatch("m1", "red", "blue", "red"),
        makeMatch("m2", "blue", "red", "blue"),
        makeMatch("m3", "red", "blue", "red"),
      ];
      const result = computeHeadToHead("red", "blue", matches);
      expect(result.teamAWins + result.teamBWins).toBe(result.totalMatches);
    });

    it("returns zero stats for empty match array", () => {
      const result = computeHeadToHead("red", "blue", []);
      expect(result.teamAWins).toBe(0);
      expect(result.teamBWins).toBe(0);
      expect(result.totalMatches).toBe(0);
      expect(result.recentMatchIds).toEqual([]);
    });

    it("recentMatchIds contains at most 10 match IDs", () => {
      const matches: MatchRecord[] = Array.from({ length: 15 }, (_, i) =>
        makeMatch(`m${i}`, "red", "blue", "red", `2026-03-${String(i + 1).padStart(2, "0")}T10:00:00Z`)
      );
      const result = computeHeadToHead("red", "blue", matches);
      expect(result.recentMatchIds.length).toBe(10);
    });
  });
});

// ─── Zod schema validation ────────────────────────────────────────────────────

describe("SC-6: Zod output validation", () => {
  it("TeamStatsSchema rejects NaN win rate", () => {
    expect(() =>
      TeamStatsSchema.parse({
        teamId: "team-a",
        wins: 5,
        losses: 0,
        winRate: NaN,
        currentStreak: { type: "win", count: 5 },
        longestStreak: { type: "win", count: 5 },
        totalMatches: 5,
        lastFiveResults: ["win", "win", "win", "win", "win"],
      })
    ).toThrow();
  });

  it("TeamStatsSchema rejects negative win rate", () => {
    expect(() =>
      TeamStatsSchema.parse({
        teamId: "team-a",
        wins: 0,
        losses: 5,
        winRate: -1,
        currentStreak: { type: "loss", count: 5 },
        longestStreak: { type: "loss", count: 5 },
        totalMatches: 5,
        lastFiveResults: ["loss", "loss", "loss", "loss", "loss"],
      })
    ).toThrow();
  });

  it("TeamStatsSchema rejects win rate greater than 100", () => {
    expect(() =>
      TeamStatsSchema.parse({
        teamId: "team-a",
        wins: 5,
        losses: 0,
        winRate: 101,
        currentStreak: { type: "win", count: 5 },
        longestStreak: { type: "win", count: 5 },
        totalMatches: 5,
        lastFiveResults: ["win", "win", "win", "win", "win"],
      })
    ).toThrow();
  });

  it("TeamStatsSchema rejects negative streak count", () => {
    expect(() =>
      TeamStatsSchema.parse({
        teamId: "team-a",
        wins: 0,
        losses: 0,
        winRate: 0,
        currentStreak: { type: "none", count: -1 },
        longestStreak: { type: "none", count: 0 },
        totalMatches: 0,
        lastFiveResults: [],
      })
    ).toThrow();
  });

  it("computeTeamStats never returns NaN win rate for zero matches (Zod guard active)", () => {
    // This test verifies the production function uses the zero-guard before Zod validation
    const result = computeTeamStats("team-a", []);
    expect(result.winRate).toBe(0);
    expect(Number.isNaN(result.winRate)).toBe(false);
  });

  it("HeadToHeadStatsSchema validates correct head-to-head output", () => {
    expect(() =>
      HeadToHeadStatsSchema.parse({
        teamAId: "red",
        teamBId: "blue",
        teamAWins: 3,
        teamBWins: 2,
        totalMatches: 5,
        recentMatchIds: ["m1", "m2", "m3", "m4", "m5"],
      })
    ).not.toThrow();
  });
});
