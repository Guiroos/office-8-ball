import { describe, expect, it } from "vitest";

import {
  getThemeScript,
  readStoredTheme,
  resolveStoredTheme,
} from "@/components/theme/theme-core";

function setSystemPreference(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({
      matches,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe("theme-core", () => {
  it("normalizes invalid stored values to system mode", () => {
    expect(readStoredTheme("dark")).toBe("dark");
    expect(readStoredTheme("invalid")).toBe("system");
    expect(readStoredTheme(null)).toBe("system");
  });

  it("resolves stored theme with system fallback", () => {
    expect(resolveStoredTheme("light", "dark")).toBe("light");
    expect(resolveStoredTheme("system", "dark")).toBe("dark");
    expect(resolveStoredTheme("invalid", "light")).toBe("light");
  });

  it("bootstraps the stored dark theme from the inline script", () => {
    const storageKey = "office-8-ball-theme-test-script";
    localStorage.setItem(storageKey, "dark");
    setSystemPreference(false);

    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";

    new Function(getThemeScript(storageKey))();

    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("falls back to system preference when the stored value is invalid", () => {
    const storageKey = "office-8-ball-theme-test-script";
    localStorage.setItem(storageKey, "sepia");
    setSystemPreference(true);

    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";

    new Function(getThemeScript(storageKey))();

    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});
