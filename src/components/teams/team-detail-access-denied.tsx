import { RouteStateScreen } from "@/components/route-state-screen";

export function TeamDetailAccessDenied() {
  return (
    <RouteStateScreen
      code="403"
      eyebrow="Acesso ao time"
      title="Voce nao faz parte deste time."
      description="Somente membros atuais podem abrir os detalhes deste time."
      detail="Peca um convite a um membro atual ou volte para a lista dos seus times."
      nextStep="Abra /times e escolha um time do qual voce ja participa."
      primaryAction={{ label: "Voltar para meus times", href: "/times", icon: "back" }}
      secondaryAction={{ label: "Ir para dashboard", href: "/dashboard", icon: "home", tone: "secondary" }}
    />
  );
}
