"use client";

import Link from "next/link";

import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";

type RankingType = "all" | "solo" | "duo";

const TYPE_VALUES: Array<{ label: string; value: RankingType }> = [
  { label: "Todos", value: "all" },
  { label: "Solo", value: "solo" },
  { label: "Duplas", value: "duo" },
];

export function TypeTabs({
  activeType,
  activePeriod = "all",
}: {
  activeType: RankingType;
  activePeriod?: "all" | "month" | "week";
}) {
  function buildHref(type: RankingType): string {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (activePeriod !== "all") params.set("period", activePeriod);
    const qs = params.toString();
    return qs ? `/ranking?${qs}` : "/ranking";
  }

  return (
    <SegmentedControl aria-label="Filtro de tipo de time" role="navigation">
      {TYPE_VALUES.map((tab) => {
        const active = tab.value === activeType;
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
