import { describe, it, expect } from "vitest";
import { resolveHeadToHeadData } from "@/lib/head-to-head";
import type { TeamRecord, MatchRecord } from "@/lib/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeTeam(
  partial: Partial<TeamRecord> & { id: string; createdBy: string }
): TeamRecord {
  return {
    name: `Team ${partial.id}`,
    type: "duo",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    members: [{ userId: partial.createdBy, joinedAt: "2026-01-01T00:00:00.000Z" }],
    ...partial,
  };
}

function makeMatch(
  partial: Partial<MatchRecord> & {
    id: string;
    teamAId: string;
    teamBId: string;
    winnerTeamId: string;
  }
): MatchRecord {
  return {
    loserTeamId:
      partial.winnerTeamId === partial.teamAId ? partial.teamBId : partial.teamAId,
    playedAt: "2026-03-01T12:00:00.000Z",
    note: null,
    ...partial,
  };
}

// ─── Shared data ──────────────────────────────────────────────────────────────

const teamA = makeTeam({ id: "team-a", createdBy: "user-1" });
const teamB = makeTeam({ id: "team-b", createdBy: "user-2" });
const teamC = makeTeam({ id: "team-c", createdBy: "user-3" });

const match1 = makeMatch({
  id: "m-1",
  teamAId: "team-a",
  teamBId: "team-b",
  winnerTeamId: "team-a",
});

const match2 = makeMatch({
  id: "m-2",
  teamAId: "team-b",
  teamBId: "team-a",
  winnerTeamId: "team-b",
});

// ─── D-15: no params → first valid pair fallback ───────────────────────────

describe("resolveHeadToHeadData", () => {
  it("Teste 1: D-15 — sem params retorna primeiro par válido acessível", () => {
    const result = resolveHeadToHeadData(
      undefined,
      undefined,
      [teamA, teamB, teamC],
      [match1, match2]
    );

    // Should pick first valid pair: teamA vs teamB
    expect(result.pair.teamA.id).toBe("team-a");
    expect(result.pair.teamB.id).toBe("team-b");
    expect(result.warning).toBeNull();
    expect(result.summary).toBeDefined();
    expect(result.options).toHaveLength(3);
  });

  // ─── D-16: invalid/unauthorized params → warning + fallback ────────────────

  it("Teste 2: D-16 — params inválidos retornam warning e fallback válido", () => {
    const result = resolveHeadToHeadData(
      "nonexistent-team",
      "team-b",
      [teamA, teamB],
      [match1]
    );

    expect(result.warning).not.toBeNull();
    expect(result.warning).toContain("Seleção inválida");
    // Should still provide a valid pair as fallback
    expect(result.pair.teamA.id).toBeDefined();
    expect(result.pair.teamB.id).toBeDefined();
    expect(result.pair.teamA.id).not.toBe(result.pair.teamB.id);
  });

  it("Teste 2b: D-16 — params não autorizados (time fora da lista) retornam warning + fallback", () => {
    const unauthorizedTeam = makeTeam({ id: "team-unauthorized", createdBy: "other-user" });

    const result = resolveHeadToHeadData(
      unauthorizedTeam.id,
      "team-b",
      [teamA, teamB],
      []
    );

    expect(result.warning).not.toBeNull();
    expect(result.warning).toContain("Seleção inválida");
    expect(result.pair.teamA.id).not.toBe(result.pair.teamB.id);
  });

  // ─── D-17: same team on both sides → rejected with message + fallback ──────

  it("Teste 3: D-17 — par igual (teamA === teamB) é rejeitado com mensagem e fallback", () => {
    const result = resolveHeadToHeadData(
      "team-a",
      "team-a",
      [teamA, teamB, teamC],
      [match1]
    );

    expect(result.warning).not.toBeNull();
    expect(result.warning).toContain("Seleção inválida");
    // Fallback must not be a same-team pair
    expect(result.pair.teamA.id).not.toBe(result.pair.teamB.id);
  });

  it("Teste 1b: D-15 — sem times suficientes retorna pair nulo com warning", () => {
    // Only one team — cannot form any valid pair
    const result = resolveHeadToHeadData(
      undefined,
      undefined,
      [teamA],
      []
    );

    expect(result.warning).not.toBeNull();
    expect(result.pair.teamA.id).toBe("team-a");
    expect(result.pair.teamB).toBeNull();
  });

  it("Teste fallback: sem times, nenhum par pode ser formado", () => {
    const result = resolveHeadToHeadData(
      undefined,
      undefined,
      [],
      []
    );

    expect(result.warning).not.toBeNull();
    expect(result.pair.teamA).toBeNull();
    expect(result.pair.teamB).toBeNull();
  });
});
