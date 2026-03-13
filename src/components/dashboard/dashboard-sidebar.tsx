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
      <Card className="bg-[color:var(--card)]/95">
        <CardContent className="space-y-5 p-6">
          <CardHeader className="gap-3">
            <Badge>Clima da mesa</Badge>
            <CardTitle>Leitura oficial</CardTitle>
          </CardHeader>

          <div className="grid gap-4">
            <div className="rounded-[22px] border border-[color:var(--border)] bg-white/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                    Mensagem
                  </p>
                  <strong className="mt-3 block text-lg font-semibold leading-7">
                    {flashMessage ?? "Registre a próxima vitória para liberar a zoeira."}
                  </strong>
                </div>
                <div className="rounded-full bg-[color:var(--gold-soft)] p-3 text-[color:var(--foreground)]">
                  <Trophy className="size-5" />
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-[color:var(--border)] bg-white/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                    Status
                  </p>
                  <strong className="mt-3 block text-lg font-semibold leading-7">
                    {status.title}
                  </strong>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                    {status.description}
                  </p>
                </div>
                <div className="rounded-full bg-black/6 p-3 text-[color:var(--foreground)]">
                  <status.icon className="size-5" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[linear-gradient(135deg,rgba(22,102,87,0.96),rgba(10,45,39,0.92))] text-white">
        <CardContent className="space-y-4 p-6">
          <Badge className="border-white/20 bg-white/10 text-white/72">Painel rápido</Badge>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/8 p-4">
              <Flame className="mt-0.5 size-5 shrink-0 text-white/80" />
              <div>
                <p className="text-sm font-semibold">Sem burocracia</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  O fluxo continua 1-clique para registrar a vitória.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/8 p-4">
              <TimerReset className="mt-0.5 size-5 shrink-0 text-white/80" />
              <div>
                <p className="text-sm font-semibold">Placar derivado</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  Liderança e streak continuam calculados pelo histórico.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/8 p-4">
              <Swords className="mt-0.5 size-5 shrink-0 text-white/80" />
              <div>
                <p className="text-sm font-semibold">Base escalável</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
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
