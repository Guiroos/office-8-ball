import { computeHeadToHead } from "@/lib/stats";
import type { HeadToHeadStats } from "@/lib/stats";
import type { MatchRecord, TeamRecord } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HeadToHeadPair = {
  teamA: TeamRecord | null;
  teamB: TeamRecord | null;
};

export type HeadToHeadPageData = {
  pair: HeadToHeadPair;
  warning: string | null;
  options: TeamRecord[];
  summary: HeadToHeadStats | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve a valid head-to-head pair from optional teamA/teamB query params.
 *
 * Rules (per decisions D-15..D-17):
 * - D-15: No params → auto-select first valid pair from user's accessible teams.
 * - D-16: Invalid/unauthorized params → show warning + fallback to first valid pair.
 * - D-17: teamA === teamB → rejected with "Seleção inválida" warning + fallback.
 *
 * Pure function: no side effects, no database access.
 */
export function resolveHeadToHeadData(
  teamAParam: string | undefined,
  teamBParam: string | undefined,
  userTeams: TeamRecord[],
  allMatches: MatchRecord[]
): HeadToHeadPageData {
  const options = userTeams;
  const teamById = new Map(userTeams.map((t) => [t.id, t]));

  // ─── Validate requested params ────────────────────────────────────────────

  let warning: string | null = null;
  let resolvedTeamA: TeamRecord | null = null;
  let resolvedTeamB: TeamRecord | null = null;
  let useParams = false;

  if (teamAParam !== undefined || teamBParam !== undefined) {
    const requestedA = teamAParam ? teamById.get(teamAParam) ?? null : null;
    const requestedB = teamBParam ? teamById.get(teamBParam) ?? null : null;

    const aValid = teamAParam === undefined || requestedA !== null;
    const bValid = teamBParam === undefined || requestedB !== null;
    const sameTeam =
      requestedA !== null &&
      requestedB !== null &&
      requestedA.id === requestedB.id;

    if (!aValid || !bValid || sameTeam) {
      // D-16 / D-17: invalid combo → show warning, fallback below
      warning = "Seleção inválida: os times escolhidos não formam um confronto válido.";
    } else {
      resolvedTeamA = requestedA;
      resolvedTeamB = requestedB;
      useParams = true;
    }
  }

  // ─── Fallback to first valid pair (D-15 / D-16) ────────────────────────

  if (!useParams) {
    if (userTeams.length === 0) {
      // No teams at all
      return {
        pair: { teamA: null, teamB: null },
        warning: warning ?? "Nenhum time disponível para confronto.",
        options,
        summary: null,
      };
    }

    if (userTeams.length === 1) {
      // Only one team — cannot form a pair
      return {
        pair: { teamA: userTeams[0], teamB: null },
        warning: warning ?? "É necessário pelo menos dois times para exibir o confronto.",
        options,
        summary: null,
      };
    }

    // Deterministic fallback: first team vs second team
    resolvedTeamA = userTeams[0];
    resolvedTeamB = userTeams[1];
  }

  // ─── Compute H2H summary ─────────────────────────────────────────────────

  const summary =
    resolvedTeamA && resolvedTeamB
      ? computeHeadToHead(resolvedTeamA.id, resolvedTeamB.id, allMatches)
      : null;

  return {
    pair: { teamA: resolvedTeamA, teamB: resolvedTeamB },
    warning,
    options,
    summary,
  };
}
