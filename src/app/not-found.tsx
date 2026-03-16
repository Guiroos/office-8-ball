import { RouteStateScreen } from "@/components/route-state-screen";

export default function NotFound() {
  return (
    <RouteStateScreen
      code="404"
      eyebrow="Tacada para fora da mesa"
      title="Essa rota nao existe."
      description="Voce caiu em um canto sem partida, sem placar e sem historico para mostrar."
      detail="Confira o endereco ou volte para uma area valida do app."
      nextStep="Use um dos atalhos abaixo para voltar ao fluxo certo."
      primaryAction={{
        label: "Voltar ao inicio",
        href: "/",
        icon: "home",
      }}
      secondaryAction={{
        label: "Abrir o placar",
        href: "/scoreboard",
        icon: "back",
        tone: "secondary",
      }}
    />
  );
}
