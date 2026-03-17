import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/authenticated/placeholder-page";

export const metadata: Metadata = {
  title: "Perfil | Office 8 Ball",
  description: "Pagina inicial de perfil baseada na sessao autenticada.",
};

export default function ProfilePage() {
  return (
    <PlaceholderPage
      eyebrow="Perfil"
      title="Perfil minimo, sem dominio extra."
      description="Nesta fase o acesso ao perfil serve para consolidar o menu de conta dentro da shell autenticada, sem criar modelo novo de usuario."
      nextStep="Quando houver nickname, avatar real ou preferencias persistidas, esta pagina ja esta pronta para receber a expansao."
    />
  );
}
