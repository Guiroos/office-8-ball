import { Badge } from "@/components/ui/badge";
import type { TeamMemberView } from "@/lib/team-details";

export function MemberList({ members }: { members: TeamMemberView[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum membro</p>;
  }

  return (
    <ul className="space-y-3">
      {members.map((member) => (
        <li
          key={member.userId}
          className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
        >
          <div>
            <p className="font-medium">{member.displayName}</p>
            <p className="text-sm text-muted-foreground">@{member.username}</p>
          </div>
          <Badge variant="outline">
            {member.role}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
