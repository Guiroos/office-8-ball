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
const mockArchiveTeam = vi.fn();

vi.mock("@/lib/teams", () => ({
  getTeamById: (...args: unknown[]) => mockGetTeamById(...args),
  isTeamMember: (...args: unknown[]) => mockIsTeamMember(...args),
  archiveTeam: (...args: unknown[]) => mockArchiveTeam(...args),
}));

const activeTeam = {
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

const archivedTeam = { ...activeTeam, status: "archived" };

describe("PATCH /api/teams/:id/archive", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockGetTeamById.mockReset();
    mockIsTeamMember.mockReset();
    mockArchiveTeam.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("archives the team and returns 200", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockGetTeamById.mockResolvedValue(activeTeam);
    mockArchiveTeam.mockResolvedValue(archivedTeam);

    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/team-1/archive"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.team.status).toBe("archived");
  });

  it("is idempotent — returns 200 when team is already archived", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockGetTeamById.mockResolvedValue(archivedTeam);

    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/team-1/archive"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockArchiveTeam).not.toHaveBeenCalled();
  });

  it("returns 403 before checking idempotency — non-member gets 403 even if archived", async () => {
    mockIsTeamMember.mockResolvedValue(false);
    // getTeamById should NOT be called — membership check short-circuits

    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/team-1/archive"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(403);
    expect(mockGetTeamById).not.toHaveBeenCalled();
  });

  it("returns 404 when team does not exist and user is a member", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockGetTeamById.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/no-team/archive"), {
      params: Promise.resolve({ id: "no-team" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    currentUser = null;
    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/team-1/archive"), {
      params: Promise.resolve({ id: "team-1" }),
    });
    expect(response.status).toBe(401);
  });
});
