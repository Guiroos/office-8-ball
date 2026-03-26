import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockTeamFindUnique = vi.fn();
const mockUserFindMany = vi.fn();
const mockMatchFindMany = vi.fn();
const mockListUserTeams = vi.fn();
const mockListAllTeamsWithStats = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
    },
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    match: {
      findMany: (...args: unknown[]) => mockMatchFindMany(...args),
    },
  },
}));

vi.mock("@/lib/teams", async () => {
  const actual = await vi.importActual<typeof import("@/lib/teams")>("@/lib/teams");
  return {
    ...actual,
    listUserTeams: (...args: unknown[]) => mockListUserTeams(...args),
  };
});

vi.mock("@/lib/ranking", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ranking")>("@/lib/ranking");
  return {
    ...actual,
    listAllTeamsWithStats: (...args: unknown[]) => mockListAllTeamsWithStats(...args),
  };
});

describe("getTeamDetailData", () => {
  beforeEach(() => {
    vi.resetModules();
    mockTeamFindUnique.mockReset();
    mockUserFindMany.mockReset();
    mockMatchFindMany.mockReset();
    mockListUserTeams.mockReset();
    mockListAllTeamsWithStats.mockReset();
    process.env.DATABASE_URL = "postgresql://test";
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns null for missing team", async () => {
    mockTeamFindUnique.mockResolvedValue(null);
    const { getTeamDetailData } = await import("@/lib/team-details");
    const result = await getTeamDetailData("team-a", "viewer-1");
    expect(result).toBeNull();
  });

  it("returns null for archived team", async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: "team-a",
      name: "Time A",
      type: "duo",
      status: "archived",
      createdBy: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      members: [],
    });

    const { getTeamDetailData } = await import("@/lib/team-details");
    const result = await getTeamDetailData("team-a", "viewer-1");
    expect(result).toBeNull();
  });

  it("returns members with display names and role labels", async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: "team-a",
      name: "Time A",
      type: "duo",
      status: "active",
      createdBy: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      members: [
        { userId: "user-1", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
        { userId: "user-2", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
      ],
    });
    mockUserFindMany.mockResolvedValue([
      { id: "user-1", username: "owner", displayName: "Owner Name" },
      { id: "user-2", username: "member", displayName: null },
    ]);
    mockListUserTeams.mockResolvedValue([]);
    mockListAllTeamsWithStats.mockResolvedValue([]);
    mockMatchFindMany.mockResolvedValue([]);

    const { getTeamDetailData } = await import("@/lib/team-details");
    const result = await getTeamDetailData("team-a", "viewer-1");

    expect(result?.members).toEqual([
      { userId: "user-1", username: "owner", displayName: "Owner Name", role: "Criador" },
      { userId: "user-2", username: "member", displayName: "member", role: "Membro" },
    ]);
  });

  it("includes ranking position when team exists in ranking list", async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: "team-a",
      name: "Time A",
      type: "duo",
      status: "active",
      createdBy: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      members: [{ userId: "user-1", joinedAt: new Date("2026-01-01T00:00:00.000Z") }],
    });
    mockUserFindMany.mockResolvedValue([{ id: "user-1", username: "owner", displayName: "Owner Name" }]);
    mockListUserTeams.mockResolvedValue([]);
    mockListAllTeamsWithStats.mockResolvedValue([
      { id: "team-z", rank: 1 },
      { id: "team-a", rank: 2 },
    ]);
    mockMatchFindMany.mockResolvedValue([]);

    const { getTeamDetailData } = await import("@/lib/team-details");
    const result = await getTeamDetailData("team-a", "viewer-1");

    expect(result?.rankingPosition).toBe(2);
  });

  it("limits rivals to viewer memberships excluding current team and picks primary by totalMatches", async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: "team-a",
      name: "Time A",
      type: "duo",
      status: "active",
      createdBy: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      members: [{ userId: "user-1", joinedAt: new Date("2026-01-01T00:00:00.000Z") }],
    });
    mockUserFindMany.mockResolvedValue([{ id: "user-1", username: "owner", displayName: null }]);
    mockListAllTeamsWithStats.mockResolvedValue([]);
    mockListUserTeams.mockResolvedValue([
      { id: "team-a", name: "Time A", type: "duo", status: "active", members: [], createdBy: "u", createdAt: "", updatedAt: "" },
      { id: "team-b", name: "Time B", type: "solo", status: "active", members: [], createdBy: "u", createdAt: "", updatedAt: "" },
      { id: "team-c", name: "Time C", type: "duo", status: "active", members: [], createdBy: "u", createdAt: "", updatedAt: "" },
    ]);
    mockMatchFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "m1",
          teamAId: "team-a",
          teamBId: "team-b",
          winnerTeamId: "team-a",
          playedAt: new Date("2026-01-10T00:00:00.000Z"),
          note: null,
        },
        {
          id: "m2",
          teamAId: "team-c",
          teamBId: "team-a",
          winnerTeamId: "team-c",
          playedAt: new Date("2026-01-11T00:00:00.000Z"),
          note: null,
        },
        {
          id: "m3",
          teamAId: "team-a",
          teamBId: "team-c",
          winnerTeamId: "team-a",
          playedAt: new Date("2026-01-12T00:00:00.000Z"),
          note: null,
        },
      ]);

    const { getTeamDetailData } = await import("@/lib/team-details");
    const result = await getTeamDetailData("team-a", "viewer-1");

    expect(result?.rivals.map((rival) => rival.id)).toEqual(["team-b", "team-c"]);
    expect(result?.primaryRivalId).toBe("team-c");
  });

  it("sets H2H lastMatchDate as ISO date when direct matches exist", async () => {
    mockTeamFindUnique.mockResolvedValue({
      id: "team-a",
      name: "Time A",
      type: "duo",
      status: "active",
      createdBy: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      members: [{ userId: "user-1", joinedAt: new Date("2026-01-01T00:00:00.000Z") }],
    });
    mockUserFindMany.mockResolvedValue([{ id: "user-1", username: "owner", displayName: null }]);
    mockListAllTeamsWithStats.mockResolvedValue([]);
    mockListUserTeams.mockResolvedValue([
      { id: "team-b", name: "Time B", type: "duo", status: "active", members: [], createdBy: "u", createdAt: "", updatedAt: "" },
    ]);
    mockMatchFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "m1",
          teamAId: "team-a",
          teamBId: "team-b",
          winnerTeamId: "team-a",
          playedAt: new Date("2026-01-15T12:00:00.000Z"),
          note: null,
        },
      ]);

    const { getTeamDetailData } = await import("@/lib/team-details");
    const result = await getTeamDetailData("team-a", "viewer-1");

    expect(result?.h2hByRival["team-b"]?.lastMatchDate).toBe("2026-01-15T12:00:00.000Z");
  });
});
