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
const mockFindUserById = vi.fn();
const mockAddTeamMember = vi.fn();

vi.mock("@/lib/teams", () => ({
  isTeamMember: (...args: unknown[]) => mockIsTeamMember(...args),
  findUserById: (...args: unknown[]) => mockFindUserById(...args),
  addTeamMember: (...args: unknown[]) => mockAddTeamMember(...args),
}));

const fakeTeam = {
  id: "team-1",
  name: "encacapados",
  type: "solo",
  status: "active",
  createdBy: "user-abc",
  createdAt: "2026-03-22T00:00:00.000Z",
  updatedAt: "2026-03-22T00:00:00.000Z",
  members: [
    { userId: "user-abc", joinedAt: "2026-03-22T00:00:00.000Z" },
  ],
};

describe("POST /api/teams/:id/members", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockIsTeamMember.mockReset();
    mockFindUserById.mockReset();
    mockAddTeamMember.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns 200 when member is successfully added", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockFindUserById.mockResolvedValue({ id: "user-xyz", username: "jean.dev" });
    mockAddTeamMember.mockResolvedValue(fakeTeam);

    const { POST } = await import("@/app/api/teams/[id]/members/route");
    const response = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-xyz" }),
      }),
      { params: Promise.resolve({ id: "team-1" }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.team).toBeDefined();
  });

  it("returns 400 for invalid payload (missing userId)", async () => {
    mockIsTeamMember.mockResolvedValue(true);

    const { POST } = await import("@/app/api/teams/[id]/members/route");
    const response = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "team-1" }) },
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 403 when user is not a team member", async () => {
    mockIsTeamMember.mockResolvedValue(false);

    const { POST } = await import("@/app/api/teams/[id]/members/route");
    const response = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-xyz" }),
      }),
      { params: Promise.resolve({ id: "team-1" }) },
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 404 when target user does not exist", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockFindUserById.mockResolvedValue(null);

    const { POST } = await import("@/app/api/teams/[id]/members/route");
    const response = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "no-such-user" }),
      }),
      { params: Promise.resolve({ id: "team-1" }) },
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 401 when not authenticated", async () => {
    currentUser = null;

    const { POST } = await import("@/app/api/teams/[id]/members/route");
    const response = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-xyz" }),
      }),
      { params: Promise.resolve({ id: "team-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 503 without DATABASE_URL", async () => {
    delete process.env.DATABASE_URL;

    const { POST } = await import("@/app/api/teams/[id]/members/route");
    const response = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-xyz" }),
      }),
      { params: Promise.resolve({ id: "team-1" }) },
    );

    expect(response.status).toBe(503);
  });

  it("returns 400 when addTeamMember throws a domain error", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockFindUserById.mockResolvedValue({ id: "user-xyz", username: "jean.dev" });
    mockAddTeamMember.mockRejectedValue(new Error("Usuário já é membro do time."));

    const { POST } = await import("@/app/api/teams/[id]/members/route");
    const response = await POST(
      new Request("http://localhost/api/teams/team-1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-xyz" }),
      }),
      { params: Promise.resolve({ id: "team-1" }) },
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Usuário já é membro");
  });
});
