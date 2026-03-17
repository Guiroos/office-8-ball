"use client";

import { Moon, Sun } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

import { useTheme } from "./theme-provider";

type ThemeToggleProps = {
  className?: string;
  variant?: ButtonProps["variant"];
};

export function ThemeToggle({ className, variant = "ghost" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant={variant}
      size="sm"
      className={className}
      onClick={toggleTheme}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {isDark ? "Claro" : "Escuro"}
    </Button>
  );
}
