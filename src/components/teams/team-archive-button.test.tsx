"use client";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { TeamArchiveButton } from "@/components/teams/team-archive-button";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("TeamArchiveButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("shows confirmation actions after clicking 'Excluir Time'", async () => {
    render(<TeamArchiveButton teamId="team-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir Time" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Confirmar Exclusão" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });
  });

  it("calls archive API and navigates back to /times on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ team: { id: "team-1", status: "archived" } }),
    });

    render(<TeamArchiveButton teamId="team-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir Time" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Exclusão" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/teams/team-1/archive", {
        method: "PATCH",
      });
      expect(toast.success).toHaveBeenCalledWith("Time excluído com sucesso.");
      expect(mockPush).toHaveBeenCalledWith("/times");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows mapped error message for 403 responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    });

    render(<TeamArchiveButton teamId="team-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir Time" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Exclusão" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Você não pode excluir este time.");
    });
  });
});
