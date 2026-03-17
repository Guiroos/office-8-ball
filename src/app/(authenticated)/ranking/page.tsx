import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/authenticated/placeholder-page";

export const metadata: Metadata = {
  title: "Ranking | Office 8 Ball",
  description: "Area reservada para a futura leitura de ranking do Office 8 Ball.",
};

export default function RankingPage() {
  return (
    <PlaceholderPage
      eyebrow="Ranking"
      title="O ranking entra sem inventar dominio novo."
      description="A rota ja existe para sustentar a sidebar compartilhada, mas ainda sem criar calculos paralelos ao scoreboard derivado de matches."
      nextStep="A proxima etapa pode decidir que leitura competitiva cabe aqui sem quebrar os invariantes atuais do placar."
    />
  );
}
