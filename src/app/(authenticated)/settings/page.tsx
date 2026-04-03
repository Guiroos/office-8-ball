import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/authenticated/placeholder-page";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Configuracoes | Office 8 Ball",
  description: "Pagina inicial de configuracoes da area autenticada.",
};

export default function SettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Configuracoes"
      title="Configuracoes sem inflar o produto."
      description="Tema, logout e futuras preferencias globais agora tem um lugar natural no fluxo autenticado, sem misturar tudo com a dashboard."
      nextStep="Preferencias persistidas continuam fora do escopo desta etapa, mas a estrutura de navegacao ja ficou estavel."
    />
  );
}
