import { NextResponse } from "next/server";

import type { ApiErrorResponse } from "@/lib/types";

export async function GET() {
  return NextResponse.json<ApiErrorResponse>(
    {
      error:
        "O placar está temporariamente indisponível enquanto o sistema de times é atualizado.",
    },
    { status: 503 },
  );
}
