"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type TeamArchiveButtonProps = {
  teamId: string;
};

function mapErrorStatus(status: number, fallbackMessage: string): string {
  if (status === 401) return "Faça login novamente para gerenciar o time.";
  if (status === 403) return "Você não pode excluir este time.";
  if (status === 404) return "Time não encontrado.";
  if (status === 503) return "Serviço indisponível. Configure o banco para gerenciar o time.";
  return fallbackMessage;
}

export function TeamArchiveButton({ teamId }: TeamArchiveButtonProps) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const isBusy = isSubmitting || isNavigating;

  async function handleArchive() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/archive`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        const message = mapErrorStatus(response.status, data.error ?? "Não foi possível excluir o time.");
        toast.error(message);
        return;
      }

      toast.success("Time excluído com sucesso.");
      setIsConfirming(false);
      startNavigation(() => {
        router.push("/times");
        router.refresh();
      });
    } catch {
      toast.error("Não foi possível excluir o time.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isConfirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="w-full border-destructive text-destructive hover:bg-destructive/10 sm:w-auto"
        onClick={() => setIsConfirming(true)}
        disabled={isBusy}
      >
        Excluir Time
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="ghost"
        className="border-destructive text-destructive hover:bg-destructive/10"
        onClick={handleArchive}
        disabled={isBusy}
      >
        {isSubmitting ? "Excluindo..." : "Confirmar Exclusão"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsConfirming(false)}
        disabled={isBusy}
      >
        Cancelar
      </Button>
    </div>
  );
}
