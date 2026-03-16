import { Flame, Swords, TimerReset, Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { IconCallout } from "@/components/ui/icon-callout";
import { SectionHeader } from "@/components/ui/section-header";

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
          <SectionHeader eyebrow="Clima da mesa" title="Leitura oficial" />

          <div className="grid gap-4">
            <div className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] p-1">
              <IconCallout
                icon={<Trophy className="size-4" />}
                title="Mensagem"
                description={flashMessage ?? "Registre a próxima vitória para liberar a zoeira."}
                className="border-none bg-transparent p-4"
              />
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-emphasis)] p-1">
              <IconCallout
                icon={<status.icon className="size-4" />}
                title={status.title}
                description={status.description}
                className="border-none bg-transparent p-4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[color:var(--border-inverse)] bg-[image:var(--brand-gradient)] text-[color:var(--surface-strong-foreground)]">
        <CardContent className="space-y-4 p-6">
          <SectionHeader eyebrow="Painel rápido" title="Painel rápido" inverse hideTitle className="gap-0" />
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <IconCallout
              icon={<Flame className="size-4" />}
              title="Sem burocracia"
              description="O fluxo continua 1-clique para registrar a vitória."
              tone="strong"
            />
            <IconCallout
              icon={<TimerReset className="size-4" />}
              title="Placar derivado"
              description="Liderança e streak continuam calculados pelo histórico."
              tone="strong"
            />
            <IconCallout
              icon={<Swords className="size-4" />}
              title="Base escalável"
              description="A linguagem visual aceita novos times sem virar tela de admin."
              tone="strong"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
