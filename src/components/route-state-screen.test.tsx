import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RouteStateScreen } from "@/components/route-state-screen";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: ({ className }: { className?: string }) => (
    <button type="button" className={className}>
      Tema
    </button>
  ),
}));

describe("RouteStateScreen", () => {
  it("renders status content and navigation links", () => {
    render(
      <RouteStateScreen
        code="404"
        eyebrow="Tacada para fora da mesa"
        title="Essa rota nao existe."
        description="Descricao curta."
        detail="Detalhe complementar."
        nextStep="Volte usando os atalhos."
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
      />,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Essa rota nao existe." })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Voltar ao inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Abrir o placar" })).toHaveAttribute(
      "href",
      "/scoreboard",
    );
  });

  it("calls the retry action when the primary button is clicked", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();

    render(
      <RouteStateScreen
        code="500"
        eyebrow="Tacada interrompida"
        title="Essa rota travou no meio da jogada."
        description="Descricao curta."
        detail="Detalhe complementar."
        nextStep="Tente novamente."
        primaryAction={{
          label: "Tentar novamente",
          onClick: retry,
          icon: "retry",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
