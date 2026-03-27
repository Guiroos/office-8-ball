"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type RankingPeriod = "all" | "month" | "week";

const TABS: Array<{ label: string; value: RankingPeriod }> = [
  { label: "Todos os tempos", value: "all" },
  { label: "Este mês", value: "month" },
  { label: "Esta semana", value: "week" },
];

export function PeriodTabs({
  activePeriod,
  activeType,
}: {
  activePeriod: RankingPeriod;
  activeType: "all" | "solo" | "duo";
}) {
  function buildHref(period: RankingPeriod): string {
    const params = new URLSearchParams();
    if (activeType !== "all") params.set("type", activeType);
    if (period !== "all") params.set("period", period);
    const qs = params.toString();
    return qs ? `/ranking?${qs}` : "/ranking";
  }

  return (
    <nav aria-label="Filtro de período" className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = tab.value === activePeriod;
        return (
          <Link
            key={tab.value}
            href={buildHref(tab.value)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-pill border px-4 py-2 text-sm font-medium transition",
              active
                ? "border-primary bg-primary text-foreground-inverse"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
