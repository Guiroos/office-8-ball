import { NextResponse } from "next/server";

import { getAuthenticatedUser, getAuthRequiredResponse } from "@/lib/auth";
import { TEAMS } from "@/lib/constants";
import { createMatch, listMatches } from "@/lib/data";
import type {
  CreateMatchResponse,
  MatchesResponse,
  TeamId,
} from "@/lib/types";

function isValidTeamId(value: unknown): value is TeamId {
  return TEAMS.some((team) => team.id === value);
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return getAuthRequiredResponse();
  }

  const matches = await listMatches();

  return NextResponse.json<MatchesResponse>({ matches });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return getAuthRequiredResponse();
  }

  const payload = (await request.json().catch(() => null)) as
    | { winnerTeamId?: unknown; note?: unknown }
    | null;

  if (!payload || !isValidTeamId(payload.winnerTeamId)) {
    return NextResponse.json(
      { error: "winnerTeamId must be 'frontend' or 'backend'." },
      { status: 400 },
    );
  }

  if (
    typeof payload.note !== "undefined" &&
    (typeof payload.note !== "string" || payload.note.length > 140)
  ) {
    return NextResponse.json(
      { error: "note must be a string with at most 140 characters." },
      { status: 400 },
    );
  }

  const response = await createMatch({
    winnerTeamId: payload.winnerTeamId,
    note: payload.note,
  });

  return NextResponse.json<CreateMatchResponse>(response, { status: 201 });
}
