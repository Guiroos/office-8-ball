import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "@/components/theme/theme-toggle";

const useThemeMock = vi.fn();

vi.mock("@/components/theme/theme-provider", () => ({
  useTheme: () => useThemeMock(),
}));

describe("ThemeToggle", () => {
  it("shows the dark-mode action when the resolved theme is light", () => {
    const toggleTheme = vi.fn();
    useThemeMock.mockReturnValue({
      resolvedTheme: "light",
      toggleTheme,
    });

    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Mudar para tema escuro" })).toBeInTheDocument();
    expect(screen.getByTitle("Mudar para tema escuro")).toHaveTextContent("Escuro");
  });

  it("shows the light-mode action when the resolved theme is dark", () => {
    const toggleTheme = vi.fn();
    useThemeMock.mockReturnValue({
      resolvedTheme: "dark",
      toggleTheme,
    });

    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Mudar para tema claro" })).toBeInTheDocument();
    expect(screen.getByTitle("Mudar para tema claro")).toHaveTextContent("Claro");
  });

  it("calls toggleTheme on click and preserves custom className", async () => {
    const user = userEvent.setup();
    const toggleTheme = vi.fn();
    useThemeMock.mockReturnValue({
      resolvedTheme: "light",
      toggleTheme,
    });

    render(<ThemeToggle className="custom-toggle" />);

    const button = screen.getByRole("button", { name: "Mudar para tema escuro" });

    expect(button).toHaveClass("custom-toggle");

    await user.click(button);

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
