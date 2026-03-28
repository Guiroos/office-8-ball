"use client";

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { TeamCard } from "@/components/teams/team-card";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("TeamCard", () => {
  it("renders partner, summary stats and activity metadata for duo teams", () => {
    render(
      <TeamCard
        team={{
          id: "team-1",
          name: "dupla afiada",
          type: "duo",
          status: "active",
          createdBy: "user-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          members: [
            { userId: "user-1", joinedAt: "2026-01-01T00:00:00.000Z" },
            { userId: "user-2", joinedAt: "2026-01-02T00:00:00.000Z" },
          ],
          partners: [{ userId: "user-2", username: "jean.dev", displayName: "Jean" }],
          summary: {
            wins: 4,
            losses: 2,
            winRate: 66.7,
            totalMatches: 6,
            lastFiveResults: ["win", "loss", "win", "win", "loss"],
            lastPlayedAt: "2026-01-12T00:00:00.000Z",
          },
        }}
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/times/team-1");
    expect(screen.getByText("Com Jean")).toBeInTheDocument();
    expect(screen.getByText("4V · 2D")).toBeInTheDocument();
    expect(screen.getByText("66.7%")).toBeInTheDocument();
    expect(screen.getByText("6 partidas registradas")).toBeInTheDocument();
    expect(screen.getByText(/Última partida em/i)).toBeInTheDocument();
  });

  it("renders a stable empty-state summary for solo teams without matches", () => {
    render(
      <TeamCard
        team={{
          id: "team-2",
          name: "lobo solo",
          type: "solo",
          status: "active",
          createdBy: "user-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          members: [{ userId: "user-1", joinedAt: "2026-01-01T00:00:00.000Z" }],
          partners: [],
          summary: {
            wins: 0,
            losses: 0,
            winRate: 0,
            totalMatches: 0,
            lastFiveResults: [],
            lastPlayedAt: null,
          },
        }}
      />,
    );

    expect(screen.getByText("Time solo")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma partida registrada")).toBeInTheDocument();
    expect(screen.getByText("Aguardando primeira partida")).toBeInTheDocument();
  });
});
