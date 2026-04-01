import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma — never import real Prisma in tests
const mockTeamMemberFindUnique = vi.fn();
const mockTeamMemberFindMany = vi.fn();
const mockTeamMemberCreate = vi.fn();
const mockTeamMemberDeleteMany = vi.fn();
const mockTeamMemberDelete = vi.fn();
const mockTeamCreate = vi.fn();
const mockTeamFindUnique = vi.fn();
const mockTeamUpdate = vi.fn();
const mockTeamDelete = vi.fn();
const mockMatchFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    teamMember: {
      findUnique: (...args: unknown[]) => mockTeamMemberFindUnique(...args),
      findMany: (...args: unknown[]) => mockTeamMemberFindMany(...args),
      create: (...args: unknown[]) => mockTeamMemberCreate(...args),
      deleteMany: (...args: unknown[]) => mockTeamMemberDeleteMany(...args),
      delete: (...args: unknown[]) => mockTeamMemberDelete(...args),
    },
    team: {
      create: (...args: unknown[]) => mockTeamCreate(...args),
      findUnique: (...args: unknown[]) => mockTeamFindUnique(...args),
      update: (...args: unknown[]) => mockTeamUpdate(...args),
      delete: (...args: unknown[]) => mockTeamDelete(...args),
    },
    match: {
      findMany: (...args: unknown[]) => mockMatchFindMany(...args),
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
  overrides: Partial<
    Omit<typeof TEAM_BASE, "type"> & {
      type: "solo" | "duo";
      members: { userId: string; joinedAt: Date }[];
    }
  > = {},
) => ({
  ...TEAM_BASE,
  members: [{ userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") }],
  ...overrides,
});

describe("teams.ts — member management", () => {
  beforeEach(() => {
    vi.resetModules();
    mockTeamMemberFindUnique.mockReset();
    mockTeamMemberFindMany.mockReset();
    mockTeamMemberCreate.mockReset();
    mockTeamMemberDeleteMany.mockReset();
    mockTeamMemberDelete.mockReset();
    mockTeamCreate.mockReset();
    mockTeamFindUnique.mockReset();
    mockTeamUpdate.mockReset();
    mockTeamDelete.mockReset();
    mockMatchFindMany.mockReset();
  });

  describe("createTeam", () => {
    it("creates a solo team with creator membership in sequential writes", async () => {
      const { createTeam } = await import("@/lib/teams");

      mockTeamCreate.mockResolvedValueOnce({
        id: "team-1",
      });
      mockTeamMemberCreate.mockResolvedValueOnce({});
      mockTeamFindUnique.mockResolvedValueOnce(makeTeam());

      const result = await createTeam({
        name: " Team Alpha ",
        createdBy: "user-creator",
        type: "solo",
      });

      expect(result.id).toBe("team-1");
      expect(mockTeamCreate).toHaveBeenCalledWith({
        data: {
          name: "team alpha",
          type: "solo",
          createdBy: "user-creator",
        },
      });
      expect(mockTeamMemberCreate).toHaveBeenCalledTimes(1);
      expect(mockTeamMemberCreate).toHaveBeenCalledWith({
        data: {
          teamId: "team-1",
          userId: "user-creator",
        },
      });
      expect(mockTeamFindUnique).toHaveBeenCalledWith({
        where: { id: "team-1" },
        include: { members: true },
      });
    });

    it("creates duo second member without nested relation writes", async () => {
      const { createTeam } = await import("@/lib/teams");

      mockTeamCreate.mockResolvedValueOnce({
        id: "team-1",
      });
      mockTeamMemberCreate.mockResolvedValue({});
      mockTeamFindUnique.mockResolvedValueOnce(
        makeTeam({
          members: [
            { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
            { userId: "user-second", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
          ],
        }),
      );

      const result = await createTeam({
        name: "dupla",
        createdBy: "user-creator",
        type: "duo",
        secondMemberUserId: "user-second",
      });

      expect(result.members).toHaveLength(2);
      expect(mockTeamMemberCreate).toHaveBeenCalledTimes(2);
      expect(mockTeamMemberCreate).toHaveBeenNthCalledWith(1, {
        data: {
          teamId: "team-1",
          userId: "user-creator",
        },
      });
      expect(mockTeamMemberCreate).toHaveBeenNthCalledWith(2, {
        data: {
          teamId: "team-1",
          userId: "user-second",
        },
      });
    });

    it("rolls back created records when membership creation fails", async () => {
      const { createTeam } = await import("@/lib/teams");

      const expectedError = new Error("membership insert failed");
      mockTeamCreate.mockResolvedValueOnce({ id: "team-1" });
      mockTeamMemberCreate.mockRejectedValueOnce(expectedError);
      mockTeamMemberDeleteMany.mockResolvedValueOnce({ count: 0 });
      mockTeamDelete.mockResolvedValueOnce({});

      await expect(
        createTeam({
          name: "team alpha",
          createdBy: "user-creator",
          type: "solo",
        }),
      ).rejects.toThrow("membership insert failed");

      expect(mockTeamMemberDeleteMany).toHaveBeenCalledWith({
        where: { teamId: "team-1" },
      });
      expect(mockTeamDelete).toHaveBeenCalledWith({
        where: { id: "team-1" },
      });
      expect(mockTeamFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("archiveTeam", () => {
    it("archives with update and then loads members in a separate query", async () => {
      const { archiveTeam } = await import("@/lib/teams");

      mockTeamUpdate.mockResolvedValueOnce({});
      mockTeamFindUnique.mockResolvedValueOnce({
        ...makeTeam(),
        status: "archived",
      });

      const result = await archiveTeam("team-1");

      expect(mockTeamUpdate).toHaveBeenCalledWith({
        where: { id: "team-1" },
        data: { status: "archived" },
      });
      expect(mockTeamFindUnique).toHaveBeenCalledWith({
        where: { id: "team-1" },
        include: { members: true },
      });
      expect(result.status).toBe("archived");
    });

    it("throws when team cannot be loaded after archiving", async () => {
      const { archiveTeam } = await import("@/lib/teams");

      mockTeamUpdate.mockResolvedValueOnce({});
      mockTeamFindUnique.mockResolvedValueOnce(null);

      await expect(archiveTeam("team-1")).rejects.toThrow(
        "Time não encontrado após arquivamento.",
      );
    });
  });

  describe("listUserTeamsWithPartners", () => {
    it("returns active user teams with partner display data", async () => {
      const { listUserTeamsWithPartners } = await import("@/lib/teams");

      mockTeamMemberFindMany.mockResolvedValueOnce([
        {
          joinedAt: new Date("2026-01-10T00:00:00.000Z"),
          team: {
            ...makeTeam({
              id: "team-duo",
              name: "dupla afiada",
              members: [
                { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
                { userId: "user-partner", joinedAt: new Date("2026-01-02T00:00:00.000Z") },
              ],
            }),
            members: [
              {
                userId: "user-creator",
                joinedAt: new Date("2026-01-01T00:00:00.000Z"),
                user: { id: "user-creator", username: "gui.dev", displayName: "Gui" },
              },
              {
                userId: "user-partner",
                joinedAt: new Date("2026-01-02T00:00:00.000Z"),
                user: { id: "user-partner", username: "jean.dev", displayName: "Jean" },
              },
            ],
          },
        },
        {
          joinedAt: new Date("2026-01-09T00:00:00.000Z"),
          team: {
            ...makeTeam({
              id: "team-solo",
              type: "solo",
              name: "lobo solo",
              members: [
                { userId: "user-creator", joinedAt: new Date("2026-01-01T00:00:00.000Z") },
              ],
            }),
            members: [
              {
                userId: "user-creator",
                joinedAt: new Date("2026-01-01T00:00:00.000Z"),
                user: { id: "user-creator", username: "gui.dev", displayName: "Gui" },
              },
            ],
          },
        },
      ]);
      mockMatchFindMany.mockResolvedValueOnce([
        {
          id: "match-1",
          teamAId: "team-duo",
          teamBId: "team-rival",
          winnerTeamId: "team-duo",
          playedAt: new Date("2026-01-11T00:00:00.000Z"),
          note: null,
        },
      ]);

      const result = await listUserTeamsWithPartners("user-creator");

      expect(mockTeamMemberFindMany).toHaveBeenCalledWith({
        where: {
          userId: "user-creator",
          team: { status: "active" },
        },
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });
      expect(mockMatchFindMany).toHaveBeenCalledWith({
        where: {
          OR: [{ teamAId: { in: ["team-duo", "team-solo"] } }, { teamBId: { in: ["team-duo", "team-solo"] } }],
        },
        orderBy: { playedAt: "desc" },
      });
      expect(result).toHaveLength(2);
      expect(result[0]?.partners).toEqual([
        {
          userId: "user-partner",
          username: "jean.dev",
          displayName: "Jean",
        },
      ]);
      expect(result[0]?.summary).toEqual({
        wins: 1,
        losses: 0,
        winRate: 100,
        totalMatches: 1,
        lastFiveResults: ["win"],
        lastPlayedAt: "2026-01-11T00:00:00.000Z",
      });
      expect(result[1]?.summary).toEqual({
        wins: 0,
        losses: 0,
        winRate: 0,
        totalMatches: 0,
        lastFiveResults: [],
        lastPlayedAt: null,
      });
      expect(result[1]?.partners).toEqual([]);
    });
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
