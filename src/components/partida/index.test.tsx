import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Partida } from "@/components/partida";
import type { TeamRecord } from "@/lib/types";

const usePartidaDataMock = vi.fn();

vi.mock("@/components/partida/use-partida-data", () => ({
  usePartidaData: () => usePartidaDataMock(),
}));

function createTeam(id: string, name: string): TeamRecord {
  return {
    id,
    name,
    type: "solo",
    status: "active",
    createdBy: "user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    members: [{ userId: "user-1", joinedAt: "2026-01-01T00:00:00.000Z" }],
  };
}

function makeHookState(overrides: Record<string, unknown> = {}) {
  return {
    myTeams: [],
    opponentTeams: [],
    isLoadingTeams: false,
    isRegistering: false,
    myTeamId: null,
    opponentId: null,
    winnerId: null,
    note: "",
    pairHistory: [],
    teamMap: {},
    setMyTeam: vi.fn(),
    setOpponent: vi.fn(),
    toggleWinner: vi.fn(),
    setNote: vi.fn(),
    registerMatch: vi.fn(),
    canRegister: false,
    ...overrides,
  };
}

describe("Partida", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not mark winner when no team is selected", () => {
    usePartidaDataMock.mockReturnValue(makeHookState());

    render(<Partida />);

    expect(screen.queryByText(/Vencedor confirmado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Vencedor$/i)).not.toBeInTheDocument();
  });

  it("marks only one side as winner when winnerId matches a selected team", () => {
    const myTeam = createTeam("team-a", "Time A");
    const opponent = createTeam("team-b", "Time B");

    usePartidaDataMock.mockReturnValue(
      makeHookState({
        myTeams: [myTeam],
        opponentTeams: [opponent],
        myTeamId: myTeam.id,
        opponentId: opponent.id,
        winnerId: myTeam.id,
        teamMap: {
          [myTeam.id]: myTeam.name,
          [opponent.id]: opponent.name,
        },
        canRegister: true,
      }),
    );

    render(<Partida />);

    expect(screen.getAllByText(/Vencedor confirmado/i)).toHaveLength(1);
    expect(screen.getAllByText(/^Vencedor$/i)).toHaveLength(1);
  });
});
