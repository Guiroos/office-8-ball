import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { RankingView } from "@/components/ranking/ranking-view";
import type { RankedTeam } from "@/lib/ranking";

const { mockListAllTeamsWithStats, mockHasDatabaseUrl, mockPush } = vi.hoisted(() => ({
  mockListAllTeamsWithStats: vi.fn(),
  mockHasDatabaseUrl: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/lib/ranking", () => ({
  listAllTeamsWithStats: (...args: unknown[]) => mockListAllTeamsWithStats(...args),
}));

vi.mock("@/lib/auth", () => ({
  hasDatabaseUrl: () => mockHasDatabaseUrl(),
  getAuthenticatedUser: vi.fn(),
  getAuthUnavailableResponse: vi.fn(() => new Response(JSON.stringify({ error: "unavailable" }), { status: 503 })),
  getAuthRequiredResponse: vi.fn(() => new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })),
}));

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
    memberNames: ["Ana", "Bruno"],
    teamId: "team-1",
    wins: 3,
    losses: 1,
    winRate: 75,
    currentStreak: { type: "win", count: 2 },
    longestStreak: { type: "win", count: 2 },
    totalMatches: 4,
    lastFiveResults: ["win", "win", "loss", "win"],
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
    memberNames: ["Carla"],
    teamId: "team-2",
    wins: 4,
    losses: 2,
    winRate: 66.6,
    currentStreak: { type: "win", count: 1 },
    longestStreak: { type: "win", count: 2 },
    totalMatches: 6,
    lastFiveResults: ["win", "loss", "loss", "win", "win"],
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
    memberNames: ["Davi", "Elisa"],
    teamId: "team-3",
    wins: 2,
    losses: 1,
    winRate: 66.6,
    currentStreak: { type: "loss", count: 1 },
    longestStreak: { type: "win", count: 2 },
    totalMatches: 3,
    lastFiveResults: ["loss", "win", "win"],
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
    memberNames: ["Fábio", "Gabi"],
    teamId: "team-4",
    wins: 1,
    losses: 3,
    winRate: 25,
    currentStreak: { type: "loss", count: 2 },
    longestStreak: { type: "win", count: 1 },
    totalMatches: 4,
    lastFiveResults: ["loss", "loss", "win", "loss"],
    rank: 4,
  },
];

describe("RankingView", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

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
    const standings = screen.getByRole("region", { name: "Classificação" });

    expect(within(standings).getAllByText("Time Quatro")).toHaveLength(2);
    expect(within(standings).queryByText("Time Cinco")).not.toBeInTheDocument();
  });

  it("renders member display names as podium subtitle", () => {
    render(<RankingView teams={teams} activeType="all" mode="available" />);

    expect(screen.getByText("Ana • Bruno")).toBeInTheDocument();
    expect(screen.getByText("Carla")).toBeInTheDocument();
    expect(screen.getByText("Davi • Elisa")).toBeInTheDocument();
    expect(screen.queryByText("Fábio • Gabi")).not.toBeInTheDocument();
  });

  it("renders a team type badge on podium cards", () => {
    render(<RankingView teams={teams} activeType="all" mode="available" />);

    const teamOneLink = screen.getAllByRole("link").find((link) => link.getAttribute("href") === "/times/team-1");
    const teamTwoLink = screen.getAllByRole("link").find((link) => link.getAttribute("href") === "/times/team-2");

    expect(teamOneLink).toBeDefined();
    expect(teamTwoLink).toBeDefined();
    expect(within(teamOneLink!).getByText("Dupla")).toBeInTheDocument();
    expect(within(teamTwoLink!).getByText("Solo")).toBeInTheDocument();
  });

  it("renders available empty-state copy", () => {
    render(<RankingView teams={[]} activeType="solo" mode="available" />);
    expect(screen.getByText(/Nenhum time encontrado/)).toBeInTheDocument();
  });

  it("renders unavailable header without ranking content", () => {
    render(<RankingView teams={[]} activeType="duo" mode="unavailable" />);
    expect(screen.getByRole("heading", { name: "Placar de times" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Categoria")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Período")).not.toBeInTheDocument();
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });

  it("links rows and cards to team detail pages", () => {
    render(<RankingView teams={teams} activeType="all" mode="available" />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/times/team-1")).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === "/times/team-4")).toBe(true);
  });

  it("renders the last 5 matches as visual indicators in standings rows", () => {
    render(<RankingView teams={teams} activeType="all" mode="available" />);

    const history = screen.getAllByLabelText("Últimas 5 partidas de Time Quatro");
    expect(history).toHaveLength(2);

    const desktopHistory = history[0]!;
    expect(within(desktopHistory).getByLabelText("Partida 1: derrota")).toBeInTheDocument();
    expect(within(desktopHistory).getByLabelText("Partida 2: derrota")).toBeInTheDocument();
    expect(within(desktopHistory).getByLabelText("Partida 3: vitória")).toBeInTheDocument();
    expect(within(desktopHistory).getByLabelText("Partida 4: derrota")).toBeInTheDocument();
    expect(within(desktopHistory).getByLabelText("Partida 5: sem histórico")).toBeInTheDocument();
  });

  it("empty state in mode=available keeps both type and period tabs visible", () => {
    render(
      <RankingView teams={[]} activeType="solo" activePeriod="month" mode="available" />,
    );
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
    expect(screen.getByLabelText("Período")).toBeInTheDocument();
  });

  it("empty state shows period-aware message without falling back to all-time", () => {
    render(
      <RankingView teams={[]} activeType="all" activePeriod="week" mode="available" />,
    );
    expect(screen.getByTestId("empty-state")).toHaveTextContent("nesta semana");
    // Should NOT show generic "nesta categoria" copy when period is week
    expect(screen.queryByText(/nesta categoria/)).not.toBeInTheDocument();
  });

  it("type filter preserves active period when changing the selection", async () => {
    const user = userEvent.setup();

    render(<RankingView teams={teams} activeType="all" activePeriod="month" mode="available" />);

    await user.click(screen.getByRole("combobox", { name: "Categoria" }));
    await user.keyboard("{ArrowDown}{Enter}");

    expect(mockPush).toHaveBeenCalledWith("/ranking?type=solo&period=month");
  });

  it("period filter preserves active type when changing the selection", async () => {
    const user = userEvent.setup();

    render(<RankingView teams={teams} activeType="solo" activePeriod="all" mode="available" />);

    await user.click(screen.getByRole("combobox", { name: "Período" }));
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(mockPush).toHaveBeenCalledWith("/ranking?type=solo&period=week");
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
