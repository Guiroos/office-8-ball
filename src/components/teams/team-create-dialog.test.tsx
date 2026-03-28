import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeamCreateDialog } from "@/components/teams/team-create-dialog";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockRefresh = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("TeamCreateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("opens the dialog from the trigger", async () => {
    render(
      <TeamCreateDialog>
        <button type="button">Criar Novo Time</button>
      </TeamCreateDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Criar Novo Time" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Criar Novo Time" })).toBeInTheDocument();
    });
  });

  it("closes the dialog after successful creation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        team: {
          id: "team-1",
          name: "solo wolves",
          type: "solo",
          status: "active",
          createdBy: "user-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          members: [],
        },
      }),
    });

    render(
      <TeamCreateDialog>
        <button type="button">Abrir modal</button>
      </TeamCreateDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir modal" }));
    fireEvent.change(screen.getByTestId("team-create-name"), {
      target: { value: "Solo Wolves" },
    });
    fireEvent.click(screen.getByTestId("team-create-submit"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith("/times/team-1");
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
