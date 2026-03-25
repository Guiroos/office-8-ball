import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma — never import real Prisma in tests
const mockTeamMemberFindUnique = vi.fn();
const mockTeamMemberCreate = vi.fn();
const mockTeamMemberDelete = vi.fn();
const mockTeamFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    teamMember: {
      findUnique: (...args: unknown[]) => mockTeamMemberFindUnique(...args),
      create: (...args: unknown[]) => mockTeamMemberCreate(...args),
      delete: (...args: unknown[]) => mockTeamMemberDelete(...args),
    },
    team: {
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
    },
  },
}));

const TEAM_BASE = {
  id: "team-1",
  name: "team alpha",
  type: "duo" as const,
  status: "active",
  createdBy: "user-creator",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const makeTeam = (
  overrides: Partial<typeof TEAM_BASE & { members: { userId: string; joinedAt: Date }[] }> = {},
) => ({
  ...TEAM_BASE,
  members: [{ userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") }],
  ...overrides,
});

describe("teams.ts — member management", () => {
  beforeEach(() => {
    vi.resetModules();
    mockTeamMemberFindUnique.mockReset();
    mockTeamMemberCreate.mockReset();
    mockTeamMemberDelete.mockReset();
    mockTeamFindUnique.mockReset();
  });

  describe("addTeamMember", () => {
    it("adds a user to a team and returns updated TeamRecord", async () => {
      const { addTeamMember } = await import("@/lib/teams");

      // No existing membership
      mockTeamMemberFindUnique.mockResolvedValueOnce(null);
      // Create succeeds
      mockTeamMemberCreate.mockResolvedValueOnce({});
      // Return team with new member
      const updatedTeam = makeTeam({
        members: [
          { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
          { userId: "user-new", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
        ],
      });
      mockTeamFindUnique.mockResolvedValueOnce(updatedTeam);

      const result = await addTeamMember("team-1", "user-new");

      expect(result.members).toHaveLength(2);
      expect(result.members.map((m) => m.userId)).toContain("user-new");
    });

    it("throws if user is already a member", async () => {
      const { addTeamMember } = await import("@/lib/teams");

      // Existing membership found
      mockTeamMemberFindUnique.mockResolvedValueOnce({
        teamId: "team-1",
        userId: "user-creator",
      });

      await expect(addTeamMember("team-1", "user-creator")).rejects.toThrow(
        "Usuário já é membro deste time.",
      );
    });

    it("throws if team not found after adding member", async () => {
      const { addTeamMember } = await import("@/lib/teams");

      mockTeamMemberFindUnique.mockResolvedValueOnce(null);
      mockTeamMemberCreate.mockResolvedValueOnce({});
      mockTeamFindUnique.mockResolvedValueOnce(null);

      await expect(addTeamMember("team-nonexistent", "user-new")).rejects.toThrow(
        "Time não encontrado.",
      );
    });
  });

  describe("removeTeamMember", () => {
    it("removes a non-creator member from a duo team with 3+ members", async () => {
      const { removeTeamMember } = await import("@/lib/teams");

      // Duo team with 3 members — removing leaves 2 (valid for duo min=2)
      const teamWithThreeMembers = makeTeam({
        type: "duo",
        members: [
          { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
          { userId: "user-two", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
          { userId: "user-other", joinedAt: new Date("2026-01-03T00:00:00.000Z") },
        ],
      });
      // First findUnique: get team for checks
      mockTeamFindUnique.mockResolvedValueOnce(teamWithThreeMembers);
      mockTeamMemberDelete.mockResolvedValueOnce({});
      // Second findUnique: return updated team after deletion
      const teamAfterRemoval = makeTeam({
        type: "duo",
        members: [
          { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
          { userId: "user-two", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
        ],
      });
      mockTeamFindUnique.mockResolvedValueOnce(teamAfterRemoval);

      const result = await removeTeamMember("team-1", "user-other");

      expect(result.members).toHaveLength(2);
      expect(result.members.map((m) => m.userId)).not.toContain("user-other");
    });

    it("throws if attempting to remove the team creator", async () => {
      const { removeTeamMember } = await import("@/lib/teams");

      const team = makeTeam({
        members: [
          { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
          { userId: "user-other", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
        ],
      });
      mockTeamFindUnique.mockResolvedValueOnce(team);

      await expect(removeTeamMember("team-1", "user-creator")).rejects.toThrow(
        "Não é possível remover o criador do time.",
      );
    });

    it("throws if removal would violate minimum members for a duo team", async () => {
      const { removeTeamMember } = await import("@/lib/teams");

      // Duo team with exactly 2 members — removing would leave 1
      const team = makeTeam({
        type: "duo",
        members: [
          { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
          { userId: "user-other", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
        ],
      });
      mockTeamFindUnique.mockResolvedValueOnce(team);

      await expect(removeTeamMember("team-1", "user-other")).rejects.toThrow(
        "Time duo precisa ter pelo menos 2 membros.",
      );
    });

    it("throws if removal would violate minimum members for a solo team", async () => {
      const { removeTeamMember } = await import("@/lib/teams");

      // Solo team with 1 member — cannot remove
      const soloTeam = makeTeam({
        type: "solo",
        members: [
          { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
        ],
      });
      // Simulate a scenario: a 2nd member was added to a solo team (edge case)
      // The creator guard hits first for removing "user-creator"; test a non-creator on solo with 1 member
      // To test min-member for solo: team has 1 member, try to remove it (non-creator)
      const soloTeamWithExtra = {
        ...soloTeam,
        members: [{ userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") }],
      };
      mockTeamFindUnique.mockResolvedValueOnce({
        ...soloTeamWithExtra,
        // Pretend another user is createdBy to make the remover non-creator
        createdBy: "user-different-creator",
        members: [{ userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") }],
      });

      await expect(removeTeamMember("team-1", "user-creator")).rejects.toThrow(
        "Solo team precisa ter pelo menos 1 membro.",
      );
    });

    it("throws if team not found", async () => {
      const { removeTeamMember } = await import("@/lib/teams");

      mockTeamFindUnique.mockResolvedValueOnce(null);

      await expect(removeTeamMember("team-nonexistent", "user-other")).rejects.toThrow(
        "Time não encontrado.",
      );
    });

    it("allows removing a member from a duo team with 3+ members", async () => {
      const { removeTeamMember } = await import("@/lib/teams");

      // Duo team with 3 members — removing 1 still leaves 2 (valid)
      const team = makeTeam({
        type: "duo",
        members: [
          { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
          { userId: "user-two", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
          { userId: "user-three", joinedAt: new Date("2026-01-03T00:00:00.000Z") },
        ],
      });
      mockTeamFindUnique.mockResolvedValueOnce(team);
      mockTeamMemberDelete.mockResolvedValueOnce({});
      const teamAfterRemoval = makeTeam({
        type: "duo",
        members: [
          { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
          { userId: "user-two", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
        ],
      });
      mockTeamFindUnique.mockResolvedValueOnce(teamAfterRemoval);

      const result = await removeTeamMember("team-1", "user-three");

      expect(result.members).toHaveLength(2);
    });
  });
});
