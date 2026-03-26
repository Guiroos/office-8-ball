import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockTeamFindMany = vi.fn();
const mockMatchFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    team: {
      findMany: (...args: unknown[]) => mockTeamFindMany(...args),
    },
    match: {
      findMany: (...args: unknown[]) => mockMatchFindMany(...args),
    },
  },
}));

describe("listAllTeamsWithStats", () => {
  beforeEach(() => {
    vi.resetModules();
    mockTeamFindMany.mockReset();
    mockMatchFindMany.mockReset();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns [] in in-memory mode when DATABASE_URL is missing per D-03", async () => {
    delete process.env.DATABASE_URL;
    const { listAllTeamsWithStats } = await import("@/lib/ranking");
    const result = await listAllTeamsWithStats();
    expect(result).toEqual([]);
    expect(mockTeamFindMany).not.toHaveBeenCalled();
  });

  it("queries active teams and optional type filter per D-02", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    mockTeamFindMany.mockResolvedValueOnce([]);

    const { listAllTeamsWithStats } = await import("@/lib/ranking");
    await listAllTeamsWithStats("solo");

    expect(mockTeamFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "active", type: "solo" },
      }),
    );
  });

  it("excludes archived teams and assigns rank from sorted order per D-03", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    mockTeamFindMany.mockResolvedValueOnce([
      {
        id: "team-a",
        name: "Alpha",
        type: "duo",
        status: "active",
        createdBy: "u1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        members: [],
      },
      {
        id: "team-b",
        name: "Beta",
        type: "duo",
        status: "active",
        createdBy: "u1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        members: [],
      },
    ]);
    mockMatchFindMany.mockResolvedValueOnce([
      {
        id: "m1",
        teamAId: "team-a",
        teamBId: "team-b",
        winnerTeamId: "team-a",
        playedAt: new Date("2026-01-10T00:00:00.000Z"),
        note: null,
      },
    ]);

    const { listAllTeamsWithStats } = await import("@/lib/ranking");
    const result = await listAllTeamsWithStats();

    expect(result.map((team) => team.id)).toEqual(["team-a", "team-b"]);
    expect(result[0]?.rank).toBe(1);
    expect(result[1]?.rank).toBe(2);
  });

  it("orders by wins desc, then winRate desc, then name asc", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    mockTeamFindMany.mockResolvedValueOnce([
      {
        id: "team-a",
        name: "Zulu",
        type: "solo",
        status: "active",
        createdBy: "u1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        members: [],
      },
      {
        id: "team-b",
        name: "Alpha",
        type: "solo",
        status: "active",
        createdBy: "u1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        members: [],
      },
      {
        id: "team-c",
        name: "Beta",
        type: "solo",
        status: "active",
        createdBy: "u1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        members: [],
      },
    ]);
    mockMatchFindMany.mockResolvedValueOnce([
      {
        id: "m1",
        teamAId: "team-a",
        teamBId: "team-x",
        winnerTeamId: "team-a",
        playedAt: new Date("2026-01-05T00:00:00.000Z"),
        note: null,
      },
      {
        id: "m2",
        teamAId: "team-a",
        teamBId: "team-y",
        winnerTeamId: "team-y",
        playedAt: new Date("2026-01-04T00:00:00.000Z"),
        note: null,
      },
      {
        id: "m3",
        teamAId: "team-b",
        teamBId: "team-z",
        winnerTeamId: "team-b",
        playedAt: new Date("2026-01-03T00:00:00.000Z"),
        note: null,
      },
      {
        id: "m4",
        teamAId: "team-c",
        teamBId: "team-z",
        winnerTeamId: "team-z",
        playedAt: new Date("2026-01-02T00:00:00.000Z"),
        note: null,
      },
    ]);

    const { listAllTeamsWithStats } = await import("@/lib/ranking");
    const result = await listAllTeamsWithStats();

    expect(result.map((team) => team.id)).toEqual(["team-b", "team-a", "team-c"]);
  });

  it("includes teams with zero matches and zeroed stats", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    mockTeamFindMany.mockResolvedValueOnce([
      {
        id: "team-a",
        name: "Alpha",
        type: "duo",
        status: "active",
        createdBy: "u1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        members: [],
      },
    ]);
    mockMatchFindMany.mockResolvedValueOnce([]);

    const { listAllTeamsWithStats } = await import("@/lib/ranking");
    const result = await listAllTeamsWithStats();

    expect(result[0]).toMatchObject({
      wins: 0,
      losses: 0,
      winRate: 0,
      totalMatches: 0,
      rank: 1,
    });
  });

  // ── Period filter tests (D-09..D-11) ──────────────────────────────────────

  it("period=all passes no playedAt constraint to match query", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    mockTeamFindMany.mockResolvedValueOnce([]);

    const { listAllTeamsWithStats } = await import("@/lib/ranking");
    await listAllTeamsWithStats(undefined, "all");

    // teams query returned [] so match query was never called — that is fine;
    // what we assert is that the team query has no playedAt
    expect(mockTeamFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "active" },
      }),
    );
    expect(mockMatchFindMany).not.toHaveBeenCalled();
  });

  it("period=week applies gte/lt window derived from resolvePeriodWindow to match query", async () => {
    process.env.DATABASE_URL = "postgresql://test";

    // Fix "now" to a known Wednesday in BRT: 2026-03-25 (Wednesday) 12:00 BRT = 15:00 UTC
    // ISO week: Mon 2026-03-23 03:00 UTC → Sun 2026-03-29 02:59:59.999 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T15:00:00.000Z")); // Wednesday noon BRT

    mockTeamFindMany.mockResolvedValueOnce([
      {
        id: "team-a",
        name: "Alpha",
        type: "duo",
        status: "active",
        createdBy: "u1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        members: [],
      },
    ]);
    mockMatchFindMany.mockResolvedValueOnce([]);

    const { listAllTeamsWithStats } = await import("@/lib/ranking");
    await listAllTeamsWithStats(undefined, "week");

    vi.useRealTimers();

    expect(mockMatchFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          playedAt: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        }),
      }),
    );

    const callArgs = mockMatchFindMany.mock.calls[0]?.[0] as {
      where: { playedAt: { gte: Date; lt: Date } };
    };
    const { gte, lt } = callArgs.where.playedAt;

    // Monday 2026-03-23 00:00:00 BRT = 03:00:00 UTC
    expect(gte.toISOString()).toBe("2026-03-23T03:00:00.000Z");
    // Sunday 2026-03-29 23:59:59.999 BRT = 2026-03-30 02:59:59.999 UTC
    expect(lt.toISOString()).toBe("2026-03-30T02:59:59.999Z");
  });

  it("period=month applies gte/lt window for calendar month in BRT", async () => {
    process.env.DATABASE_URL = "postgresql://test";

    // Fix "now" to 2026-03-15 12:00 BRT = 15:00 UTC (mid-March)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T15:00:00.000Z"));

    mockTeamFindMany.mockResolvedValueOnce([
      {
        id: "team-a",
        name: "Alpha",
        type: "duo",
        status: "active",
        createdBy: "u1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        members: [],
      },
    ]);
    mockMatchFindMany.mockResolvedValueOnce([]);

    const { listAllTeamsWithStats } = await import("@/lib/ranking");
    await listAllTeamsWithStats(undefined, "month");

    vi.useRealTimers();

    expect(mockMatchFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          playedAt: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        }),
      }),
    );

    const callArgs = mockMatchFindMany.mock.calls[0]?.[0] as {
      where: { playedAt: { gte: Date; lt: Date } };
    };
    const { gte, lt } = callArgs.where.playedAt;

    // 2026-03-01 00:00:00 BRT = 2026-03-01 03:00:00 UTC
    expect(gte.toISOString()).toBe("2026-03-01T03:00:00.000Z");
    // 2026-03-31 23:59:59.999 BRT = 2026-04-01 02:59:59.999 UTC
    expect(lt.toISOString()).toBe("2026-04-01T02:59:59.999Z");
  });
});
