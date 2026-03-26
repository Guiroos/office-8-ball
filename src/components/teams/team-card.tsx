import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamRecord } from "@/lib/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamCard({ team }: { team: TeamRecord }) {
  return (
    <Link href={`/times/${team.id}`} className="block">
      <Card className="border-border bg-surface transition hover:shadow-sm hover:shadow-foreground/20">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-surface-emphasis font-semibold">
            {getInitials(team.name)}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">{team.name}</CardTitle>
            <Badge variant="outline">{team.type === "solo" ? "Solo" : "Duplas"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          {team.members.length} membro(s)
        </CardContent>
      </Card>
    </Link>
  );
}
