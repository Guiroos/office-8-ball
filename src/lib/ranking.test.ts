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
});
