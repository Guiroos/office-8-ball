import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { listMatches, createMatch } from "@/lib/data";
import { isTeamMember } from "@/lib/teams";
import { prisma } from "@/lib/prisma";
import type {
  ApiErrorResponse,
  CreateMatchResponse,
  MatchesResponse,
} from "@/lib/types";

const createMatchSchema = z.object({
  teamAId: z.string().min(1, "teamAId é obrigatório."),
  teamBId: z.string().min(1, "teamBId é obrigatório."),
  winnerTeamId: z.string().min(1, "winnerTeamId é obrigatório."),
  note: z
    .string()
    .max(140, "note deve ter no máximo 140 caracteres.")
    .optional(),
});

export async function GET() {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const matches = await listMatches(user.id);

  return NextResponse.json<MatchesResponse>({ matches });
}

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const payload = await request.json().catch(() => null);
  const result = createMatchSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json<ApiErrorResponse>(
      { error: result.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { teamAId, teamBId, winnerTeamId, note } = result.data;

  if (teamAId === teamBId) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Os dois times devem ser diferentes." },
      { status: 400 },
    );
  }

  if (winnerTeamId !== teamAId && winnerTeamId !== teamBId) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "winnerTeamId deve ser um dos dois times da partida." },
      { status: 400 },
    );
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: [teamAId, teamBId] } },
    select: { id: true, status: true },
  });

  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);

  if (!teamA || !teamB) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Um ou mais times não foram encontrados." },
      { status: 404 },
    );
  }

  if (teamA.status !== "active" || teamB.status !== "active") {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Ambos os times devem estar ativos para registrar uma partida." },
      { status: 422 },
    );
  }

  const isMemberA = await isTeamMember(teamAId, user.id);
  const isMemberB = isMemberA ? true : await isTeamMember(teamBId, user.id);

  if (!isMemberA && !isMemberB) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Você precisa ser membro de pelo menos um dos times." },
      { status: 403 },
    );
  }

  const response = await createMatch({ teamAId, teamBId, winnerTeamId, note });

  return NextResponse.json<CreateMatchResponse>(response, { status: 201 });
}
