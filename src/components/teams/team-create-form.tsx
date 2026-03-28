"use client";

import { Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Field, FieldError } from "@/components/primitives/form-field";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import type { ApiErrorResponse, TeamRecord, TeamResponse } from "@/lib/types";

const schema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório.")
    .max(50, "Nome pode ter no máximo 50 caracteres.")
    .transform((v) => v.trim().toLowerCase()),
  type: z.enum(["solo", "duo"]),
});

type TeamCreateFormProps = {
  onCancel?: () => void;
  onSuccess?: (team: TeamResponse) => void;
};

export function TeamCreateForm({ onCancel, onSuccess }: TeamCreateFormProps) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState<TeamRecord["type"]>("solo");
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isSubmitting || isNavigating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = schema.safeParse({ name, type });
    if (!result.success) {
      setNameError(result.error.issues[0]?.message);
      return;
    }

    setNameError(undefined);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: result.data.name, type: result.data.type }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Faça login novamente para criar times.");
        } else if (res.status === 503) {
          toast.error("Serviço indisponível. Configure o banco para criar times.");
        } else {
          const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
          toast.error(data.error ?? "Não foi possível criar o time.");
        }
        return;
      }

      const createdTeam = await res.json() as TeamResponse;
      toast.success("Time criado com sucesso.");
      setName("");
      setType("solo");
      onSuccess?.(createdTeam);
      startNavigation(() => {
        router.push(`/times/${createdTeam.team.id}`);
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field>
        <Label htmlFor="team-name">Nome do Time</Label>
        <Input
          id="team-name"
          name="name"
          data-testid="team-create-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(undefined);
          }}
          placeholder="Ex: Solo Wolves"
          disabled={isBusy}
          invalid={!!nameError}
          aria-describedby={nameError ? "team-name-error" : undefined}
        />
        <FieldError id="team-name-error">{nameError}</FieldError>
      </Field>

      <Field>
        <Label>Modalidade</Label>
        <SegmentedControl aria-label="Seleção de modalidade" className="w-full">
          {(["solo", "duo"] as const).map((option) => (
            <SegmentedControlItem
              key={option}
              type="button"
              onClick={() => setType(option)}
              active={type === option}
              className="flex-1"
              aria-pressed={type === option}
              disabled={isBusy}
            >
              {option === "solo" ? "Solo" : "Duplas"}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </Field>

      {onCancel ? (
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            type="submit"
            data-testid="team-create-submit"
            disabled={isBusy}
          >
            {isBusy ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {isSubmitting ? "Criando..." : "Abrindo time..."}
              </>
            ) : "Criar Time"}
          </Button>
        </DialogFooter>
      ) : (
        <Button
          type="submit"
          data-testid="team-create-submit"
          disabled={isBusy}
        >
          {isBusy ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              {isSubmitting ? "Criando..." : "Abrindo time..."}
            </>
          ) : "Criar Time"}
        </Button>
      )}
    </form>
  );
}
