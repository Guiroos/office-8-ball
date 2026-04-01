"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function mapErrorStatus(status: number, fallbackMessage: string): string {
  if (status === 401) return "Faça login novamente para gerenciar membros.";
  if (status === 403) return "Você não pode gerenciar membros deste time.";
  if (status === 503) return "Serviço indisponível. Configure o banco para gerenciar membros.";
  return fallbackMessage;
}

export function MemberList({ members, teamId, teamType, createdBy, viewerId }: MemberListProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [optimisticRemovedUserIds, setOptimisticRemovedUserIds] = useState<string[]>([]);
  const visibleMembers = members.filter((member) => !optimisticRemovedUserIds.includes(member.userId));

  // Minimum member threshold: solo requires > 1, duo requires > 2
  const minMembersForRemoval = teamType === "solo" ? 1 : 2;
  const canRemoveAny = visibleMembers.length > minMembersForRemoval;
  const hasNonCreatorMember = visibleMembers.some((member) => member.userId !== createdBy);
  const showMinMembersHint = !canRemoveAny && hasNonCreatorMember;

  function isRemovable(member: TeamMemberView): boolean {
    if (member.userId === createdBy) return false;
    if (!canRemoveAny) return false;
    return true;
  }

  async function handleRemove(userId: string) {
    setRemovingUserId(userId);
    setOptimisticRemovedUserIds((current) =>
      current.includes(userId) ? current : [...current, userId]);
    let didSucceed = false;

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        const message = mapErrorStatus(res.status, data.error ?? "Não foi possível gerenciar o time.");
        toast.error(message);
        setConfirmingUserId(null);
        return;
      }

      didSucceed = true;
      toast.success("Membro removido com sucesso.");
      setConfirmingUserId(null);
      startRefresh(() => {
        router.refresh();
      });
      return;
    } catch {
      toast.error("Não foi possível gerenciar o time.");
      setConfirmingUserId(null);
    } finally {
      if (!didSucceed) {
        setOptimisticRemovedUserIds((current) => current.filter((id) => id !== userId));
      }
      setRemovingUserId(null);
    }
  }

  if (visibleMembers.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum membro</p>;
  }

  return (
    <div className="space-y-3">
      {showMinMembersHint ? (
        <p className="text-sm text-muted-foreground">
          {teamType === "solo"
            ? "Times solo precisam manter pelo menos 1 membro."
            : "Times de duplas precisam manter pelo menos 2 membros. Convide outro membro antes de remover."}
        </p>
      ) : null}

      <ul className="space-y-3">
        {visibleMembers.map((member) => {
          const isConfirming = confirmingUserId === member.userId;
          const isRemoving = removingUserId === member.userId;
          const removable = isRemovable(member);
          const isViewer = member.userId === viewerId;

          return (
            <li
              key={member.userId}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface-emphasis p-4 shadow-sm shadow-foreground/5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border-0 bg-surface">
                  <AvatarFallback className="bg-surface">
                    {getInitials(member.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{member.displayName}</p>
                    {isViewer ? <Badge variant="default">Você</Badge> : null}
                    <Badge variant={member.role === "Criador" ? "gold" : "outline"}>
                      {member.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">@{member.username}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {removable && !isConfirming && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setConfirmingUserId(member.userId)}
                    disabled={isRemoving || isRefreshing}
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
                      className="w-full border-destructive text-destructive hover:bg-destructive/10 sm:w-auto"
                      onClick={() => handleRemove(member.userId)}
                      disabled={isRemoving || isRefreshing}
                    >
                      {isRemoving ? "Removendo..." : "Confirmar"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setConfirmingUserId(null)}
                      disabled={isRemoving || isRefreshing}
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
    </div>
  );
}
