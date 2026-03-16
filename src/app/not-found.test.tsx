import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NotFound from "@/app/not-found";

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

describe("app/not-found", () => {
  it("renders the 404 content and recovery links", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "Essa rota nao existe." }),
    ).toHaveLength(2);
    expect(screen.getByText("Confira o endereco ou volte para uma area valida do app.")).toBeInTheDocument();
    expect(
      screen.getByText("Use um dos atalhos abaixo para voltar ao fluxo certo."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Abrir o placar" })).toHaveAttribute(
      "href",
      "/scoreboard",
    );
  });
});
