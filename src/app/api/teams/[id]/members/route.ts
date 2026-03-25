import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { addTeamMember, isTeamMember, findUserById } from "@/lib/teams";
import type { ApiErrorResponse, TeamResponse } from "@/lib/types";

const addMemberSchema = z.object({
  userId: z.string().min(1, "userId é obrigatório."),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const { id: teamId } = await params;

  // Membership-first guard: user must be on team to add members
  const isMember = await isTeamMember(teamId, user.id);
  if (!isMember) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Você não é membro deste time." },
      { status: 403 },
    );
  }

  const payload = await request.json().catch(() => null);
  const result = addMemberSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json<ApiErrorResponse>(
      { error: result.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { userId } = result.data;

  // Verify user exists
  const userToAdd = await findUserById(userId);
  if (!userToAdd) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Usuário não encontrado." },
      { status: 404 },
    );
  }

  try {
    const team = await addTeamMember(teamId, userId);
    return NextResponse.json<TeamResponse>({ team }, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao adicionar membro.";
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 400 },
    );
  }
}
