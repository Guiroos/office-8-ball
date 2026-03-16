import { render, screen, waitFor, within } from "@testing-library/react";
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
          expect(init.body).toBe(
            JSON.stringify({
              winnerTeamId: "frontend",
              note: "virou passeio",
            }),
          );
          return jsonResponse(createMatchResponse, true, 201) as ReturnType<typeof fetch>;
        }

        throw new Error(`Unexpected fetch to ${url}`);
      });

    render(<Dashboard />);

    await screen.findByRole("button", { name: "Vitória Frontend" });

    const frontendCard = screen
      .getByRole("button", { name: "Vitória Frontend" })
      .closest("[data-team='frontend']");
    const backendCard = screen
      .getByRole("button", { name: "Vitória Backend" })
      .closest("[data-team='backend']");

    expect(frontendCard).not.toBeNull();
    expect(backendCard).not.toBeNull();

    const frontendNote = within(frontendCard as HTMLElement).getByLabelText(
      "Provocação opcional",
    );
    const backendNote = within(backendCard as HTMLElement).getByLabelText(
      "Provocação opcional",
    );

    await userEvent.type(frontendNote, "virou passeio");
    await userEvent.type(backendNote, "fica para a próxima");

    await userEvent.click(screen.getByRole("button", { name: "Vitória Frontend" }));

    await waitFor(() => {
      expect(screen.getByText(createMatchResponse.message)).toBeInTheDocument();
    });

    expect(frontendCard).toHaveAttribute("data-leader", "true");
    expect(frontendCard).toHaveClass("bg-[color:var(--frontend-soft)]");
    expect(frontendCard).toHaveClass("ring-[color:var(--gold)]");
    expect(frontendCard).not.toHaveAttribute("style");
    expect(backendCard).toHaveAttribute("data-leader", "false");
    expect(backendCard).toHaveClass("bg-[color:var(--backend-soft)]");
    expect(backendCard).not.toHaveAttribute("style");

    expect(await screen.findByText("Frontend lidera por 1.")).toBeInTheDocument();
    expect(await screen.findByText("1x")).toBeInTheDocument();
    expect(screen.queryByText("Nenhuma partida registrada ainda.")).not.toBeInTheDocument();
    expect(frontendNote).toHaveValue("");
    expect(backendNote).toHaveValue("fica para a próxima");
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("preserves the note when saving fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input);

      if (url === "/api/scoreboard") {
        return jsonResponse(initialScoreboard) as ReturnType<typeof fetch>;
      }

      if (url === "/api/matches" && !init?.method) {
        return jsonResponse(emptyMatches) as ReturnType<typeof fetch>;
      }

      if (url === "/api/matches" && init?.method === "POST") {
        return jsonResponse(
          { error: "Não foi possível salvar a partida." },
          false,
          500,
        ) as ReturnType<typeof fetch>;
      }

      throw new Error(`Unexpected fetch to ${url}`);
    });

    render(<Dashboard />);

    await screen.findByRole("button", { name: "Vitória Backend" });

    const backendCard = screen
      .getByRole("button", { name: "Vitória Backend" })
      .closest("[data-team='backend']");

    expect(backendCard).not.toBeNull();

    const backendNote = within(backendCard as HTMLElement).getByLabelText(
      "Provocação opcional",
    );

    await userEvent.type(backendNote, "quase uma humilhação");
    await userEvent.click(screen.getByRole("button", { name: "Vitória Backend" }));

    expect(
      await screen.findByText("Não foi possível salvar a partida."),
    ).toBeInTheDocument();
    expect(backendNote).toHaveValue("quase uma humilhação");
  });

  it("limits each note field to 140 characters and keeps the counters independent", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
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

    await screen.findByRole("button", { name: "Vitória Frontend" });

    const frontendCard = screen
      .getByRole("button", { name: "Vitória Frontend" })
      .closest("[data-team='frontend']");
    const backendCard = screen
      .getByRole("button", { name: "Vitória Backend" })
      .closest("[data-team='backend']");

    expect(frontendCard).not.toBeNull();
    expect(backendCard).not.toBeNull();

    const frontendNote = within(frontendCard as HTMLElement).getByLabelText(
      "Provocação opcional",
    );
    const backendNote = within(backendCard as HTMLElement).getByLabelText(
      "Provocação opcional",
    );

    await userEvent.type(frontendNote, "x".repeat(141));
    await userEvent.type(backendNote, "boa");

    expect(frontendNote).toHaveValue("x".repeat(140));
    expect(frontendNote).toHaveAttribute("maxLength", "140");
    expect(backendNote).toHaveValue("boa");
    expect(within(frontendCard as HTMLElement).getByText("140/140")).toBeInTheDocument();
    expect(within(backendCard as HTMLElement).getByText("3/140")).toBeInTheDocument();
  });
});
