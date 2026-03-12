import { NextResponse } from "next/server";

import { getScoreboard } from "@/lib/data";
import type { ScoreboardResponse } from "@/lib/types";

export async function GET() {
  const scoreboard = await getScoreboard();

  return NextResponse.json<ScoreboardResponse>({ scoreboard });
}
