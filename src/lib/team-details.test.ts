import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockTeamFindUnique = vi.fn();
const mockTeamFindMany = vi.fn();
const mockUserFindMany = vi.fn();
const mockMatchFindMany = vi.fn();
const mockListUserTeams = vi.fn();
const mockListAllTeamsWithStats = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
      findMany: (...args: unknown[]) => mockTeamFindMany(...args),
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
    mockTeamFindMany.mockReset();
    mockUserFindMany.mockReset();
    mockMatchFindMany.mockReset();
    mockListUserTeams.mockReset();
    mockListAllTeamsWithStats.mockReset();
    process.env.DATABASE_URL = "postgresql://test";
    mockTeamFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns kind=not-found for missing team", async () => {
    mockTeamFindUnique.mockResolvedValue(null);
    const { getTeamDetailData } = await import("@/lib/team-details");
    const result = await getTeamDetailData("team-a", "viewer-1");
    expect(result).toEqual({ kind: "not-found" });
  });

  it("returns kind=not-found for archived team", async () => {
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
    expect(result).toEqual({ kind: "not-found" });
  });

  it("returns kind=detail in read-only mode when viewer is not a member", async () => {
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
    mockListAllTeamsWithStats.mockResolvedValue([]);
    mockMatchFindMany.mockResolvedValue([]);
    mockUserFindMany.mockResolvedValue([
      { id: "user-1", username: "owner", displayName: "Owner Name" },
    ]);

    const { getTeamDetailData } = await import("@/lib/team-details");
    const result = await getTeamDetailData("team-a", "viewer-2");

    expect(result?.kind).toBe("detail");
    if (result?.kind !== "detail") return;
    expect(result.data.viewerCanManage).toBe(false);
    expect(result.data.members).toHaveLength(1);
    expect(mockListUserTeams).not.toHaveBeenCalled();
    expect(mockListAllTeamsWithStats).toHaveBeenCalledTimes(1);
    expect(mockMatchFindMany).toHaveBeenCalledTimes(1);
    expect(mockUserFindMany).toHaveBeenCalledTimes(1);
  });

  it("returns kind=detail with members for member viewer", async () => {
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
    const result = await getTeamDetailData("team-a", "user-1");

    expect(result?.kind).toBe("detail");
    if (result?.kind !== "detail") return;
    expect(result.data.viewerCanManage).toBe(true);
    expect(result.data.members).toEqual([
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
    const result = await getTeamDetailData("team-a", "user-1");

    expect(result?.kind).toBe("detail");
    if (result?.kind !== "detail") return;
    expect(result.data.rankingPosition).toBe(2);
  });

  it("builds rivals from available opponents and picks primary by totalMatches", async () => {
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
    const result = await getTeamDetailData("team-a", "user-1");

    expect(result?.kind).toBe("detail");
    if (result?.kind !== "detail") return;
    expect(result.data.rivals.map((rival) => rival.id)).toEqual(["team-b", "team-c"]);
    expect(result.data.rivals.find((rival) => rival.id === "team-b")?.memberLabels).toEqual([]);
    expect(result.data.primaryRivalId).toBe("team-c");
  });

  it("includes rivals from team match history even when viewer has only one team", async () => {
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
    ]);
    mockTeamFindMany.mockResolvedValue([
      {
        id: "team-a",
        name: "Time A",
        type: "duo",
        members: [],
      },
      {
        id: "team-b",
        name: "Time B",
        type: "solo",
        members: [],
      },
    ]);
    mockMatchFindMany
      .mockResolvedValueOnce([
        {
          id: "m1",
          teamAId: "team-a",
          teamBId: "team-b",
          winnerTeamId: "team-a",
          playedAt: new Date("2026-01-15T12:00:00.000Z"),
          note: null,
        },
      ])
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
    const result = await getTeamDetailData("team-a", "user-1");

    expect(result?.kind).toBe("detail");
    if (result?.kind !== "detail") return;
    expect(result.data.rivals.map((rival) => rival.id)).toEqual(["team-b"]);
    expect(result.data.rivals[0]?.memberLabels).toEqual([]);
    expect(result.data.primaryRivalId).toBe("team-b");
    expect(result.data.h2hByRival["team-b"]?.totalMatches).toBe(1);
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
    const result = await getTeamDetailData("team-a", "user-1");

    expect(result?.kind).toBe("detail");
    if (result?.kind !== "detail") return;
    expect(result.data.h2hByRival["team-b"]?.lastMatchDate).toBe("2026-01-15T12:00:00.000Z");
  });
});
