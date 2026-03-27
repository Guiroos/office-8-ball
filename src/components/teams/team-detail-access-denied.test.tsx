import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TeamDetailAccessDenied } from "@/components/teams/team-detail-access-denied";

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

describe("TeamDetailAccessDenied", () => {
  it("renders the access denied message", () => {
    render(<TeamDetailAccessDenied />);
    expect(screen.getAllByText("Voce nao faz parte deste time.").length).toBeGreaterThan(0);
  });

  it("renders the 403 code", () => {
    render(<TeamDetailAccessDenied />);
    expect(screen.getByText("403")).toBeInTheDocument();
  });

  it("renders a link back to /times", () => {
    render(<TeamDetailAccessDenied />);
    const link = screen.getByRole("link", { name: /Voltar para meus times/i });
    expect(link).toHaveAttribute("href", "/times");
  });

  it("renders a secondary link to /dashboard", () => {
    render(<TeamDetailAccessDenied />);
    const link = screen.getByRole("link", { name: /Ir para dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });
});
