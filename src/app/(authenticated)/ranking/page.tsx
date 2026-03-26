import type { Metadata } from "next";

import { RankingView } from "@/components/ranking/ranking-view";
import { hasDatabaseUrl } from "@/lib/auth";
import { listAllTeamsWithStats } from "@/lib/ranking";

export const metadata: Metadata = {
  title: "Ranking | Office 8 Ball",
  description: "Ranking geral com podium, standings e filtros por tipo de time.",
};

type RankingPageProps = {
  searchParams?: Promise<{ type?: string }>;
};

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const resolved = (await searchParams) ?? {};
  const rawType = resolved.type;
  const parsedType = rawType === "solo" || rawType === "duo" ? rawType : undefined;
  const activeType = parsedType ?? "all";

  const teams = await listAllTeamsWithStats(parsedType);
  const mode = hasDatabaseUrl() ? "available" : "unavailable";

  return <RankingView teams={teams} activeType={activeType} mode={mode} />;
}
