import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { Dashboard } from "@/components/dashboard";
import type {
  CreateMatchResponse,
  MatchesResponse,
  ScoreboardResponse,
  TeamsResponse,
} from "@/lib/types";

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const initialTeams: TeamsResponse = {
  teams: [
    {
      id: "frontend",
      name: "Frontend",
      type: "duo",
      status: "active",
      createdBy: "user-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      members: [{ userId: "user-1", joinedAt: "2026-01-01T00:00:00.000Z" }],
    },
    {
      id: "backend",
      name: "Backend",
      type: "duo",
      status: "active",
      createdBy: "user-2",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      members: [{ userId: "user-2", joinedAt: "2026-01-01T00:00:00.000Z" }],
    },
  ],
};

const initialScoreboard: ScoreboardResponse = {
  scoreboard: {
    teams: [
      { id: "frontend", wins: 0, losses: 0 },
      { id: "backend", wins: 0, losses: 0 },
    ],
    leaderTeamId: null,
    leadBy: 0,
    totalMatches: 0,
  },
};

const updatedScoreboard: ScoreboardResponse = {
  scoreboard: {
    teams: [
      { id: "frontend", wins: 1, losses: 0 },
      { id: "backend", wins: 0, losses: 1 },
    ],
    leaderTeamId: "frontend",
    leadBy: 1,
    totalMatches: 1,
  },
};

const emptyMatches: MatchesResponse = { matches: [] };

const updatedMatches: MatchesResponse = {
  matches: [
    {
      id: "match-1",
      teamAId: "frontend",
      teamBId: "backend",
      winnerTeamId: "frontend",
      loserTeamId: "backend",
      playedAt: "2026-03-12T10:00:00.000Z",
      note: null,
    },
  ],
};

const createMatchResponse: CreateMatchResponse = {
  match: updatedMatches.matches[0],
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
    vi.clearAllMocks();
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

        if (url === "/api/teams") {
          return jsonResponse(initialTeams) as ReturnType<typeof fetch>;
        }

        throw new Error(`Unexpected fetch to ${url}`);
      });

    render(<Dashboard />);

    expect(
      screen.getByText("Carregando o tribunal da sinuca..."),
    ).toBeInTheDocument();

    expect(await screen.findByText("Nenhuma partida registrada ainda.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frontend vs Backend" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("shows an error state when the initial load fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(<Dashboard />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Não foi possível carregar o placar.");
    });
  });

  it("posts a win, reloads data and displays the returned message", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((input, init) => {
        const url = String(input);

        if (url === "/api/teams") {
          return jsonResponse(initialTeams) as ReturnType<typeof fetch>;
        }

        if (url === "/api/scoreboard") {
          return (fetchMock.mock.calls.filter((c) => String(c[0]) === "/api/scoreboard").length <= 1
            ? jsonResponse(initialScoreboard)
            : jsonResponse(updatedScoreboard)) as ReturnType<typeof fetch>;
        }

        if (url === "/api/matches" && !init?.method) {
          return (fetchMock.mock.calls.filter((c) => String(c[0]) === "/api/matches" && !c[1]?.method).length <= 1
            ? jsonResponse(emptyMatches)
            : jsonResponse(updatedMatches)) as ReturnType<typeof fetch>;
        }

        if (url === "/api/matches" && init?.method === "POST") {
          expect(init.body).toBe(
            JSON.stringify({
              teamAId: "frontend",
              teamBId: "backend",
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
      expect(toast.promise).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.objectContaining({
          loading: "Registrando partida...",
          success: expect.any(Function),
          error: expect.any(Function),
        }),
      );
    });

    expect(frontendCard).toHaveAttribute("data-leader", "true");
    expect(frontendCard).toHaveClass("bg-team-alpha-soft");
    expect(frontendCard).toHaveClass("ring-gold");
    expect(frontendCard).not.toHaveAttribute("style");
    expect(backendCard).toHaveAttribute("data-leader", "false");
    expect(backendCard).toHaveClass("bg-team-beta-soft");
    expect(backendCard).not.toHaveAttribute("style");

    expect(await screen.findByText("frontend lidera por 1.")).toBeInTheDocument();
    expect(screen.queryByText("Nenhuma partida registrada ainda.")).not.toBeInTheDocument();
    expect(frontendNote).toHaveValue("");
    expect(backendNote).toHaveValue("fica para a próxima");
  });

  it("preserves the note when saving fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input);

      if (url === "/api/teams") {
        return jsonResponse(initialTeams) as ReturnType<typeof fetch>;
      }

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

    await waitFor(() => {
      expect(toast.promise).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.objectContaining({
          loading: "Registrando partida...",
          error: expect.any(Function),
        }),
      );
    });
    expect(backendNote).toHaveValue("quase uma humilhação");
  });

  it("limits each note field to 140 characters and keeps the counters independent", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);

      if (url === "/api/teams") {
        return jsonResponse(initialTeams) as ReturnType<typeof fetch>;
      }

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
