import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { removeTeamMember, isTeamMember } from "@/lib/teams";
import type { ApiErrorResponse, TeamResponse } from "@/lib/types";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const { id: teamId, userId: userIdToRemove } = await params;

  // Membership-first guard: user must be on team to remove members
  const isMember = await isTeamMember(teamId, user.id);
  if (!isMember) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Você não é membro deste time." },
      { status: 403 },
    );
  }

  try {
    const team = await removeTeamMember(teamId, userIdToRemove);
    return NextResponse.json<TeamResponse>({ team }, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao remover membro.";
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 400 },
    );
  }
}
