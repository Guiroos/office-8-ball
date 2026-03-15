"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyResolvedTheme,
  getSystemTheme,
  readStoredTheme,
  resolveTheme,
  type ResolvedTheme,
  type ThemeMode,
} from "./theme-core";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(storageKey: string): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  return readStoredTheme(localStorage.getItem(storageKey));
}

export function ThemeProvider({
  children,
  storageKey,
}: {
  children: ReactNode;
  storageKey: string;
}) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme(storageKey));
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) {
        return;
      }

      setThemeState(readStoredTheme(event.newValue));
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [storageKey]);

  const resolvedTheme = resolveTheme(theme, systemTheme);

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);

        if (nextTheme === "system") {
          localStorage.removeItem(storageKey);
          return;
        }

        localStorage.setItem(storageKey, nextTheme);
      },
      toggleTheme: () => {
        const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
        setThemeState(nextTheme);
        localStorage.setItem(storageKey, nextTheme);
      },
    }),
    [resolvedTheme, storageKey, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return context;
}
