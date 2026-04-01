"use client";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { MemberList } from "@/components/teams/member-list";

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

const creatorId = "user-abc";
const memberId = "user-xyz";

const members = [
  {
    userId: creatorId,
    username: "gui.dev",
    displayName: "Guilherme",
    role: "Criador" as const,
  },
  {
    userId: memberId,
    username: "jean.dev",
    displayName: "Jean",
    role: "Membro" as const,
  },
];

const defaultProps = {
  members,
  teamId: "team-1",
  teamType: "duo" as const,
  createdBy: creatorId,
  viewerId: creatorId,
};

describe("MemberList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders all members", () => {
    render(<MemberList {...defaultProps} />);
    expect(screen.getByText("Guilherme")).toBeInTheDocument();
    expect(screen.getByText("Jean")).toBeInTheDocument();
  });

  it("shows empty state when no members", () => {
    render(<MemberList {...defaultProps} members={[]} />);
    expect(screen.getByText("Nenhum membro")).toBeInTheDocument();
  });

  it("does not show Remover for the team creator", () => {
    render(<MemberList {...defaultProps} />);
    // Creator row should not have Remover button
    const guiRow = screen.getByText("Guilherme").closest("li");
    expect(guiRow?.querySelector("button")).toBeNull();
  });

  it("shows Remover button for non-creator members when duo team has > 2 members", () => {
    const moreMembers = [
      ...members,
      { userId: "user-zzz", username: "ana.dev", displayName: "Ana", role: "Membro" as const },
    ];
    render(<MemberList {...defaultProps} members={moreMembers} teamType="duo" />);
    expect(screen.getAllByRole("button", { name: /remover/i }).length).toBeGreaterThan(0);
  });

  it("does not show Remover when duo team has exactly 2 members", () => {
    render(<MemberList {...defaultProps} teamType="duo" />);
    expect(screen.queryByRole("button", { name: /remover/i })).toBeNull();
    expect(
      screen.getByText("Times de duplas precisam manter pelo menos 2 membros. Convide outro membro antes de remover."),
    ).toBeInTheDocument();
  });

  it("shows Remover button for solo team with > 1 member", () => {
    render(<MemberList {...defaultProps} teamType="solo" />);
    // solo team with 2 members (> 1), non-creator should be removable
    expect(screen.getAllByRole("button", { name: /remover/i }).length).toBeGreaterThan(0);
  });

  it("shows inline Confirmar / Cancelar when Remover is clicked", async () => {
    render(<MemberList {...defaultProps} teamType="solo" />);
    const removeButton = screen.getByRole("button", { name: /remover/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /confirmar/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  it("returns to normal state when Cancelar is clicked without making a request", async () => {
    render(<MemberList {...defaultProps} teamType="solo" />);
    fireEvent.click(screen.getByRole("button", { name: /remover/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /confirmar/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /cancelar/i })).toBeNull();
      expect(screen.getByRole("button", { name: /remover/i })).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls DELETE and shows toast.success on Confirmar", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ team: { id: "team-1" } }),
    });

    render(<MemberList {...defaultProps} teamType="solo" />);
    fireEvent.click(screen.getByRole("button", { name: /remover/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /confirmar/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/teams/team-1/members/${memberId}`),
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(toast.success).toHaveBeenCalledWith("Membro removido com sucesso.");
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it("shows 401 toast on DELETE 401 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    render(<MemberList {...defaultProps} teamType="solo" />);
    fireEvent.click(screen.getByRole("button", { name: /remover/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /confirmar/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Faça login novamente para gerenciar membros.");
    });
  });
});
