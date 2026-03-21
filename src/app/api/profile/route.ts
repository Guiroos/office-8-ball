import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  getAuthUnavailableResponse,
  hasDatabaseUrl,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, ProfileResponse } from "@/lib/types";

const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Mínimo 2 caracteres.")
    .max(50, "Máximo 50 caracteres."),
});

export async function GET() {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const profile = await prisma.user.findUnique({ where: { id: user.id } });

  if (!profile) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Perfil não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json<ProfileResponse>({
    id: profile.id,
    username: profile.username,
    email: profile.email,
    displayName: profile.displayName,
    createdAt: profile.createdAt.toISOString(),
  });
}

export async function PUT(request: Request) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const payload = await request.json().catch(() => null);
  const result = updateProfileSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json<ApiErrorResponse>(
      { error: result.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { displayName: result.data.displayName },
  });

  return NextResponse.json<ProfileResponse>({
    id: updated.id,
    username: updated.username,
    email: updated.email,
    displayName: updated.displayName,
    createdAt: updated.createdAt.toISOString(),
  });
}
