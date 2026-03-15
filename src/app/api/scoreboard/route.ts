import { NextResponse } from "next/server";

import { getAuthenticatedUser, getAuthRequiredResponse } from "@/lib/auth";
import { getScoreboard } from "@/lib/data";
import type { ScoreboardResponse } from "@/lib/types";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return getAuthRequiredResponse();
  }

  const scoreboard = await getScoreboard();

  return NextResponse.json<ScoreboardResponse>({ scoreboard });
}
