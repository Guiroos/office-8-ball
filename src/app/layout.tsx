import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
