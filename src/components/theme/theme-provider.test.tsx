import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "@/components/theme/theme-provider";

const STORAGE_KEY = "office-8-ball-theme-test";

type MatchMediaController = {
  dispatchChange: (matches: boolean) => void;
  getAddEventListenerCalls: () => number;
  getRemoveEventListenerCalls: () => number;
};

function createMatchMediaController(initialMatches = false): MatchMediaController {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let addEventListenerCalls = 0;
  let removeEventListenerCalls = 0;

  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      matches,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: (
        eventName: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        if (eventName === "change") {
          addEventListenerCalls += 1;
          listeners.add(listener);
        }
      },
      removeEventListener: (
        eventName: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        if (eventName === "change") {
          removeEventListenerCalls += 1;
          listeners.delete(listener);
        }
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );

  return {
    dispatchChange(nextMatches) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
    getAddEventListenerCalls() {
      return addEventListenerCalls;
    },
    getRemoveEventListenerCalls() {
      return removeEventListenerCalls;
    },
  };
}

function ThemeConsumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <p data-testid="theme">{theme}</p>
      <p data-testid="resolved-theme">{resolvedTheme}</p>
      <button type="button" onClick={() => setTheme("light")}>
        set light
      </button>
      <button type="button" onClick={() => setTheme("dark")}>
        set dark
      </button>
      <button type="button" onClick={() => setTheme("system")}>
        set system
      </button>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  );
}

function renderWithThemeProvider() {
  return render(
    <ThemeProvider storageKey={STORAGE_KEY}>
      <ThemeConsumer />
    </ThemeProvider>,
  );
}

function ThemeConsumerWithoutProvider() {
  useTheme();
  return null;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
});

describe("ThemeProvider", () => {
  it("throws when useTheme is consumed outside the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ThemeConsumerWithoutProvider />)).toThrow(
      "useTheme must be used within a ThemeProvider.",
    );

    consoleError.mockRestore();
  });

  it("starts in system mode and resolves from the system preference", () => {
    createMatchMediaController(true);

    renderWithThemeProvider();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("uses a valid stored theme on initial render", () => {
    localStorage.setItem(STORAGE_KEY, "light");
    createMatchMediaController(true);

    renderWithThemeProvider();

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("falls back to system when the stored theme is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "sepia");
    createMatchMediaController(false);

    renderWithThemeProvider();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
  });

  it("persists explicit theme changes and removes storage when returning to system", async () => {
    createMatchMediaController(false);
    const user = userEvent.setup();

    renderWithThemeProvider();

    await user.click(screen.getByRole("button", { name: "set dark" }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");

    await user.click(screen.getByRole("button", { name: "set light" }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");

    await user.click(screen.getByRole("button", { name: "set system" }));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
  });

  it("toggles from the resolved theme and persists the next explicit theme", async () => {
    createMatchMediaController(true);
    const user = userEvent.setup();

    renderWithThemeProvider();

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("reacts to storage events for the same key and ignores unrelated keys", async () => {
    createMatchMediaController(false);

    renderWithThemeProvider();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "other-key",
        newValue: "dark",
      }),
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: "dark",
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("treats invalid storage event values as system mode", async () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    createMatchMediaController(false);

    renderWithThemeProvider();

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: "invalid",
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("system");
    });
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("reacts to system theme changes when the theme mode is system", async () => {
    const matchMedia = createMatchMediaController(false);

    renderWithThemeProvider();

    matchMedia.dispatchChange(true);

    await waitFor(() => {
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("keeps explicit theme selection even if the system preference changes", async () => {
    localStorage.setItem(STORAGE_KEY, "light");
    const matchMedia = createMatchMediaController(false);

    renderWithThemeProvider();

    matchMedia.dispatchChange(true);

    await waitFor(() => {
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("registers and cleans up theme listeners on mount and unmount", () => {
    const matchMedia = createMatchMediaController(false);
    const addWindowListenerSpy = vi.spyOn(window, "addEventListener");
    const removeWindowListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderWithThemeProvider();

    expect(matchMedia.getAddEventListenerCalls()).toBe(1);
    expect(addWindowListenerSpy).toHaveBeenCalledWith("storage", expect.any(Function));

    unmount();

    expect(matchMedia.getRemoveEventListenerCalls()).toBe(1);
    expect(removeWindowListenerSpy).toHaveBeenCalledWith("storage", expect.any(Function));
  });
});
