import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePage } from "@/components/profile/profile-page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const MOCK_PROFILE = {
  id: "user-1",
  username: "gui.dev",
  email: "gui@office8ball.dev",
  displayName: "Guilherme",
  createdAt: "2025-01-01T00:00:00.000Z",
};

const MOCK_MATCHES = {
  matches: [
    {
      id: "m1",
      teamAId: "frontend",
      teamBId: "backend",
      winnerTeamId: "frontend",
      loserTeamId: "backend",
      playedAt: "2026-03-01T10:00:00.000Z",
      note: null,
    },
  ],
};

function mockFetchResponses(
  profileRes: { ok: boolean; status?: number; data?: unknown },
  matchesRes: { ok: boolean; status?: number; data?: unknown },
) {
  mockFetch.mockImplementation((url: string) => {
    if (url === "/api/profile") {
      return Promise.resolve({
        ok: profileRes.ok,
        status: profileRes.status ?? (profileRes.ok ? 200 : 500),
        json: async () => profileRes.data,
      });
    }
    if (url === "/api/matches") {
      return Promise.resolve({
        ok: matchesRes.ok,
        status: matchesRes.status ?? (matchesRes.ok ? 200 : 500),
        json: async () => matchesRes.data,
      });
    }
    return Promise.reject(new Error("Unknown URL"));
  });
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hero with profile data", async () => {
    mockFetchResponses(
      { ok: true, data: MOCK_PROFILE },
      { ok: true, data: MOCK_MATCHES },
    );
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByText("Guilherme")).toBeInTheDocument();
      expect(screen.getByText("@gui.dev")).toBeInTheDocument();
    });
  });

  it("shows error callout when profile fetch fails", async () => {
    mockFetchResponses(
      { ok: false, status: 503 },
      { ok: true, data: MOCK_MATCHES },
    );
    render(<ProfilePage />);
    await waitFor(() => {
      expect(
        screen.getByText(/perfil indisponível/i),
      ).toBeInTheDocument();
    });
  });

  it("shows match error callout when matches fetch fails", async () => {
    mockFetchResponses(
      { ok: true, data: MOCK_PROFILE },
      { ok: false, status: 401 },
    );
    render(<ProfilePage />);
    await waitFor(() => {
      expect(
        screen.getByText(/não foi possível carregar as partidas/i),
      ).toBeInTheDocument();
    });
  });

  it("renders share button that changes to Copiado! on click", async () => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    mockFetchResponses(
      { ok: true, data: MOCK_PROFILE },
      { ok: true, data: MOCK_MATCHES },
    );
    render(<ProfilePage />);
    await waitFor(() => screen.getByText("Compartilhar"));

    fireEvent.click(screen.getByText("Compartilhar"));
    expect(screen.getByText("Copiado!")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2001); });
    expect(screen.getByText("Compartilhar")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("displays up to 5 recent matches", async () => {
    const manyMatches = Array.from({ length: 7 }, (_, i) => ({
      id: `m${i}`,
      teamAId: "frontend",
      teamBId: "backend",
      winnerTeamId: "frontend",
      loserTeamId: "backend",
      playedAt: "2026-03-01T10:00:00.000Z",
      note: null,
    }));
    mockFetchResponses(
      { ok: true, data: MOCK_PROFILE },
      { ok: true, data: { matches: manyMatches } },
    );
    render(<ProfilePage />);
    await waitFor(() => {
      const items = screen.getAllByText("frontend");
      expect(items.length).toBeLessThanOrEqual(5);
    });
  });
});
