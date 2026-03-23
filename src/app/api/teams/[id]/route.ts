import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { getTeamById, isTeamMember } from "@/lib/teams";
import type { ApiErrorResponse, TeamResponse } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const { id } = await params;

  // Check membership FIRST — prevents enumeration (non-members always get 403)
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

  return NextResponse.json<TeamResponse>({ team });
}
