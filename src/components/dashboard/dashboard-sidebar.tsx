import { Flame, Swords, TimerReset, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { DashboardStatus } from "./dashboard-utils";

export function DashboardSidebar({
  flashMessage,
  status,
}: {
  flashMessage: string | null;
  status: DashboardStatus;
}) {
  return (
    <div className="grid gap-6">
      <Card className="bg-[color:var(--surface)]">
        <CardContent className="space-y-5 p-6">
          <CardHeader className="gap-3">
            <Badge>Clima da mesa</Badge>
            <CardTitle>Leitura oficial</CardTitle>
          </CardHeader>

          <div className="grid gap-4">
            <div className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--muted-foreground)]">
                    Mensagem
                  </p>
                  <strong className="mt-3 block text-lg font-semibold leading-7">
                    {flashMessage ?? "Registre a próxima vitória para liberar a zoeira."}
                  </strong>
                </div>
                <div className="rounded-[var(--radius-pill)] bg-[color:var(--gold-soft)] p-3 text-[color:var(--foreground)]">
                  <Trophy className="size-5" />
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--muted-foreground)]">
                    Status
                  </p>
                  <strong className="mt-3 block text-lg font-semibold leading-7">
                    {status.title}
                  </strong>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                    {status.description}
                  </p>
                </div>
                <div className="rounded-[var(--radius-pill)] bg-[color:var(--surface-muted)] p-3 text-[color:var(--foreground)]">
                  <status.icon className="size-5" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[color:var(--border-inverse)] bg-[image:var(--brand-gradient)] text-[color:var(--surface-strong-foreground)]">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] text-[color:var(--surface-strong-foreground-muted)]">
            Painel rápido
          </Badge>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] p-4">
              <Flame className="mt-0.5 size-5 shrink-0 text-[color:var(--surface-strong-foreground-muted)]" />
              <div>
                <p className="text-sm font-semibold">Sem burocracia</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--surface-strong-foreground-muted)]">
                  O fluxo continua 1-clique para registrar a vitória.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] p-4">
              <TimerReset className="mt-0.5 size-5 shrink-0 text-[color:var(--surface-strong-foreground-muted)]" />
              <div>
                <p className="text-sm font-semibold">Placar derivado</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--surface-strong-foreground-muted)]">
                  Liderança e streak continuam calculados pelo histórico.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--border-inverse)] bg-[color:var(--surface-strong-muted)] p-4">
              <Swords className="mt-0.5 size-5 shrink-0 text-[color:var(--surface-strong-foreground-muted)]" />
              <div>
                <p className="text-sm font-semibold">Base escalável</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--surface-strong-foreground-muted)]">
                  A linguagem visual aceita novos times sem virar tela de admin.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
