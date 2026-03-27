import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Mock auth before any imports that use it ───────────────────────────────────

let currentUser: { id: string; username: string } | null = {
  id: "user-1",
  username: "gui.dev",
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

// ── Mock ProfilePage client component ────────────────────────────────────────

vi.mock("@/components/profile/profile-page", () => ({
  ProfilePage: (props: { data: unknown }) => (
    <div data-testid="profile-page">{JSON.stringify(props.data)}</div>
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

const MOCK_PROFILE_DATA = {
  userId: "user-1",
  username: "gui.dev",
  displayName: "Guilherme",
  avatarUrl: null,
  bio: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  aggregate: { wins: 3, losses: 1, winRate: 75, totalMatches: 4 },
  teamRows: [],
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("ProfileRoute", () => {
  beforeEach(async () => {
    vi.resetModules();
    currentUser = { id: "user-1", username: "gui.dev" };
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

  it("renders ProfilePage with assembled payload for authenticated user", async () => {
    mockComputeProfilePageData.mockReturnValue({
      ...MOCK_PROFILE_DATA,
      username: "", // will be overridden by RSC assembler
    });

    const { default: ProfileRoute } = await import(
      "@/app/(authenticated)/profile/page"
    );
    const element = await ProfileRoute();
    render(element);

    const profilePage = screen.getByTestId("profile-page");
    expect(profilePage).toBeInTheDocument();
    const payload = JSON.parse(profilePage.textContent ?? "{}");
    expect(payload.username).toBe("gui.dev");
    expect(payload.userId).toBe("user-1");
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
