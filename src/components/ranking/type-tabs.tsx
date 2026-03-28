"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type RankingType = "all" | "solo" | "duo";

const TYPE_VALUES: Array<{ label: string; value: RankingType; description: string }> = [
  { label: "Todos", value: "all", description: "Todos os formatos" },
  { label: "Solo", value: "solo", description: "Apenas times solo" },
  { label: "Duplas", value: "duo", description: "Apenas duplas" },
];

export function TypeTabs({
  activeType,
  activePeriod = "all",
}: {
  activeType: RankingType;
  activePeriod?: "all" | "month" | "week";
}) {
  const router = useRouter();
  const [isPending, startNavigation] = useTransition();
  const [optimisticType, setOptimisticType] = useState(activeType);
  const displayedType = isPending ? optimisticType : activeType;

  function buildHref(type: RankingType): string {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (activePeriod !== "all") params.set("period", activePeriod);
    const qs = params.toString();
    return qs ? `/ranking?${qs}` : "/ranking";
  }

  return (
    <div className="space-y-1 xl:space-y-0">
      <Label htmlFor="ranking-type-filter" className="caption text-muted-foreground xl:sr-only">
        Categoria
      </Label>
      <Select
        id="ranking-type-filter"
        value={displayedType}
        disabled={isPending}
        onValueChange={(nextValue) => {
          if (nextValue !== activeType) {
            setOptimisticType(nextValue as RankingType);
            startNavigation(() => {
              router.push(buildHref(nextValue as RankingType));
            });
          }
        }}
        className="h-10 rounded-lg px-3"
        showDescriptionInTrigger={false}
        options={TYPE_VALUES}
      />
      <p className="text-xs text-muted-foreground">
        {isPending ? "Atualizando categoria..." : "Troque a modalidade sem resetar o restante do ranking."}
      </p>
    </div>
  );
}
