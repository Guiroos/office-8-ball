"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type RankingPeriod = "all" | "month" | "week";

const TABS: Array<{ label: string; value: RankingPeriod; description: string }> = [
  { label: "Todos os tempos", value: "all", description: "Histórico completo" },
  { label: "Este mês", value: "month", description: "Últimos 30 dias" },
  { label: "Esta semana", value: "week", description: "Últimos 7 dias" },
];

export function PeriodTabs({
  activePeriod,
  activeType,
}: {
  activePeriod: RankingPeriod;
  activeType: "all" | "solo" | "duo";
}) {
  const router = useRouter();
  const [isPending, startNavigation] = useTransition();
  const [optimisticPeriod, setOptimisticPeriod] = useState(activePeriod);
  const displayedPeriod = isPending ? optimisticPeriod : activePeriod;

  function buildHref(period: RankingPeriod): string {
    const params = new URLSearchParams();
    if (activeType !== "all") params.set("type", activeType);
    if (period !== "all") params.set("period", period);
    const qs = params.toString();
    return qs ? `/ranking?${qs}` : "/ranking";
  }

  return (
    <div className="space-y-1 xl:space-y-0">
      <Label htmlFor="ranking-period-filter" className="caption text-muted-foreground xl:sr-only">
        Período
      </Label>
      <Select
        id="ranking-period-filter"
        value={displayedPeriod}
        disabled={isPending}
        onValueChange={(nextValue) => {
          if (nextValue !== activePeriod) {
            setOptimisticPeriod(nextValue as RankingPeriod);
            startNavigation(() => {
              router.push(buildHref(nextValue as RankingPeriod));
            });
          }
        }}
        className="h-10 rounded-lg px-3"
        showDescriptionInTrigger={false}
        options={TABS}
      />
    </div>
  );
}
