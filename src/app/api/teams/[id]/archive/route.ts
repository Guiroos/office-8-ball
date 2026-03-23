import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { getTeamById, isTeamMember, archiveTeam } from "@/lib/teams";
import type { ApiErrorResponse, TeamResponse } from "@/lib/types";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const { id } = await params;

  // Authorization check runs FIRST — prevents team enumeration by non-members
  const member = await isTeamMember(id, user.id);

  if (!member) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Acesso negado." },
      { status: 403 },
    );
  }

  const team = await getTeamById(id);

  if (!team) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Time não encontrado." },
      { status: 404 },
    );
  }

  // Idempotent: already archived → return current state
  if (team.status === "archived") {
    return NextResponse.json<TeamResponse>({ team });
  }

  const archived = await archiveTeam(id);

  return NextResponse.json<TeamResponse>({ team: archived });
}
