"use client";

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
        value={activeType}
        onValueChange={(nextValue) => {
          if (nextValue !== activeType) {
            router.push(buildHref(nextValue as RankingType));
          }
        }}
        className="h-10 rounded-lg px-3"
        showDescriptionInTrigger={false}
        options={TYPE_VALUES}
      />
    </div>
  );
}
