import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/theme/theme-provider";

import "./globals.css";

const THEME_STORAGE_KEY = "office-8-ball-theme";
const THEME_SCRIPT = `
(() => {
  const storageKey = "${THEME_STORAGE_KEY}";
  const root = document.documentElement;
  const storedTheme = localStorage.getItem(storageKey);
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const nextTheme =
    storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
      ? storedTheme
      : "system";
  const resolvedTheme = nextTheme === "system" ? (systemPrefersDark ? "dark" : "light") : nextTheme;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
})();
`;

export const metadata: Metadata = {
  title: "Office 8 Ball",
  description: "Internal office pool scoreboard for Frontend vs Backend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider storageKey={THEME_STORAGE_KEY}>
          {children}
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
