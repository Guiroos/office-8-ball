"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  ChevronDown,
  LogOut,
  Menu,
  Shield,
  Swords,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  Suspense,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
  useMemo,
  useState,
  useTransition,
} from "react";

import { AuthenticatedRouteLoading } from "@/components/authenticated/authenticated-route-loading";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  // Temporarily hidden from sidebar navigation until dashboard UX improvements are ready.
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
  {
    href: "/partida",
    label: "Partida",
    icon: Swords,
    match: (pathname) => pathname.startsWith("/partida"),
  },
];

function UserAvatar({ user }: { user: SessionUser }) {
  const initials = useMemo(() => {
    return (user.displayName ?? user.username)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((chunk: string) => chunk.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }, [user.displayName, user.username]);

  return (
    <div className="relative">
      <Avatar className="size-11 rounded-pill border-sidebar-border bg-avatar-gradient">
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={user.displayName ?? user.username} />
        ) : null}
        <AvatarFallback className="bg-transparent text-sidebar-foreground tracking-label-sm">
          {initials || "OB"}
        </AvatarFallback>
      </Avatar>
      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-avatar-ring bg-status" />
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="border-b border-sidebar-border px-1 pb-5">
      <div className="flex items-center gap-3">
        <div className="overflow-hidden rounded-pill border border-sidebar-border shadow-sm shadow-black/20">
          <Image
            src="/pool-ball.png"
            alt="Bola 8"
            width={40}
            height={40}
            className="size-8 object-cover"
            priority
          />
        </div>

        <div className="min-w-0">
          <p className="font-display text-2xl font-black uppercase leading-none tracking-label-sm text-sidebar-foreground">
            Sinuca Club
          </p>
        </div>
      </div>
    </div>
  );
}

function ShellIdentity({
  user,
  isOpen,
  onToggle,
  onClose,
  onNavigate,
}: {
  user: SessionUser;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate?: (href: string, onBeforeNavigate?: () => void) => void;
}) {
  const primaryName = user.displayName ?? user.username;

  return (
    <div className="relative border-t border-sidebar-border px-1 pt-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-sm border border-sidebar-border bg-sidebar-hover px-3 py-3 text-left transition hover:bg-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="text-sidebar-foreground truncate text-sm font-semibold">
            {primaryName}
          </p>
          <p className="truncate text-xs font-medium text-sidebar-accent">
            @{user.username}
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
          <div className="absolute bottom-[calc(100%+0.75rem)] left-0 z-20 w-full rounded-lg border border-sidebar-border bg-sidebar-menu p-2.5 shadow-xl">
            <UserMenu onClose={onClose} onNavigate={onNavigate ?? (() => undefined)} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function UserMenu({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (href: string, onBeforeNavigate?: () => void) => void;
}) {
  const router = useRouter();

  return (
    <div
      className="text-sidebar-foreground grid gap-1"
      role="menu"
      aria-label="Menu da conta"
    >
      <Link
        href="/profile"
        onClick={(event) => {
          event.preventDefault();
          onNavigate("/profile", onClose);
        }}
        role="menuitem"
        className="flex items-center gap-3 rounded-sm border border-transparent px-3 py-2.5 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-menu"
      >
        <Shield className="size-4" />
        Ver perfil
      </Link>

      <ThemeToggle
        variant="sidebar"
        layout="menu"
        role="menuitem"
        className="h-10 rounded-sm border-transparent bg-transparent px-3 text-sidebar-foreground shadow-none hover:bg-sidebar-hover focus-visible:ring-offset-sidebar-menu"
      />

      <Button
        variant="sidebar"
        className="h-10 justify-start rounded-sm border-transparent bg-transparent px-3 text-sidebar-foreground shadow-none hover:bg-sidebar-hover focus-visible:ring-offset-sidebar-menu"
        onClick={() => {
          onClose();
          void authClient.signOut({
            fetchOptions: {
              onSuccess: () => router.push("/login"),
            },
          });
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
  onNavigate?: (href: string, onBeforeNavigate?: () => void) => void;
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="flex h-full flex-col gap-8">
      <SidebarBrand />

      <div className="flex-1 pt-1">
        <SidebarNavigation pathname={pathname} onNavigate={onNavigate} />
      </div>

      <ShellIdentity
        user={user}
        isOpen={isUserMenuOpen}
        onToggle={() => setIsUserMenuOpen((current) => !current)}
        onClose={() => setIsUserMenuOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function SidebarNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: (href: string, onBeforeNavigate?: () => void) => void;
}) {
  function handleClick(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
    isActive: boolean,
  ) {
    if (isActive) {
      onNavigate?.(href);
      return;
    }

    event.preventDefault();
    onNavigate?.(href);
  }

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
            onClick={(event) => handleClick(event, item.href, isActive)}
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
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isNavigating, startNavigation] = useTransition();

  if (pendingHref === pathname && !isNavigating) {
    setPendingHref(null);
  }

  const isRoutePending = isNavigating || (pendingHref !== null && pendingHref !== pathname);

  function handleNavigation(href: string, onBeforeNavigate?: () => void) {
    onBeforeNavigate?.();

    if (href === pathname) {
      setPendingHref(null);
      return;
    }

    setPendingHref(href);
    startNavigation(() => {
      router.push(href);
    });
  }

  return (
    <div className="min-h-dvh">
      <div className="flex min-h-dvh w-full">
        <aside className="text-sidebar-foreground hidden w-[260px] shrink-0 bg-sidebar lg:flex lg:flex-col lg:border-r lg:border-sidebar-border">
          <div className="sticky top-0 flex h-dvh flex-col px-4 py-6">
            <SidebarContent pathname={pathname} user={user} onNavigate={handleNavigation} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-content-gradient">
          {isRoutePending ? <span className="sr-only" role="status">Carregando rota</span> : null}
          <div
            aria-hidden="true"
            className={cn(
              "sticky top-0 z-20 h-1 overflow-hidden transition-opacity",
              isRoutePending ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="h-full w-full animate-pulse bg-gold-gradient" />
          </div>

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

          <div
            className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
            aria-busy={isRoutePending}
          >
            <Suspense fallback={<AuthenticatedRouteLoading framed={false} />}>
              {children}
            </Suspense>
          </div>
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
                user={user}
                pathname={pathname}
                onNavigate={(href, onBeforeNavigate) =>
                  handleNavigation(href, () => {
                    onBeforeNavigate?.();
                    setIsMobileSidebarOpen(false);
                  })}
              />
            </div>
          </div>
        </div>
      ) : null}

      <Toaster position="top-right" richColors />
    </div>
  );
}
