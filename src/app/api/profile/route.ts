import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  getAuthUnavailableResponse,
  hasDatabaseUrl,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, ProfileResponse } from "@/lib/types";

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
