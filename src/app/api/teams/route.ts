import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { createTeam, listUserTeams, findUserById } from "@/lib/teams";
import type { ApiErrorResponse, TeamsResponse, TeamResponse } from "@/lib/types";

const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório.")
    .max(50, "Nome pode ter no máximo 50 caracteres.")
    .transform((v) => v.trim().toLowerCase()),
  type: z.enum(["solo", "duo"], {
    error: "Tipo deve ser 'solo' ou 'duo'.",
  }),
  secondMemberUserId: z.string().min(1, "Membro adicional inválido.").optional(),
});

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const url = new URL(request.url);
  const includeArchived = url.searchParams.get("includeArchived") === "true";

  const teams = await listUserTeams(user.id, includeArchived);

  return NextResponse.json<TeamsResponse>({ teams });
}

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const payload = await request.json().catch(() => null);
  const result = createTeamSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json<ApiErrorResponse>(
      { error: result.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { name, type, secondMemberUserId } = result.data;

  // Validate secondMemberUserId is not same as creator for duo teams
  if (type === "duo" && secondMemberUserId === user.id) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Você não pode criar um time com você mesmo." },
      { status: 400 },
    );
  }

  // Look up second member only when the duo is created with an invited member.
  if (type === "duo" && secondMemberUserId) {
    const secondMember = await findUserById(secondMemberUserId);

    if (!secondMember) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    }
  }

  try {
    const team = await createTeam({
      name,
      createdBy: user.id,
      type,
      secondMemberUserId: type === "duo" ? secondMemberUserId : undefined,
    });

    return NextResponse.json<TeamResponse>({ team }, { status: 201 });
  } catch (err: unknown) {
    // Prisma unique constraint violation (P2002) — name already taken
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Já existe um time com esse nome." },
        { status: 400 },
      );
    }
    throw err;
  }
}
