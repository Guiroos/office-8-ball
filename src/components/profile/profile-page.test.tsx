import { act, render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePage } from "@/components/profile/profile-page";
import type { ProfilePageData } from "@/lib/types";

// ── Base data fixture ──────────────────────────────────────────────────────────

const BASE_DATA: ProfilePageData & { email: string | null } = {
  userId: "user-1",
  username: "gui.dev",
  email: "gui@office8ball.dev",
  displayName: "Guilherme",
  avatarUrl: null,
  bio: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  aggregate: {
    wins: 7,
    losses: 3,
    winRate: 70,
    totalMatches: 10,
  },
  teamRows: [
    {
      teamId: "team-1",
      teamName: "Equipe Alpha",
      wins: 5,
      losses: 2,
      winRate: 71.42857142857143,
      totalMatches: 7,
    },
  ],
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hero with username and display name from props", () => {
    render(<ProfilePage data={BASE_DATA} />);
    expect(screen.getByText("Guilherme")).toBeInTheDocument();
    expect(screen.getByText("@gui.dev")).toBeInTheDocument();
  });

  it("renders aggregate stats from props", () => {
    render(<ProfilePage data={BASE_DATA} />);
    expect(screen.getByText("7")).toBeInTheDocument(); // wins
    expect(screen.getByText("3")).toBeInTheDocument(); // losses
    expect(screen.getByText("70%")).toBeInTheDocument(); // win rate
    expect(screen.getByText("10")).toBeInTheDocument(); // total matches
  });

  it("renders team rows with per-team stats", () => {
    render(<ProfilePage data={BASE_DATA} />);
    expect(screen.getByText("Equipe Alpha")).toBeInTheDocument();
    expect(screen.getByText("5V")).toBeInTheDocument();
    expect(screen.getByText("2D")).toBeInTheDocument();
  });

  it("shows empty teams callout when teamRows is empty", () => {
    const data = { ...BASE_DATA, teamRows: [] };
    render(<ProfilePage data={data} />);
    expect(screen.getByText("Nenhum time ainda")).toBeInTheDocument();
  });

  it("shows account email in account info section", () => {
    render(<ProfilePage data={BASE_DATA} />);
    expect(screen.getByText("gui@office8ball.dev")).toBeInTheDocument();
  });

  it("shows username when displayName is null", () => {
    const data = { ...BASE_DATA, displayName: null };
    render(<ProfilePage data={data} />);
    // The hero h2 should show username when displayName is null
    expect(screen.getByText("gui.dev", { selector: "h2" })).toBeInTheDocument();
  });

  it("renders share button that changes to Copiado! on click", async () => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<ProfilePage data={BASE_DATA} />);

    fireEvent.click(screen.getByText("Compartilhar"));
    expect(screen.getByText("Copiado!")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2001); });
    expect(screen.getByText("Compartilhar")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("opens edit dialog when Editar button is clicked", () => {
    render(<ProfilePage data={BASE_DATA} />);
    fireEvent.click(screen.getByText("Editar"));
    expect(screen.getByText("Editar Perfil")).toBeInTheDocument();
  });
});
