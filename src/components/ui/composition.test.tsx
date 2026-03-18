import { ChartColumn, ShieldCheck } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IconCallout } from "@/components/primitives/icon-callout";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatTile } from "@/components/primitives/stat-tile";
import { Card } from "@/components/ui/card";

describe("composition ui", () => {
  it("renders section header with optional description", () => {
    render(
      <SectionHeader
        eyebrow="Painel rápido"
        title="Histórico recente"
        description="Resumo da mesa"
      />,
    );

    expect(screen.getByText("Painel rápido")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Histórico recente" })).toBeInTheDocument();
    expect(screen.getByText("Resumo da mesa")).toBeInTheDocument();
  });

  it("renders section header actions and inverse styles", () => {
    render(
      <SectionHeader
        eyebrow="Placar atual"
        title="Frontend vs Backend"
        description="Resumo principal"
        inverse
        actions={<button type="button">Atualizar</button>}
      />,
    );

    const eyebrow = screen.getByText("Placar atual");
    const description = screen.getByText("Resumo principal");

    expect(screen.getByRole("heading", { name: "Frontend vs Backend" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeInTheDocument();
    expect(eyebrow).toHaveClass("border-border-inverse");
    expect(description).toHaveClass("text-surface-strong-foreground-muted");
  });

  it("keeps the title accessible when visually hidden", () => {
    render(<SectionHeader eyebrow="Painel rápido" title="Painel rápido" hideTitle />);

    expect(screen.getByRole("heading", { name: "Painel rápido" })).toHaveClass("sr-only");
  });

  it("applies custom title and description classes", () => {
    render(
      <SectionHeader
        eyebrow="Mesa oficial"
        title="Office 8 Ball"
        description="Resumo da rivalidade"
        titleClassName="custom-title"
        descriptionClassName="custom-description"
      />,
    );

    expect(screen.getByRole("heading", { name: "Office 8 Ball" })).toHaveClass("custom-title");
    expect(screen.getByText("Resumo da rivalidade")).toHaveClass("custom-description");
  });

  it("renders stat tile in inverse tone", () => {
    render(
      <StatTile label="Ambiente" value="Escritório" description="mesa oficial" tone="inverse" />,
    );

    expect(screen.getByText("Ambiente")).toBeInTheDocument();
    expect(screen.getByText("Escritório")).toBeInTheDocument();
    expect(screen.getByText("mesa oficial")).toBeInTheDocument();
    expect(screen.getByText("Ambiente")).toHaveClass("text-surface-strong-foreground-muted");
    expect(screen.getByText("mesa oficial")).toHaveClass("text-surface-strong-foreground-muted");
  });

  it("renders icon callout content", () => {
    render(
      <IconCallout
        icon={<ShieldCheck className="size-4" />}
        title="Status do ambiente"
        description="Sessao local pronta para liberar o placar."
      />,
    );

    expect(screen.getByText("Status do ambiente")).toBeInTheDocument();
    expect(screen.getByText("Sessao local pronta para liberar o placar.")).toBeInTheDocument();
  });

  it("renders icon callout tones with the expected structure", () => {
    const { rerender } = render(
      <IconCallout
        icon={<ShieldCheck className="size-4" />}
        title="Status"
        description="Base padrao"
        tone="success"
      />,
    );

    let callout = screen.getByText("Status").closest("div.border");
    expect(callout).toHaveClass("bg-surface-success");
    expect(screen.getByText("Base padrao")).toHaveClass("text-muted-foreground");

    rerender(
      <IconCallout
        icon={<ShieldCheck className="size-4" />}
        title="Status"
        description="Base forte"
        tone="strong"
      />,
    );

    callout = screen.getByText("Status").closest("div.border");
    expect(callout).toHaveClass("border-border-inverse");
    expect(screen.getByText("Base forte")).toHaveClass("text-surface-strong-foreground-muted");
  });

  it("renders custom stat node values", () => {
    render(
      <StatTile
        label="Total"
        value={
          <strong className="text-4xl font-black">
            <ChartColumn />
            12
          </strong>
        }
      />,
    );

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("does not render a description node when it is absent", () => {
    render(<StatTile label="Ritmo" value="Mesa pronta" />);

    expect(screen.getByText("Ritmo")).toBeInTheDocument();
    expect(screen.getByText("Mesa pronta")).toBeInTheDocument();
    expect(screen.queryByText("mesa oficial")).not.toBeInTheDocument();
  });

  it("preserves custom className passthrough across composition components", () => {
    const { rerender } = render(
      <SectionHeader eyebrow="Painel" title="Resumo" className="custom-shell" />,
    );

    expect(screen.getByText("Painel").closest(".custom-shell")).toBeInTheDocument();

    rerender(
      <StatTile label="Ritmo" value="Mesa pronta" className="custom-tile" data-testid="tile" />,
    );
    expect(screen.getByTestId("tile")).toHaveClass("custom-tile");

    rerender(
      <IconCallout
        icon={<ShieldCheck className="size-4" />}
        title="Status"
        description="Texto"
        className="custom-callout"
      />,
    );
    expect(screen.getByText("Status").closest(".custom-callout")).toBeInTheDocument();

    rerender(
      <Card className="custom-panel" data-testid="panel">
        Conteúdo
      </Card>,
    );
    expect(screen.getByTestId("panel")).toHaveClass("custom-panel");
  });

  it("renders card variants and padded mode", () => {
    const { rerender } = render(
      <Card variant="brand" padded data-testid="panel">
        Conteúdo
      </Card>,
    );

    let panel = screen.getByTestId("panel");
    expect(panel).toHaveClass("bg-surface-brand");
    expect(panel).toHaveClass("shadow-brand");
    expect(panel).toHaveClass("p-6");

    rerender(
      <Card variant="strong" data-testid="panel">
        Conteúdo
      </Card>,
    );

    panel = screen.getByTestId("panel");
    expect(panel).toHaveClass("bg-surface-strong");
    expect(panel).toHaveClass("text-surface-strong-foreground");
  });

  it("renders default and muted card variants", () => {
    const { rerender } = render(
      <Card variant="default" data-testid="panel">
        Conteúdo
      </Card>,
    );

    let panel = screen.getByTestId("panel");
    expect(panel).toHaveClass("bg-surface");
    expect(panel).toHaveClass("shadow-lg");

    rerender(
      <Card variant="muted" data-testid="panel">
        Conteúdo
      </Card>,
    );

    panel = screen.getByTestId("panel");
    expect(panel).toHaveClass("bg-surface-emphasis");
    expect(panel).toHaveClass("border-border");
  });
});
