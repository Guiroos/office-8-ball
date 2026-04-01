import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlaceholderPage } from "@/components/authenticated/placeholder-page";

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

describe("PlaceholderPage", () => {
  it("keeps the /times CTA with explicit inverse text on the brand button", () => {
    render(
      <PlaceholderPage
        eyebrow="Times"
        title="A rivalidade ja tem ala reservada."
        description="Descricao curta."
        nextStep="Proximo passo."
      />,
    );

    expect(screen.getByRole("link", { name: "Voltar para times" })).toHaveClass(
      "text-foreground-inverse",
    );
  });
});
