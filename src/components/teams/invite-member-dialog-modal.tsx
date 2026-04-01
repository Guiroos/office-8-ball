"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
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

type InviteMemberDialogModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
};

const USERNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;

function mapErrorStatus(status: number, fallbackMessage: string): string {
  if (status === 401) return "Faça login novamente para gerenciar membros.";
  if (status === 403) return "Você não pode gerenciar membros deste time.";
  if (status === 404) return "Usuário não encontrado.";
  if (status === 503) return "Serviço indisponível. Configure o banco para gerenciar membros.";
  return fallbackMessage;
}

export function InviteMemberDialogModal({
  open,
  onOpenChange,
  teamId,
}: InviteMemberDialogModalProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [usernameInput, setUsernameInput] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isSubmitting || isRefreshing;

  function handleOpenChange(value: boolean) {
    onOpenChange(value);
    if (!value) {
      setUsernameInput("");
      setInlineError(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const normalized = usernameInput.trim().replace(/^@+/, "").toLowerCase();
    if (!normalized) {
      setInlineError("Informe um username.");
      return;
    }

    if (!USERNAME_PATTERN.test(normalized)) {
      setInlineError(
        "Use de 3 a 24 caracteres com letras, números, ponto, tracinho ou underscore.",
      );
      return;
    }

    setInlineError(null);
    setIsSubmitting(true);

    try {
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
      startRefresh(() => {
        router.refresh();
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
              onChange={(event) => {
                setUsernameInput(event.target.value);
                setInlineError(null);
              }}
              disabled={isBusy}
            />
            <p className="text-xs text-muted-foreground">
              Formato válido: 3 a 24 caracteres com letras, números, ponto, tracinho ou underscore.
            </p>
            {inlineError ? <p className="text-sm text-destructive">{inlineError}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isBusy}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {isSubmitting ? "Convidando..." : "Atualizando time..."}
                </>
              ) : "Convidar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
