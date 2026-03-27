import type { Metadata } from "next";

import { RankingView } from "@/components/ranking/ranking-view";
import { hasDatabaseUrl } from "@/lib/auth";
import { listAllTeamsWithStats } from "@/lib/ranking";

export const metadata: Metadata = {
  title: "Ranking | Office 8 Ball",
  description: "Ranking geral com podium, standings e filtros por tipo de time.",
};

type RankingPageProps = {
  searchParams?: Promise<{ type?: string; period?: string }>;
};

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const resolved = (await searchParams) ?? {};

  const rawType = resolved.type;
  const parsedType = rawType === "solo" || rawType === "duo" ? rawType : undefined;
  const activeType = parsedType ?? "all";

  const rawPeriod = resolved.period;
  const parsedPeriod = (
    rawPeriod === "all" || rawPeriod === "month" || rawPeriod === "week"
      ? rawPeriod
      : "all"
  ) as "all" | "month" | "week";
  const activePeriod = parsedPeriod;

  const teams = await listAllTeamsWithStats(parsedType, parsedPeriod);
  const mode = hasDatabaseUrl() ? "available" : "unavailable";

  return <RankingView teams={teams} activeType={activeType} activePeriod={activePeriod} mode={mode} />;
}
