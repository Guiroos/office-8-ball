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

const mockIsTeamMember = vi.fn();
const mockRemoveTeamMember = vi.fn();

vi.mock("@/lib/teams", () => ({
  isTeamMember: (...args: unknown[]) => mockIsTeamMember(...args),
  removeTeamMember: (...args: unknown[]) => mockRemoveTeamMember(...args),
}));

const fakeTeam = {
  id: "team-1",
  name: "encacapados",
  type: "solo",
  status: "active",
  createdBy: "user-abc",
  createdAt: "2026-03-22T00:00:00.000Z",
  updatedAt: "2026-03-22T00:00:00.000Z",
  members: [],
};

describe("DELETE /api/teams/:id/members/:userId", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockIsTeamMember.mockReset();
    mockRemoveTeamMember.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns 200 when member is successfully removed", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockRemoveTeamMember.mockResolvedValue(fakeTeam);

    const { DELETE } = await import("@/app/api/teams/[id]/members/[userId]/route");
    const response = await DELETE(
      new Request("http://localhost/api/teams/team-1/members/user-xyz", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "team-1", userId: "user-xyz" }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.team).toBeDefined();
  });

  it("returns 400 when domain error is propagated (e.g. cannot remove creator)", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockRemoveTeamMember.mockRejectedValue(new Error("Não é possível remover o criador do time."));

    const { DELETE } = await import("@/app/api/teams/[id]/members/[userId]/route");
    const response = await DELETE(
      new Request("http://localhost/api/teams/team-1/members/user-abc", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "team-1", userId: "user-abc" }) },
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 403 when user is not a team member", async () => {
    mockIsTeamMember.mockResolvedValue(false);

    const { DELETE } = await import("@/app/api/teams/[id]/members/[userId]/route");
    const response = await DELETE(
      new Request("http://localhost/api/teams/team-1/members/user-xyz", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "team-1", userId: "user-xyz" }) },
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 401 when not authenticated", async () => {
    currentUser = null;

    const { DELETE } = await import("@/app/api/teams/[id]/members/[userId]/route");
    const response = await DELETE(
      new Request("http://localhost/api/teams/team-1/members/user-xyz", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "team-1", userId: "user-xyz" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 503 without DATABASE_URL", async () => {
    delete process.env.DATABASE_URL;

    const { DELETE } = await import("@/app/api/teams/[id]/members/[userId]/route");
    const response = await DELETE(
      new Request("http://localhost/api/teams/team-1/members/user-xyz", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "team-1", userId: "user-xyz" }) },
    );

    expect(response.status).toBe(503);
  });
});
