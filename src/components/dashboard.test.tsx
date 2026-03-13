import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Dashboard } from "@/components/dashboard";
import type {
  CreateMatchResponse,
  MatchesResponse,
  ScoreboardResponse,
} from "@/lib/types";

const initialScoreboard: ScoreboardResponse = {
  scoreboard: {
    teams: [
      {
        id: "frontend",
        name: "frontend",
        displayName: "Frontend",
        roster: "Gui + Jean",
        accent: "var(--frontend)",
        accentSoft: "var(--frontend-soft)",
        slogan: "Empurra feature e bola no mesmo sprint.",
        wins: 0,
      },
      {
        id: "backend",
        name: "backend",
        displayName: "Backend",
        roster: "Adair + Richard",
        accent: "var(--backend)",
        accentSoft: "var(--backend-soft)",
        slogan: "Consistentes ate quando o deploy cai.",
        wins: 0,
      },
    ],
    leaderTeamId: null,
    leadBy: 0,
    totalMatches: 0,
    currentStreak: null,
  },
};

const updatedScoreboard: ScoreboardResponse = {
  scoreboard: {
    ...initialScoreboard.scoreboard,
    teams: initialScoreboard.scoreboard.teams.map((team) =>
      team.id === "frontend" ? { ...team, wins: 1 } : team,
    ),
    leaderTeamId: "frontend",
    leadBy: 1,
    totalMatches: 1,
    currentStreak: {
      teamId: "frontend",
      teamName: "Frontend",
      count: 1,
    },
  },
};

const emptyMatches: MatchesResponse = { matches: [] };

const updatedMatches: MatchesResponse = {
  matches: [
    {
      id: "match-1",
      winnerTeamId: "frontend",
      winnerName: "Frontend",
      winnerRoster: "Gui + Jean",
      playedAt: "2026-03-12T10:00:00.000Z",
      note: null,
    },
  ],
};

const createMatchResponse: CreateMatchResponse = {
  match: updatedMatches.matches[0],
  message: "Frontend ganhou. Backend abriu um ticket para investigar.",
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  });
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and renders the scoreboard and empty state", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((input) => {
        const url = String(input);

        if (url === "/api/scoreboard") {
          return jsonResponse(initialScoreboard) as ReturnType<typeof fetch>;
        }

        if (url === "/api/matches") {
          return jsonResponse(emptyMatches) as ReturnType<typeof fetch>;
        }

        throw new Error(`Unexpected fetch to ${url}`);
      });

    render(<Dashboard />);

    expect(
      screen.getByText("Carregando o tribunal da sinuca..."),
    ).toBeInTheDocument();

    expect(await screen.findByText("Nenhuma partida registrada ainda.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frontend vs Backend" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows an error state when the initial load fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(<Dashboard />);

    expect(
      await screen.findByText("Não foi possível carregar o placar."),
    ).toBeInTheDocument();
    expect(screen.getByText("Falha ao sincronizar a mesa.")).toBeInTheDocument();
  });

  it("posts a win, reloads data and displays the returned message", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((input, init) => {
        const url = String(input);

        if (url === "/api/scoreboard") {
          return (fetchMock.mock.calls.length <= 1
            ? jsonResponse(initialScoreboard)
            : jsonResponse(updatedScoreboard)) as ReturnType<typeof fetch>;
        }

        if (url === "/api/matches" && !init?.method) {
          return (fetchMock.mock.calls.length <= 2
            ? jsonResponse(emptyMatches)
            : jsonResponse(updatedMatches)) as ReturnType<typeof fetch>;
        }

        if (url === "/api/matches" && init?.method === "POST") {
          expect(init.body).toBe(JSON.stringify({ winnerTeamId: "frontend" }));
          return jsonResponse(createMatchResponse, true, 201) as ReturnType<typeof fetch>;
        }

        throw new Error(`Unexpected fetch to ${url}`);
      });

    render(<Dashboard />);

    await screen.findByRole("button", { name: "Vitória Frontend" });

    await userEvent.click(screen.getByRole("button", { name: "Vitória Frontend" }));

    await waitFor(() => {
      expect(screen.getByText(createMatchResponse.message)).toBeInTheDocument();
    });

    expect(await screen.findByText("Frontend lidera por 1.")).toBeInTheDocument();
    expect(await screen.findByText("1x")).toBeInTheDocument();
    expect(screen.queryByText("Nenhuma partida registrada ainda.")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
