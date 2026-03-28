"use client";

import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type TeamPartnerFilterProps = {
  activePartnerId: string;
  partners: Array<{
    userId: string;
    displayName: string;
    teamCount: number;
  }>;
};

export function TeamPartnerFilter({
  activePartnerId,
  partners,
}: TeamPartnerFilterProps) {
  const router = useRouter();
  const hasPartners = partners.length > 0;
  const options = [
    {
      label: "Todos os parceiros",
      value: "all",
      description: hasPartners
        ? `${partners.length} ${partners.length === 1 ? "parceiro disponível" : "parceiros disponíveis"}`
        : "Nenhuma dupla com parceiro ainda",
    },
    ...partners.map((partner) => ({
      label: partner.displayName,
      value: partner.userId,
      description:
        partner.teamCount === 1
          ? "1 time com você"
          : `${partner.teamCount} times com você`,
    })),
  ];

  function buildHref(partnerId: string) {
    if (partnerId === "all") {
      return "/times";
    }

    const params = new URLSearchParams();
    params.set("partner", partnerId);
    return `/times?${params.toString()}`;
  }

  return (
    <div className="space-y-1 xl:space-y-0">
      <Label htmlFor="team-partner-filter" className="caption text-muted-foreground xl:sr-only">
        Filtrar por parceiro
      </Label>
      <Select
        id="team-partner-filter"
        value={activePartnerId}
        disabled={!hasPartners}
        onValueChange={(nextValue) => {
          if (nextValue !== activePartnerId) {
            router.push(buildHref(nextValue));
          }
        }}
        className="h-10 rounded-lg px-3"
        showDescriptionInTrigger={false}
        options={options}
      />
    </div>
  );
}
