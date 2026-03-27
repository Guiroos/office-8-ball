import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { RankingView } from "@/components/ranking/ranking-view";
import type { RankedTeam } from "@/lib/ranking";

const mockListAllTeamsWithStats = vi.fn();
const mockHasDatabaseUrl = vi.fn();

vi.mock("@/lib/ranking", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ranking")>("@/lib/ranking");
  return {
    ...actual,
    listAllTeamsWithStats: (...args: unknown[]) => mockListAllTeamsWithStats(...args),
  };
});

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    hasDatabaseUrl: () => mockHasDatabaseUrl(),
  };
});

const teams: RankedTeam[] = [
  {
    id: "team-1",
    name: "Time Um",
    type: "duo",
    status: "active",
    createdBy: "user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    members: [],
    teamId: "team-1",
    wins: 3,
    losses: 1,
    winRate: 75,
    currentStreak: { type: "win", count: 2 },
    longestStreak: { type: "win", count: 2 },
    totalMatches: 4,
    rank: 1,
  },
  {
    id: "team-2",
    name: "Time Dois",
    type: "solo",
    status: "active",
    createdBy: "user-2",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    members: [],
    teamId: "team-2",
    wins: 4,
    losses: 2,
    winRate: 66.6,
    currentStreak: { type: "win", count: 1 },
    longestStreak: { type: "win", count: 2 },
    totalMatches: 6,
    rank: 2,
  },
  {
    id: "team-3",
    name: "Time Três",
    type: "duo",
    status: "active",
    createdBy: "user-3",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    members: [],
    teamId: "team-3",
    wins: 2,
    losses: 1,
    winRate: 66.6,
    currentStreak: { type: "loss", count: 1 },
    longestStreak: { type: "win", count: 2 },
    totalMatches: 3,
    rank: 3,
  },
  {
    id: "team-4",
    name: "Time Quatro",
    type: "duo",
    status: "active",
    createdBy: "user-4",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    members: [],
    teamId: "team-4",
    wins: 1,
    losses: 3,
    winRate: 25,
    currentStreak: { type: "loss", count: 2 },
    longestStreak: { type: "win", count: 1 },
    totalMatches: 4,
    rank: 4,
  },
];

describe("RankingView", () => {
  it("renders podium in 2 | 1 | 3 order", () => {
    render(<RankingView teams={teams} activeType="all" mode="available" />);

    const first = screen.getByRole("link", { name: /2º Lugar/ });
    const second = screen.getByRole("link", { name: /1º Lugar/ });
    const third = screen.getByRole("link", { name: /3º Lugar/ });

    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(second.compareDocumentPosition(third) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders list rows from rank 4 onward", () => {
    render(<RankingView teams={teams} activeType="all" mode="available" />);
    expect(screen.getByText("Time Quatro")).toBeInTheDocument();
    expect(screen.queryByText("Time Cinco")).not.toBeInTheDocument();
  });

  it("renders available empty-state copy", () => {
    render(<RankingView teams={[]} activeType="solo" mode="available" />);
    expect(screen.getByText(/Nenhum time encontrado/)).toBeInTheDocument();
  });

  it("renders unavailable copy", () => {
    render(<RankingView teams={[]} activeType="duo" mode="unavailable" />);
    expect(screen.getByText("Ranking indisponível em modo de desenvolvimento")).toBeInTheDocument();
  });

  it("links rows and cards to team detail pages", () => {
    render(<RankingView teams={teams} activeType="all" mode="available" />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/times/team-1")).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === "/times/team-4")).toBe(true);
  });

  it("empty state in mode=available keeps both type and period tabs visible", () => {
    render(
      <RankingView teams={[]} activeType="solo" activePeriod="month" mode="available" />,
    );
    // Type tabs nav present
    expect(screen.getByRole("navigation", { name: "Filtro de tipo de time" })).toBeInTheDocument();
    // Period tabs nav present
    expect(screen.getByRole("navigation", { name: "Filtro de período" })).toBeInTheDocument();
  });

  it("empty state shows period-aware message without falling back to all-time", () => {
    render(
      <RankingView teams={[]} activeType="all" activePeriod="week" mode="available" />,
    );
    expect(screen.getByTestId("empty-state")).toHaveTextContent("nesta semana");
    // Should NOT show generic "nesta categoria" copy when period is week
    expect(screen.queryByText(/nesta categoria/)).not.toBeInTheDocument();
  });

  it("type tab links preserve active period in href", () => {
    render(<RankingView teams={teams} activeType="all" activePeriod="month" mode="available" />);
    const links = screen.getAllByRole("link");
    // The "Solo" tab should include period=month when switching to solo
    const soloLink = links.find((l) => l.textContent === "Solo");
    expect(soloLink?.getAttribute("href")).toBe("/ranking?type=solo&period=month");
  });

  it("period tab links preserve active type in href", () => {
    render(<RankingView teams={teams} activeType="solo" activePeriod="all" mode="available" />);
    const links = screen.getAllByRole("link");
    // The "Esta semana" tab should include type=solo when switching to week
    const weekLink = links.find((l) => l.textContent === "Esta semana");
    expect(weekLink?.getAttribute("href")).toBe("/ranking?type=solo&period=week");
  });
});

describe("RankingPage", () => {
  beforeEach(() => {
    mockListAllTeamsWithStats.mockReset();
    mockHasDatabaseUrl.mockReset();
  });

  it("fetches rankings with validated searchParams type", async () => {
    mockHasDatabaseUrl.mockReturnValue(true);
    mockListAllTeamsWithStats.mockResolvedValue([]);

    const RankingPage = (await import("@/app/(authenticated)/ranking/page")).default;
    await RankingPage({ searchParams: Promise.resolve({ type: "solo" }) });

    expect(mockListAllTeamsWithStats).toHaveBeenCalledWith("solo", "all");
  });

  it("fetches rankings with validated period param", async () => {
    mockHasDatabaseUrl.mockReturnValue(true);
    mockListAllTeamsWithStats.mockResolvedValue([]);

    const RankingPage = (await import("@/app/(authenticated)/ranking/page")).default;
    await RankingPage({ searchParams: Promise.resolve({ type: "solo", period: "month" }) });

    expect(mockListAllTeamsWithStats).toHaveBeenCalledWith("solo", "month");
  });

  it("defaults period to 'all' when param is missing", async () => {
    mockHasDatabaseUrl.mockReturnValue(true);
    mockListAllTeamsWithStats.mockResolvedValue([]);

    const RankingPage = (await import("@/app/(authenticated)/ranking/page")).default;
    await RankingPage({ searchParams: Promise.resolve({}) });

    expect(mockListAllTeamsWithStats).toHaveBeenCalledWith(undefined, "all");
  });
});
