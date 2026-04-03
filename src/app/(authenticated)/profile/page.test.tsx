import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SessionUser } from "@/lib/types";

// ── Mock auth before any imports that use it ───────────────────────────────────

let currentUser: SessionUser | null = {
  id: "user-1",
  username: "gui.dev",
  displayName: "Gui Dev",
  avatarUrl: null,
};

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    hasDatabaseUrl: vi.fn(() => true),
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});

// ── Mock profile-stats ─────────────────────────────────────────────────────────

const mockComputeProfilePageData = vi.fn();

vi.mock("@/lib/profile-stats", () => ({
  computeProfilePageData: mockComputeProfilePageData,
}));

// ── Mock prisma ────────────────────────────────────────────────────────────────

const mockFindUniqueUser = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUniqueUser },
  },
}));

// ── Mock teams and data ────────────────────────────────────────────────────────

vi.mock("@/lib/teams", () => ({
  listUserTeams: vi.fn(async () => []),
}));

vi.mock("@/lib/data", () => ({
  listMatches: vi.fn(async () => []),
}));

// ── Mock section components ───────────────────────────────────────────────────

vi.mock("@/components/profile/profile-hero-section", () => ({
  ProfileHeroSection: ({ userId }: { userId: string }) => (
    <div data-testid="profile-hero-section" data-user-id={userId} />
  ),
}));

vi.mock("@/components/profile/profile-stats-section", () => ({
  ProfileStatsSection: ({ userId }: { userId: string }) => (
    <div data-testid="profile-stats-section" data-user-id={userId} />
  ),
}));

// ── Mock IconCallout for unavailable state ─────────────────────────────────────

vi.mock("@/components/primitives/icon-callout", () => ({
  IconCallout: ({ title }: { title: string }) => (
    <div data-testid="icon-callout">{title}</div>
  ),
}));

// ── Constants ─────────────────────────────────────────────────────────────────

const MOCK_DB_USER = {
  id: "user-1",
  username: "gui.dev",
  email: "gui@office8ball.dev",
  displayName: "Guilherme",
  avatarUrl: null,
  bio: null,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("ProfileRoute", () => {
  beforeEach(async () => {
    vi.resetModules();
    currentUser = {
      id: "user-1",
      username: "gui.dev",
      displayName: "Gui Dev",
      avatarUrl: null,
    };
    mockFindUniqueUser.mockResolvedValue(MOCK_DB_USER);
    mockComputeProfilePageData.mockReturnValue({
      userId: "user-1",
      username: "",
      displayName: null,
      avatarUrl: null,
      bio: null,
      createdAt: new Date().toISOString(),
      aggregate: { wins: 0, losses: 0, winRate: 0, totalMatches: 0 },
      teamRows: [],
    });
    // Reset hasDatabaseUrl to return true by default before each test
    const auth = await import("@/lib/auth");
    vi.mocked(auth.hasDatabaseUrl).mockReturnValue(true);
    vi.mocked(auth.getAuthenticatedUser).mockImplementation(async () => currentUser);
  });

  it("shows unavailable callout when DATABASE_URL is absent", async () => {
    const { hasDatabaseUrl } = await import("@/lib/auth");
    vi.mocked(hasDatabaseUrl).mockReturnValue(false);

    const { default: ProfileRoute } = await import(
      "@/app/(authenticated)/profile/page"
    );
    const element = await ProfileRoute();
    render(element);

    expect(screen.getByTestId("icon-callout")).toBeInTheDocument();
  });

  it("renders section components with correct userId for authenticated user", async () => {
    const { default: ProfileRoute } = await import(
      "@/app/(authenticated)/profile/page"
    );
    const element = await ProfileRoute();
    render(element);

    expect(screen.getByTestId("profile-hero-section")).toBeInTheDocument();
    expect(screen.getByTestId("profile-stats-section")).toBeInTheDocument();
    expect(screen.getByTestId("profile-hero-section").dataset.userId).toBe("user-1");
    expect(screen.getByTestId("profile-stats-section").dataset.userId).toBe("user-1");
  });

  it("returns unavailable callout when user is not authenticated", async () => {
    currentUser = null;

    const { default: ProfileRoute } = await import(
      "@/app/(authenticated)/profile/page"
    );
    const element = await ProfileRoute();
    render(element);

    expect(screen.getByTestId("icon-callout")).toBeInTheDocument();
  });
});
