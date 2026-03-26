"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type RankingType = "all" | "solo" | "duo";

const TABS: Array<{ label: string; href: string; value: RankingType }> = [
  { label: "Todos", href: "/ranking", value: "all" },
  { label: "Solo", href: "/ranking?type=solo", value: "solo" },
  { label: "Duplas", href: "/ranking?type=duo", value: "duo" },
];

export function TypeTabs({ activeType }: { activeType: RankingType }) {
  return (
    <nav aria-label="Filtro de tipo de time" className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = tab.value === activeType;
        return (
          <Link
            key={tab.value}
            href={tab.href}
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
