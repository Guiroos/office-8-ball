import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/authenticated/placeholder-page";

export const metadata: Metadata = {
  title: "Times | Office 8 Ball",
  description: "Area reservada para a evolucao dos times no Office 8 Ball.",
};

export default function TeamsPage() {
  return (
    <PlaceholderPage
      eyebrow="Times"
      title="A rivalidade ja tem ala reservada."
      description="A shell autenticada ja suporta a rota, mas o CRUD real de times continua fora desta fase para manter o v1 estreito."
      nextStep="Quando essa area evoluir, ela nasce aqui sem duplicar navegacao, conta ou preferencias globais."
    />
  );
}
