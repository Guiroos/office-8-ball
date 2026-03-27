"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiErrorResponse, TeamResponse } from "@/lib/types";

const schema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório.")
    .max(50, "Nome pode ter no máximo 50 caracteres.")
    .transform((v) => v.trim().toLowerCase()),
});

export function TeamCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = schema.safeParse({ name });
    if (!result.success) {
      setNameError(result.error.issues[0]?.message);
      return;
    }

    setNameError(undefined);
    setLoading(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: result.data.name, type: "solo" }),
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

      await res.json() as TeamResponse;
      toast.success("Time criado com sucesso.");
      setName("");
      router.push("/times?tab=teams");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="team-name"
          className="text-sm font-medium text-foreground"
        >
          Nome do Time
        </label>
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
          disabled={loading}
          invalid={!!nameError}
        />
        {nameError && (
          <p className="text-sm text-danger">{nameError}</p>
        )}
      </div>

      <Button
        type="submit"
        data-testid="team-create-submit"
        disabled={loading}
      >
        {loading ? "Criando..." : "Criar Time"}
      </Button>
    </form>
  );
}
