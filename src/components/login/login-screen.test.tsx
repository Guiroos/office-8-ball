import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginScreen } from "@/components/login/login-screen";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const signInMock = vi.fn();

vi.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: ({ className }: { className?: string }) => (
    <button type="button" className={className}>
      Tema
    </button>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the real login state by default", () => {
    render(<LoginScreen authAvailable />);

    expect(
      screen.getByRole("heading", {
        name: "Entre para registrar a proxima vitoria.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Entrar" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeInTheDocument();
  });

  it("submits login credentials and redirects to the scoreboard", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ ok: true, error: undefined });

    render(<LoginScreen authAvailable />);

    await user.type(screen.getByLabelText("E-mail corporativo"), "gui@office8ball.dev");
    await user.type(screen.getByLabelText("Senha"), "secret123");
    await user.click(screen.getAllByRole("button", { name: "Entrar" })[1]);

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("credentials", {
        email: "gui@office8ball.dev",
        password: "secret123",
        redirect: false,
        callbackUrl: "/scoreboard",
      });
    });

    expect(pushMock).toHaveBeenCalledWith("/scoreboard");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows local validation after blur and clears it when the field is fixed", async () => {
    const user = userEvent.setup();

    render(<LoginScreen authAvailable />);

    const emailInput = screen.getByLabelText("E-mail corporativo");

    await user.click(emailInput);
    await user.tab();

    expect(screen.getByText("Informe um email valido.")).toBeInTheDocument();

    await user.type(emailInput, "gui@office8ball.dev");

    expect(screen.queryByText("Informe um email valido.")).not.toBeInTheDocument();
  });

  it("validates invalid login submit before calling signIn", async () => {
    const user = userEvent.setup();

    render(<LoginScreen authAvailable />);

    expect(screen.getAllByRole("button", { name: "Entrar" })[1]).toBeEnabled();
    await user.click(screen.getAllByRole("button", { name: "Entrar" })[1]);

    expect(screen.getByText("Informe um email valido.")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("submits registration, signs in, and redirects", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        user: {
          id: "user-1",
          username: "gui.dev",
          email: "gui@office8ball.dev",
        },
      }),
    } as Response);
    signInMock.mockResolvedValue({ ok: true, error: undefined });

    render(<LoginScreen authAvailable />);

    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await user.type(screen.getByLabelText("Username"), "gui.dev");
    await user.type(screen.getByLabelText("E-mail corporativo"), "gui@office8ball.dev");
    await user.type(screen.getByLabelText("Senha"), "secret123");
    await user.click(screen.getAllByRole("button", { name: "Criar conta" })[1]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "gui.dev",
          email: "gui@office8ball.dev",
          password: "secret123",
        }),
      });
    });

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "gui@office8ball.dev",
      password: "secret123",
      redirect: false,
      callbackUrl: "/scoreboard",
    });
    expect(pushMock).toHaveBeenCalledWith("/scoreboard");
    fetchMock.mockRestore();
  });

  it("shows a general error when registration succeeds but sign-in fails", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        user: {
          id: "user-1",
          username: "gui.dev",
          email: "gui@office8ball.dev",
        },
      }),
    } as Response);
    signInMock.mockResolvedValue({ ok: false, error: "CredentialsSignin" });

    render(<LoginScreen authAvailable />);

    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await user.type(screen.getByLabelText("Username"), "gui.dev");
    await user.type(screen.getByLabelText("E-mail corporativo"), "gui@office8ball.dev");
    await user.type(screen.getByLabelText("Senha"), "secret123");
    await user.click(screen.getAllByRole("button", { name: "Criar conta" })[1]);

    expect(
      await screen.findByText("Conta criada, mas nao foi possivel abrir a sessao."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    fetchMock.mockRestore();
  });

  it("validates invalid registration submit before calling the api", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<LoginScreen authAvailable />);

    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(screen.getAllByRole("button", { name: "Criar conta" })[1]).toBeEnabled();
    await user.click(screen.getAllByRole("button", { name: "Criar conta" })[1]);

    expect(
      screen.getByText(
        "Use de 3 a 24 caracteres com letras, numeros, ponto, tracinho ou underscore.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Informe um email valido.")).toBeInTheDocument();
    expect(screen.getByText("A senha precisa ter pelo menos 8 caracteres.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();

    fetchMock.mockRestore();
  });

  it("shows remote registration field errors from the api", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: "Ja existe uma conta com esses dados.",
        fieldErrors: {
          username: "Este username ja esta em uso.",
          email: "Este email ja esta em uso.",
        },
      }),
    } as Response);

    render(<LoginScreen authAvailable />);

    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await user.type(screen.getByLabelText("Username"), "gui.dev");
    await user.type(screen.getByLabelText("E-mail corporativo"), "gui@office8ball.dev");
    await user.type(screen.getByLabelText("Senha"), "secret123");
    await user.click(screen.getAllByRole("button", { name: "Criar conta" })[1]);

    expect(await screen.findByText("Este username ja esta em uso.")).toBeInTheDocument();
    expect(screen.getByText("Este email ja esta em uso.")).toBeInTheDocument();
    expect(screen.getByText("Ja existe uma conta com esses dados.")).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();

    fetchMock.mockRestore();
  });

  it("clears remote registration field errors when the user edits the field again", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: "Ja existe uma conta com esses dados.",
        fieldErrors: {
          username: "Este username ja esta em uso.",
        },
      }),
    } as Response);

    render(<LoginScreen authAvailable />);

    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await user.type(screen.getByLabelText("Username"), "gui.dev");
    await user.type(screen.getByLabelText("E-mail corporativo"), "gui@office8ball.dev");
    await user.type(screen.getByLabelText("Senha"), "secret123");
    await user.click(screen.getAllByRole("button", { name: "Criar conta" })[1]);

    expect(await screen.findByText("Este username ja esta em uso.")).toBeInTheDocument();

    const usernameInput = screen.getByLabelText("Username");
    await user.type(usernameInput, "2");

    expect(screen.queryByText("Este username ja esta em uso.")).not.toBeInTheDocument();

    fetchMock.mockRestore();
  });

  it("shows a generic wait message when login is rate limited", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ ok: false, error: "AuthRateLimited" });

    render(<LoginScreen authAvailable />);

    await user.type(screen.getByLabelText("E-mail corporativo"), "gui@office8ball.dev");
    await user.type(screen.getByLabelText("Senha"), "secret123");
    await user.click(screen.getAllByRole("button", { name: "Entrar" })[1]);

    expect(
      await screen.findByText("Muitas tentativas seguidas. Aguarde um pouco antes de tentar novamente."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("resets validation and remote errors when switching between login and registration", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: "Ja existe uma conta com esses dados.",
        fieldErrors: {
          username: "Este username ja esta em uso.",
        },
      }),
    } as Response);

    render(<LoginScreen authAvailable />);

    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await user.click(screen.getAllByRole("button", { name: "Criar conta" })[1]);
    expect(
      screen.getByText(
        "Use de 3 a 24 caracteres com letras, numeros, ponto, tracinho ou underscore.",
      ),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Username"), "gui.dev");
    await user.type(screen.getByLabelText("E-mail corporativo"), "gui@office8ball.dev");
    await user.type(screen.getByLabelText("Senha"), "secret123");
    await user.click(screen.getAllByRole("button", { name: "Criar conta" })[1]);

    expect(await screen.findByText("Este username ja esta em uso.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      screen.queryByText("Use de 3 a 24 caracteres com letras, numeros, ponto, tracinho ou underscore."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Este username ja esta em uso.")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Username")).not.toBeInTheDocument();

    fetchMock.mockRestore();
  });

  it("keeps auth disabled when DATABASE_URL is unavailable", () => {
    render(<LoginScreen authAvailable={false} />);

    expect(screen.getAllByRole("button", { name: "Entrar" })[1]).toBeDisabled();
    expect(screen.getByText("Autenticacao indisponivel sem DATABASE_URL configurado.")).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("shows the auth config reason when the secret is missing", () => {
    render(
      <LoginScreen
        authAvailable={false}
        authUnavailableReason="Configuracao de autenticacao invalida: defina NEXTAUTH_SECRET para usar o login."
      />,
    );

    expect(
      screen.getByText(
        "Configuracao de autenticacao invalida: defina NEXTAUTH_SECRET para usar o login.",
      ),
    ).toBeInTheDocument();
  });
});
