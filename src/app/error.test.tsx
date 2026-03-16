import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ErrorPage from "@/app/error";

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

describe("app/error", () => {
  it("renders the route error content and retries", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(<ErrorPage error={new Error("route failed")} reset={reset} />);

    expect(screen.getByText("500")).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "Essa rota travou no meio da jogada." }),
    ).toHaveLength(2);
    expect(screen.getByText("Tente carregar de novo ou volte para o inicio.")).toBeInTheDocument();
    expect(
      screen.getByText("Se ainda falhar, volte ao inicio e entre de novo no placar."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Voltar ao inicio" })).toHaveAttribute("href", "/");
  });
});
