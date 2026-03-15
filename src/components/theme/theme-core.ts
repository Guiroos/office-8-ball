export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const DEFAULT_THEME_MODE: ThemeMode = "system";

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function readStoredTheme(value: string | null): ThemeMode {
  return isThemeMode(value) ? value : DEFAULT_THEME_MODE;
}

export function resolveTheme(
  theme: ThemeMode,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return theme === "system" ? systemTheme : theme;
}

export function resolveStoredTheme(
  storedTheme: string | null,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return resolveTheme(readStoredTheme(storedTheme), systemTheme);
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getThemeScript(storageKey: string) {
  return `
(() => {
  const storageKey = ${JSON.stringify(storageKey)};
  const storedTheme = localStorage.getItem(storageKey);
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const nextTheme =
    storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
      ? storedTheme
      : "system";
  const resolvedTheme = nextTheme === "system" ? systemTheme : nextTheme;
  const root = document.documentElement;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
})();
`;
}
