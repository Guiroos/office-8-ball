"use client";

import { Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError } from "@/components/primitives/form-field";
import type { ProfileResponse } from "@/lib/types";

const schema = z.object({
  displayName: z
    .union([
      z.string().min(2, "Mínimo 2 caracteres.").max(50, "Máximo 50 caracteres."),
      z.literal(""),
    ]),
  email: z.union([z.string().email("Informe um email válido."), z.literal("")]),
  avatarUrl: z.union([z.string().url("URL inválida."), z.literal("")]),
  bio: z.string().max(200, "Máximo 200 caracteres."),
});

type FormErrors = Partial<Record<"displayName" | "email" | "avatarUrl" | "bio", string>>;

type ProfileEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Pick<ProfileResponse, "displayName" | "email" | "avatarUrl" | "bio">;
  onSave: (updated: ProfileResponse) => void;
};

export function ProfileEditDialog({
  open,
  onOpenChange,
  profile,
  onSave,
}: ProfileEditDialogProps) {
  const [isClosing, startCloseTransition] = useTransition();
  const [form, setForm] = useState({
    displayName: profile.displayName ?? "",
    email: profile.email ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    bio: profile.bio ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isSubmitting || isClosing;

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const body: Record<string, string | null> = {
      displayName: form.displayName || null,
      email: form.email || null,
      avatarUrl: form.avatarUrl || null,
      bio: form.bio || null,
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 503) {
          toast.error("Serviço indisponível. Tente novamente mais tarde.");
        } else {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(data.error ?? "Erro ao salvar. Tente novamente.");
        }
        return;
      }

      const updated = (await res.json()) as ProfileResponse;
      toast.success("Perfil atualizado.");
      onSave(updated);
      startCloseTransition(() => {
        onOpenChange(false);
      });
    } finally {
      setIsSubmitting(false);
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
              value={form.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
              placeholder="Como quer ser chamado?"
              disabled={isBusy}
            />
            <FieldError>{errors.displayName}</FieldError>
          </Field>
          <Field>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="gui@office8ball.dev"
              disabled={isBusy}
            />
            <FieldError>{errors.email}</FieldError>
          </Field>
          <Field>
            <Label htmlFor="avatarUrl">Gravatar URL</Label>
            <Input
              id="avatarUrl"
              value={form.avatarUrl}
              onChange={(e) => updateField("avatarUrl", e.target.value)}
              placeholder="https://gravatar.com/avatar/..."
              disabled={isBusy}
            />
            <FieldError>{errors.avatarUrl}</FieldError>
          </Field>
          <Field>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Conta um pouco sobre você"
              disabled={isBusy}
              maxLength={200}
              rows={4}
            />
            <FieldError>{errors.bio}</FieldError>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {isSubmitting ? "Salvando..." : "Fechando..."}
                </>
              ) : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
