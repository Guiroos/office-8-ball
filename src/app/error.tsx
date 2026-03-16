"use client";

import { RouteStateScreen } from "@/components/route-state-screen";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteStateScreen
      code="500"
      eyebrow="Tacada interrompida"
      title="Essa rota travou no meio da jogada."
      description="A tela encontrou um erro inesperado durante a renderizacao. O placar continua sendo a fonte de verdade, mas essa rota precisa de uma nova tentativa."
      detail="Tente carregar de novo ou volte para o inicio."
      nextStep="Se ainda falhar, volte ao inicio e entre de novo no placar."
      primaryAction={{
        label: "Tentar novamente",
        onClick: reset,
        icon: "retry",
      }}
      secondaryAction={{
        label: "Voltar ao inicio",
        href: "/",
        icon: "home",
        tone: "secondary",
      }}
    />
  );
}
