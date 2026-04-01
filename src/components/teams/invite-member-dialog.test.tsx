"use client";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { InviteMemberDialog } from "@/components/teams/invite-member-dialog";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockRouterRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultProps = {
  teamId: "team-1",
};

describe("InviteMemberDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders the invite button", () => {
    render(<InviteMemberDialog {...defaultProps} />);
    expect(screen.getByRole("button", { name: /convidar membro/i })).toBeInTheDocument();
  });

  it("opens dialog when button is clicked", async () => {
    render(<InviteMemberDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /convidar membro/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    });
  });

  it("shows inline error when submitting empty username", async () => {
    render(<InviteMemberDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /convidar membro/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /^convidar$/i }));
    await waitFor(() => {
      expect(screen.getByText("Informe um username.")).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("normalizes @username prefix before lookup", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "user-xyz", username: "jean.dev", displayName: "Jean", avatarUrl: null } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ team: { id: "team-1" } }),
      });

    render(<InviteMemberDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /convidar membro/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "@jean.dev" } });
    fireEvent.click(screen.getByRole("button", { name: /^convidar$/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("username=jean.dev"),
        expect.any(Object),
      );
    });
  });

  it("shows inline error for invalid username format", async () => {
    render(<InviteMemberDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /convidar membro/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "aa" } });
    fireEvent.click(screen.getByRole("button", { name: /^convidar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Use de 3 a 24 caracteres/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows toast.success and calls router.refresh on successful invite", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "user-xyz", username: "jean.dev", displayName: "Jean", avatarUrl: null } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ team: { id: "team-1" } }),
      });

    render(<InviteMemberDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /convidar membro/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "jean.dev" } });
    fireEvent.click(screen.getByRole("button", { name: /^convidar$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Membro adicionado com sucesso.");
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it("shows 404 toast when user is not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Usuário não encontrado." }),
    });

    render(<InviteMemberDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /convidar membro/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "ghost" } });
    fireEvent.click(screen.getByRole("button", { name: /^convidar$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Usuário não encontrado.");
    });
  });

  it("shows 503 toast when service is unavailable", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    render(<InviteMemberDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /convidar membro/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "jean.dev" } });
    fireEvent.click(screen.getByRole("button", { name: /^convidar$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Serviço indisponível. Configure o banco para gerenciar membros.");
    });
  });

  it("shows 401 toast when not authenticated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    render(<InviteMemberDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /convidar membro/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "jean.dev" } });
    fireEvent.click(screen.getByRole("button", { name: /^convidar$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Faça login novamente para gerenciar membros.");
    });
  });

  it("shows 403 toast when forbidden", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    });

    render(<InviteMemberDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /convidar membro/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "jean.dev" } });
    fireEvent.click(screen.getByRole("button", { name: /^convidar$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Você não pode gerenciar membros deste time.");
    });
  });
});
