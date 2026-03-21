import { Flame, Swords, TimerReset } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { IconCallout } from "@/components/primitives/icon-callout";
import { SectionHeader } from "@/components/primitives/section-header";

export function DashboardSidebar() {
  return (
    <div className="grid gap-6">
      <Card variant="brand">
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
