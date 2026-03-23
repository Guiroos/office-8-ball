import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { findUserByUsername } from "@/lib/teams";
import type { ApiErrorResponse, UserLookupResponse } from "@/lib/types";

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const url = new URL(request.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Parâmetro 'username' é obrigatório." },
      { status: 400 },
    );
  }

  const found = await findUserByUsername(username);

  if (!found) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Usuário não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json<UserLookupResponse>({ user: found });
}
