"use client";

import { useState } from "react";
import { z } from "zod";
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
import { Field, FieldError } from "@/components/primitives/form-field";
import type { ProfileResponse } from "@/lib/types";

const schema = z.object({
  displayName: z
    .string()
    .min(2, "Mínimo 2 caracteres.")
    .max(50, "Máximo 50 caracteres."),
});

type ProfileEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDisplayName: string | null;
  onSave: (updated: ProfileResponse) => void;
};

export function ProfileEditDialog({
  open,
  onOpenChange,
  currentDisplayName,
  onSave,
}: ProfileEditDialogProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = schema.safeParse({ displayName });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      if (!res.ok) {
        if (res.status === 503) {
          toast.error("Serviço indisponível. Tente novamente mais tarde.");
        } else {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          toast.error(body.error ?? "Erro ao salvar. Tente novamente.");
        }
        return;
      }

      const updated = (await res.json()) as ProfileResponse;
      toast.success("Perfil atualizado.");
      onSave(updated);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <Label htmlFor="displayName">Nome de exibição</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como quer ser chamado?"
              disabled={loading}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
