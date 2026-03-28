import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { TeamCreateForm } from "@/components/teams/team-create-form";

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

describe("TeamCreateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits valid payload to /api/teams with method POST and body { name, type: 'solo' }", async () => {
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

    render(<TeamCreateForm />);

    const input = screen.getByTestId("team-create-name");
    fireEvent.change(input, { target: { value: "Solo Wolves" } });
    fireEvent.click(screen.getByTestId("team-create-submit"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/teams",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "solo wolves", type: "solo" }),
        }),
      );
    });
  });

  it("shows success toast and redirects to the created team on 201 response", async () => {
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

    render(<TeamCreateForm />);

    const input = screen.getByTestId("team-create-name");
    fireEvent.change(input, { target: { value: "solo wolves" } });
    fireEvent.click(screen.getByTestId("team-create-submit"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Time criado com sucesso.");
      expect(mockPush).toHaveBeenCalledWith("/times/team-1");
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  it("submits duo creation without second member when modalidade is Duplas", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        team: {
          id: "team-2",
          name: "duo wolves",
          type: "duo",
          status: "active",
          createdBy: "user-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          members: [{ userId: "user-1", joinedAt: "2026-01-01T00:00:00.000Z" }],
        },
      }),
    });

    render(<TeamCreateForm />);

    fireEvent.change(screen.getByTestId("team-create-name"), {
      target: { value: "Duo Wolves" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Duplas" }));
    fireEvent.click(screen.getByTestId("team-create-submit"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/teams",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "duo wolves", type: "duo" }),
        }),
      );
    });
  });

  it("shows error message from payload on 400 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Já existe um time com esse nome." }),
    });

    render(<TeamCreateForm />);

    const input = screen.getByTestId("team-create-name");
    fireEvent.change(input, { target: { value: "Solo Wolves" } });
    fireEvent.click(screen.getByTestId("team-create-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Já existe um time com esse nome.");
    });
  });

  it("shows fixed auth error message on 401 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    render(<TeamCreateForm />);

    const input = screen.getByTestId("team-create-name");
    fireEvent.change(input, { target: { value: "Solo Wolves" } });
    fireEvent.click(screen.getByTestId("team-create-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Faça login novamente para criar times.",
      );
    });
  });

  it("shows fixed service unavailable message on 503 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    render(<TeamCreateForm />);

    const input = screen.getByTestId("team-create-name");
    fireEvent.change(input, { target: { value: "Solo Wolves" } });
    fireEvent.click(screen.getByTestId("team-create-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Serviço indisponível. Configure o banco para criar times.",
      );
    });
  });
});
