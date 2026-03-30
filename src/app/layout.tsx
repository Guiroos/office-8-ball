import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { getThemeScript } from "@/components/theme/theme-core";
import { ThemeProvider } from "@/components/theme/theme-provider";

import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";

const THEME_STORAGE_KEY = "office-8-ball-theme";

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
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans", GeistSans.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeScript(THEME_STORAGE_KEY) }} />
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
