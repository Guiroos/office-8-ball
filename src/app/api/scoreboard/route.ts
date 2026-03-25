import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { getScoreboard } from "@/lib/data";
import type { ApiErrorResponse, ScoreboardResponse } from "@/lib/types";

export async function GET() {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const scoreboard = await getScoreboard(user.id);

  return NextResponse.json<ScoreboardResponse>({ scoreboard });
}
