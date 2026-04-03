'use client'

import { AlertTriangle } from "lucide-react";

export default function TeamDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertTriangle className="size-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">Erro ao carregar detalhes do time</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Não foi possível carregar as informações. Tente novamente.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="inline-flex rounded-pill border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:border-border-strong hover:bg-surface-emphasis"
      >
        Tentar novamente
      </button>
    </div>
  );
}
