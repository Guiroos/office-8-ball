import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultProfile = {
  displayName: "Guilherme",
  email: "gui@office8ball.dev",
  avatarUrl: null,
  bio: null,
};

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  profile: defaultProfile,
  onSave: vi.fn(),
};

describe("ProfileEditDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog with current displayName", () => {
    render(<ProfileEditDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText("Como quer ser chamado?");
    expect(input).toHaveValue("Guilherme");
  });

  it("renders the dialog with current email", () => {
    render(<ProfileEditDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText("gui@office8ball.dev");
    expect(input).toHaveValue("gui@office8ball.dev");
  });

  it("shows validation error when displayName is too short", async () => {
    render(
      <ProfileEditDialog
        {...defaultProps}
        profile={{ ...defaultProfile, displayName: "" }}
      />,
    );
    const input = screen.getByPlaceholderText("Como quer ser chamado?");
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => {
      expect(screen.getByText(/mínimo 2 caracteres/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("blocks submission when email is invalid", async () => {
    render(
      <ProfileEditDialog
        {...defaultProps}
        profile={{ ...defaultProfile, email: "invalido" }}
      />,
    );
    // Fire submit on the form directly to bypass jsdom HTML5 constraint validation
    // so our Zod validation runs (type="email" would otherwise block the submit event)
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/informe um email/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows validation error when avatarUrl is invalid", async () => {
    render(<ProfileEditDialog {...defaultProps} />);
    const avatarInput = screen.getByPlaceholderText("https://gravatar.com/avatar/...");
    fireEvent.change(avatarInput, { target: { value: "not-a-url" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => {
      expect(screen.getByText(/url inválida/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls onSave and closes on successful save", async () => {
    const updatedProfile = {
      id: "user-1",
      username: "gui.dev",
      email: "gui@office8ball.dev",
      displayName: "Novo Nome",
      avatarUrl: null,
      bio: null,
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedProfile,
    });

    const onSave = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ProfileEditDialog
        {...defaultProps}
        onSave={onSave}
        onOpenChange={onOpenChange}
      />,
    );

    const input = screen.getByPlaceholderText("Como quer ser chamado?");
    fireEvent.change(input, { target: { value: "Novo Nome" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(updatedProfile);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(toast.success).toHaveBeenCalledWith("Perfil atualizado.");
    });
  });

  it("sends null for empty optional fields", async () => {
    const updatedProfile = {
      id: "user-1",
      username: "gui.dev",
      email: null,
      displayName: null,
      avatarUrl: null,
      bio: null,
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedProfile,
    });

    render(
      <ProfileEditDialog
        {...defaultProps}
        profile={{ displayName: "", email: "", avatarUrl: "", bio: "" }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            displayName: null,
            email: null,
            avatarUrl: null,
            bio: null,
          }),
        }),
      );
    });
  });

  it("shows 503 error message when service is unavailable", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });

    render(<ProfileEditDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Serviço indisponível. Tente novamente mais tarde.",
      );
    });
    expect(screen.queryByText(/serviço indisponível/i)).not.toBeInTheDocument();
  });

  it("shows generic API error message for non-503 failures", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Erro customizado do servidor." }),
    });

    render(<ProfileEditDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro customizado do servidor.");
    });
    expect(screen.queryByText(/erro customizado/i)).not.toBeInTheDocument();
  });
});
