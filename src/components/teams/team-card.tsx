import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
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
      <Card className="cursor-pointer shadow-sm shadow-foreground/10 transition hover:shadow-md hover:shadow-foreground/20">
        <div className="flex items-center gap-3 p-4">
          <Avatar className="size-9 border-0 bg-surface-emphasis">
            <AvatarFallback className="bg-surface-emphasis text-xs">
              {getInitials(team.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate text-sm font-semibold leading-none">{team.name}</p>
            <Badge variant="outline" className="text-xs">
              {team.type === "solo" ? "Solo" : "Duplas"}
            </Badge>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          {team.members.length} membro(s)
        </div>
      </Card>
    </Link>
  );
}
