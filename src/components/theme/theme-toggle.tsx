"use client";

import type { AriaRole } from "react";
import { Moon, Sun } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useTheme } from "./theme-provider";

type ThemeToggleProps = {
  className?: string;
  layout?: "default" | "menu";
  variant?: ButtonProps["variant"];
  role?: AriaRole;
};

export function ThemeToggle({
  className,
  layout = "default",
  variant = "ghost",
  role,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant={variant}
      size="sm"
      className={cn(layout === "menu" ? "w-full justify-between" : undefined, className)}
      onClick={toggleTheme}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      role={role}
    >
      {layout === "menu" ? (
        <>
          <span className="flex items-center gap-3">
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            Tema
          </span>
          <span className="text-xs font-medium text-sidebar-accent">
            {isDark ? "Claro" : "Escuro"}
          </span>
        </>
      ) : (
        <>
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {isDark ? "Claro" : "Escuro"}
        </>
      )}
    </Button>
  );
}
