"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteMemberDialogProps = {
  teamId: string;
};

function mapErrorStatus(status: number, fallbackMessage: string): string {
  if (status === 401) return "Faça login novamente para gerenciar membros.";
  if (status === 403) return "Você não pode gerenciar membros deste time.";
  if (status === 404) return "Usuário não encontrado.";
  if (status === 503) return "Serviço indisponível. Configure o banco para gerenciar membros.";
  return fallbackMessage;
}

export function InviteMemberDialog({ teamId }: InviteMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setUsernameInput("");
      setInlineError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const normalized = usernameInput.trim().replace(/^@+/, "");
    if (!normalized) {
      setInlineError("Informe um username.");
      return;
    }

    setInlineError(null);
    setLoading(true);

    try {
      // Step 1: lookup user by username via GET /api/users
      const lookupRes = await fetch(`/api/users?username=${encodeURIComponent(normalized)}`, {
        method: "GET",
      });

      if (!lookupRes.ok) {
        const data = (await lookupRes.json().catch(() => ({}))) as { error?: string };
        const message = mapErrorStatus(lookupRes.status, data.error ?? "Não foi possível gerenciar o time.");
        toast.error(message);
        return;
      }

      const { user } = (await lookupRes.json()) as {
        user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
      };

      // Step 2: POST /api/teams/:id/members with userId
      const addRes = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!addRes.ok) {
        const data = (await addRes.json().catch(() => ({}))) as { error?: string };
        const message = mapErrorStatus(addRes.status, data.error ?? "Não foi possível gerenciar o time.");
        toast.error(message);
        return;
      }

      toast.success("Membro adicionado com sucesso.");
      handleOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        Convidar Membro
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-username">Username</Label>
              <Input
                id="invite-username"
                placeholder="username ou @username"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setInlineError(null);
                }}
                disabled={loading}
              />
              {inlineError && (
                <p className="text-sm text-destructive">{inlineError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Convidando..." : "Convidar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
