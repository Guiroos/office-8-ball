import { H2HSection } from "@/components/teams/h2h-section";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/primitives/section-header";
import { getTeamH2HData } from "@/lib/team-details";

export async function TeamH2HSection({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) {
  const data = await getTeamH2HData(teamId, userId);

  return (
    <section>
      <Card className="border-border bg-surface">
        <CardContent className="space-y-4 p-6">
          <SectionHeader
            eyebrow="Comparação"
            title="Confrontos Diretos"
            description="Compare o desempenho do time contra cada adversário disponível."
          />
          {/* addresses review concern: server-side H2H summary */}
          <H2HSection
            rivals={data.rivals}
            h2hByRival={data.h2hByRival}
            defaultRivalId={data.primaryRivalId}
          />
        </CardContent>
      </Card>
    </section>
  );
}
