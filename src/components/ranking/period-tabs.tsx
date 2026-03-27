"use client";

import Link from "next/link";

import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";

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
    <SegmentedControl aria-label="Filtro de período" role="navigation">
      {TABS.map((tab) => {
        const active = tab.value === activePeriod;
        return (
          <SegmentedControlItem
            key={tab.value}
            asChild
            active={active}
          >
            <Link href={buildHref(tab.value)} aria-current={active ? "page" : undefined}>
              {tab.label}
            </Link>
          </SegmentedControlItem>
        );
      })}
    </SegmentedControl>
  );
}
