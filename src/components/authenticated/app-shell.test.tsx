import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/authenticated/app-shell";

const signOutMock = vi.fn();
const usePathnameMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: React.ComponentProps<"a"> & {
    href: string;
    onClick?: () => void;
  }) => (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Wave 0: @/lib/auth-client mock ready for Wave 3 (app-shell.tsx migration)
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: (...args: unknown[]) => signOutMock(...args),
  },
}));

// Wave 0 compat: keep next-auth/react mock until app-shell.tsx is migrated in Wave 3
vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

vi.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: ({
    className,
    variant,
  }: {
    className?: string;
    variant?: string;
  }) => (
    <button type="button" className={className} data-variant={variant}>
      Tema
    </button>
  ),
}));

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/dashboard");
  });

  it("renders the shared navigation and highlights the active page", () => {
    render(
      <AppShell
        user={{
          id: "user-1",
          username: "gui.dev",
          displayName: "Gui Dev",
          avatarUrl: null,
        }}
      >
        <div>Conteudo interno</div>
      </AppShell>,
    );

    expect(screen.getByText("Conteudo interno")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Dashboard" })
        .some((link) => link.getAttribute("aria-current") === "page"),
    ).toBe(true);
    expect(screen.getByRole("navigation", { name: "Navegacao principal" })).toHaveClass(
      "text-sidebar-foreground",
    );
    expect(screen.getAllByRole("link", { name: "Times" })[0]).toHaveAttribute("href", "/times");
    expect(screen.getByText("Gui Dev")).toBeInTheDocument();
  });

  it("opens the account menu and signs out from there", async () => {
    const user = userEvent.setup();
    usePathnameMock.mockReturnValue("/profile");

    render(
      <AppShell
        user={{
          id: "user-1",
          username: "gui.dev",
          displayName: "Gui Dev",
          avatarUrl: "https://example.com/avatar.png",
        }}
      >
        <div>Conteudo interno</div>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: /Gui Dev/i }));

    expect(screen.getByRole("menuitem", { name: "Ver perfil" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByText("@gui.dev")).toBeInTheDocument();
    expect(screen.getByAltText("Gui Dev")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tema" })).toHaveAttribute("data-variant", "sidebar");
    expect(screen.getByRole("menu", { name: "Menu da conta" })).toHaveClass(
      "text-sidebar-foreground",
    );
    expect(screen.getByRole("button", { name: "Sair" })).toHaveClass(
      "text-sidebar-foreground",
    );
    expect(screen.queryByText("Configuracoes")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it("uses client navigation when a different sidebar route is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AppShell
        user={{
          id: "user-1",
          username: "gui.dev",
          displayName: "Gui Dev",
          avatarUrl: null,
        }}
      >
        <div>Conteudo interno</div>
      </AppShell>,
    );

    await user.click(screen.getAllByRole("link", { name: "Times" })[0]);

    expect(pushMock).toHaveBeenCalledWith("/times");
  });
});
