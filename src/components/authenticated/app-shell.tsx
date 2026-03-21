"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { type ComponentType, type ReactNode, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

type AppShellProps = {
  user: SessionUser;
  children: ReactNode;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/dashboard",
  },
  {
    href: "/times",
    label: "Times",
    icon: Users,
    match: (pathname) => pathname.startsWith("/times"),
  },
  {
    href: "/ranking",
    label: "Ranking",
    icon: Trophy,
    match: (pathname) => pathname.startsWith("/ranking"),
  },
];

function UserAvatar({ user }: { user: SessionUser }) {
  const initials = useMemo(() => {
    const base = user.username.trim() || user.email.trim();

    return base
      .split(/\s+/)
      .slice(0, 2)
      .map((chunk) => chunk.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }, [user.email, user.username]);

  return (
    <div className="relative">
      <div className="text-sidebar-foreground flex size-11 shrink-0 items-center justify-center rounded-pill border border-sidebar-border bg-avatar-gradient text-sm font-bold uppercase tracking-label-sm">
        {initials || "OB"}
      </div>
      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-avatar-ring bg-status" />
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="text-sidebar-foreground flex size-10 items-center justify-center rounded-xs border border-sidebar-border bg-brand-gradient shadow-sm">
        <Globe className="size-5" />
      </div>

      <div>
        <p className="text-sidebar-foreground text-lg font-bold tracking-[-0.03em]">
          Office 8 Ball
        </p>
        <p className="text-sidebar-foreground-subtle text-xs font-medium tracking-label-sm uppercase">
          Area autenticada
        </p>
      </div>
    </div>
  );
}

function UserFooter({
  user,
  pathname,
  isOpen,
  onToggle,
  onClose,
}: {
  user: SessionUser;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const membershipLabel = pathname.startsWith("/dashboard")
    ? "mesa ativa"
    : pathname.startsWith("/ranking")
      ? "visao aberta"
      : "area autenticada";

  return (
    <div className="relative border-t border-sidebar-border px-1 pt-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left transition hover:bg-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="text-sidebar-foreground truncate text-sm font-semibold">
            {user.username}
          </p>
          <p className="truncate caption text-sidebar-accent">
            {membershipLabel}
          </p>
        </div>
        <ChevronDown
          className={cn("text-sidebar-foreground-subtle size-4 shrink-0 transition", {
            "rotate-180": isOpen,
          })}
        />
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Fechar menu de conta"
            className="fixed inset-0 z-10 cursor-default"
            onClick={onClose}
          />
          <div className="absolute bottom-[calc(100%+0.75rem)] left-0 z-20 w-full rounded-lg border border-sidebar-border bg-sidebar-menu p-3 shadow-xl">
            <UserMenu pathname={pathname} user={user} onClose={onClose} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function UserMenu({
  pathname,
  user,
  onClose,
}: {
  pathname: string;
  user: SessionUser;
  onClose: () => void;
}) {
  const accountLinks = [
    {
      href: "/profile",
      label: "Ver perfil",
      icon: Shield,
      active: pathname.startsWith("/profile"),
    },
    {
      href: "/settings",
      label: "Configuracoes",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
  ];

  return (
    <div
      className="text-sidebar-foreground grid gap-1.5"
      role="menu"
      aria-label="Menu da conta"
    >
      <div className="rounded-sm border border-sidebar-border bg-sidebar-hover px-3 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
          <div className="min-w-0">
            <p className="text-sidebar-foreground truncate text-sm font-semibold">
              {user.username}
            </p>
            <p className="text-sidebar-foreground-muted truncate text-xs">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {accountLinks.map((link) => {
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            role="menuitem"
            className={cn(
              "flex items-center gap-3 rounded-sm border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-menu",
              link.active
                ? "border-sidebar-active-strong bg-sidebar-active text-sidebar-foreground shadow-sm"
                : "border-transparent text-sidebar-foreground-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}

      <div className="mt-1 flex items-center justify-between rounded-sm border border-sidebar-border bg-sidebar-hover px-3 py-2.5">
        <div>
          <p className="text-sidebar-foreground text-sm font-semibold">Tema</p>
        </div>
        <ThemeToggle
          variant="sidebar"
          className="h-10 rounded-xs px-3 focus-visible:ring-offset-sidebar-menu"
        />
      </div>

      <Button
        variant="sidebar"
        className="mt-1 h-11 justify-start rounded-sm px-3 focus-visible:ring-offset-sidebar-menu"
        onClick={() => {
          onClose();
          void signOut({ callbackUrl: "/login" });
        }}
        data-testid="dashboard-sign-out"
      >
        <LogOut className="size-4" />
        Sair
      </Button>
    </div>
  );
}

function SidebarContent({
  pathname,
  user,
  onNavigate,
}: {
  pathname: string;
  user: SessionUser;
  onNavigate?: () => void;
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="flex h-full flex-col gap-8">
      <SidebarBrand />

      <div className="flex-1">
        <SidebarNavigation pathname={pathname} onNavigate={onNavigate} />
      </div>

      <UserFooter
        pathname={pathname}
        user={user}
        isOpen={isUserMenuOpen}
        onToggle={() => setIsUserMenuOpen((current) => !current)}
        onClose={() => setIsUserMenuOpen(false)}
      />
    </div>
  );
}

function SidebarNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="text-sidebar-foreground grid gap-2"
      aria-label="Navegacao principal"
    >
      {navigationItems.map((item) => {
        const isActive = item.match(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-4 rounded-xs border px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
              isActive
                ? "border-sidebar-active-strong bg-sidebar-active text-sidebar-foreground shadow-sm"
                : "border-transparent text-sidebar-foreground-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <div className="flex min-h-dvh w-full">
        <aside className="text-sidebar-foreground hidden w-[260px] shrink-0 bg-sidebar lg:flex lg:flex-col lg:border-r lg:border-sidebar-border">
          <div className="sticky top-0 flex h-dvh flex-col px-4 py-6">
            <SidebarContent pathname={pathname} user={user} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-content-gradient">
          <header className="flex items-center justify-between border-b border-border bg-surface/92 px-4 py-3 backdrop-blur lg:hidden">
            <SidebarBrand />

            <Button
              variant="ghost"
              className="h-11 rounded-xs border border-border bg-surface-emphasis px-4"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Abrir navegacao"
            >
              <Menu className="size-4" />
              Menu
            </Button>
          </header>

          <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Fechar navegacao"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="text-sidebar-foreground absolute inset-y-0 left-0 flex w-[88vw] max-w-[260px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <SidebarBrand />
              <Button
                variant="sidebar"
                className="h-10 rounded-xs px-3 focus-visible:ring-offset-sidebar"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Fechar navegacao"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <SidebarContent
                pathname={pathname}
                user={user}
                onNavigate={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <Toaster position="top-right" richColors />
    </div>
  );
}
