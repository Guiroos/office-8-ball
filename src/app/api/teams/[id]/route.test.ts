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

const mockGetTeamById = vi.fn();
const mockIsTeamMember = vi.fn();

vi.mock("@/lib/teams", () => ({
  getTeamById: (...args: unknown[]) => mockGetTeamById(...args),
  isTeamMember: (...args: unknown[]) => mockIsTeamMember(...args),
}));

const fakeTeam = {
  id: "team-1",
  name: "encacapados",
  status: "active",
  createdBy: "user-abc",
  createdAt: "2026-03-22T00:00:00.000Z",
  updatedAt: "2026-03-22T00:00:00.000Z",
  members: [
    { userId: "user-abc", joinedAt: "2026-03-22T00:00:00.000Z" },
    { userId: "user-xyz", joinedAt: "2026-03-22T00:00:00.000Z" },
  ],
};

describe("GET /api/teams/:id", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockGetTeamById.mockReset();
    mockIsTeamMember.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns the team when user is a member", async () => {
    mockGetTeamById.mockResolvedValue(fakeTeam);
    mockIsTeamMember.mockResolvedValue(true);

    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/team-1"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.team.id).toBe("team-1");
  });

  it("returns 403 when user is not a member (team exists)", async () => {
    mockIsTeamMember.mockResolvedValue(false);
    // getTeamById should NOT be called — membership check short-circuits

    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/team-1"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(403);
    expect(mockGetTeamById).not.toHaveBeenCalled();
  });

  it("returns 403 for non-member querying a non-existent team ID (prevents enumeration)", async () => {
    mockIsTeamMember.mockResolvedValue(false);

    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/no-team"), {
      params: Promise.resolve({ id: "no-team" }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 404 when team does not exist and user is a member (edge case)", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockGetTeamById.mockResolvedValue(null);

    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/no-team"), {
      params: Promise.resolve({ id: "no-team" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    currentUser = null;
    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/team-1"), {
      params: Promise.resolve({ id: "team-1" }),
    });
    expect(response.status).toBe(401);
  });
});
