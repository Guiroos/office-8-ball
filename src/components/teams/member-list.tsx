"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeamMemberView } from "@/lib/team-details";

type MemberListProps = {
  members: TeamMemberView[];
  teamId: string;
  teamType: "solo" | "duo";
  createdBy: string;
  viewerId: string;
};

function mapErrorStatus(status: number, fallbackMessage: string): string {
  if (status === 401) return "Faça login novamente para gerenciar membros.";
  if (status === 403) return "Você não pode gerenciar membros deste time.";
  if (status === 503) return "Serviço indisponível. Configure o banco para gerenciar membros.";
  return fallbackMessage;
}

export function MemberList({ members, teamId, teamType, createdBy, viewerId }: MemberListProps) {
  const router = useRouter();
  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Minimum member threshold: solo requires > 1, duo requires > 2
  const minMembersForRemoval = teamType === "solo" ? 1 : 2;
  const canRemoveAny = members.length > minMembersForRemoval;

  function isRemovable(member: TeamMemberView): boolean {
    if (member.userId === createdBy) return false;
    if (!canRemoveAny) return false;
    return true;
  }

  async function handleRemove(userId: string) {
    setRemovingUserId(userId);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        const message = mapErrorStatus(res.status, data.error ?? "Não foi possível gerenciar o time.");
        toast.error(message);
        return;
      }

      toast.success("Membro removido com sucesso.");
      setConfirmingUserId(null);
      router.refresh();
    } finally {
      setRemovingUserId(null);
    }
  }

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum membro</p>;
  }

  return (
    <ul className="space-y-3">
      {members.map((member) => {
        const isConfirming = confirmingUserId === member.userId;
        const isRemoving = removingUserId === member.userId;
        const removable = isRemovable(member);

        return (
          <li
            key={member.userId}
            className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
          >
            <div>
              <p className="font-medium">{member.displayName}</p>
              <p className="text-sm text-muted-foreground">@{member.username}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">{member.role}</Badge>

              {removable && !isConfirming && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingUserId(member.userId)}
                  disabled={isRemoving}
                >
                  Remover
                </Button>
              )}

              {isConfirming && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(member.userId)}
                    disabled={isRemoving}
                  >
                    {isRemoving ? "Removendo..." : "Confirmar"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingUserId(null)}
                    disabled={isRemoving}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
