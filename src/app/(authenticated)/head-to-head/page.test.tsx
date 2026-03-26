import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TeamRecord, MatchRecord } from "@/lib/types";

// ── Mock auth before any imports that use it ───────────────────────────────────

let hasDatabaseUrlReturnValue = true;
let currentUser: { id: string; username: string } | null = {
  id: "user-1",
  username: "test.user",
};

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    hasDatabaseUrl: vi.fn(() => hasDatabaseUrlReturnValue),
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});

// ── Mock teams ─────────────────────────────────────────────────────────────────

const mockListUserTeams = vi.fn<() => Promise<TeamRecord[]>>();

vi.mock("@/lib/teams", () => ({
  listUserTeams: mockListUserTeams,
}));

// ── Mock data (matches) ────────────────────────────────────────────────────────

const mockListMatches = vi.fn<() => Promise<MatchRecord[]>>();

vi.mock("@/lib/data", () => ({
  listMatches: mockListMatches,
}));

// ── Mock HeadToHeadView so we can inspect what gets rendered ──────────────────

vi.mock("@/components/head-to-head/head-to-head-view", () => ({
  HeadToHeadView: (props: { data: unknown }) => (
    <div data-testid="head-to-head-view">{JSON.stringify(props.data)}</div>
  ),
}));

// ── Mock IconCallout ───────────────────────────────────────────────────────────

vi.mock("@/components/primitives/icon-callout", () => ({
  IconCallout: ({ title }: { title: string }) => (
    <div data-testid="icon-callout">{title}</div>
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTeam(id: string): TeamRecord {
  return {
    id,
    name: `Time ${id}`,
    type: "duo",
    status: "active",
    createdBy: "user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    members: [{ userId: "user-1", joinedAt: "2026-01-01T00:00:00.000Z" }],
  };
}

const TEAM_A = makeTeam("team-a");
const TEAM_B = makeTeam("team-b");

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("HeadToHeadPage", () => {
  beforeEach(() => {
    vi.resetModules();
    hasDatabaseUrlReturnValue = true;
    currentUser = { id: "user-1", username: "test.user" };
    mockListUserTeams.mockResolvedValue([TEAM_A, TEAM_B]);
    mockListMatches.mockResolvedValue([]);
  });

  it("shows unavailable callout when DATABASE_URL is absent", async () => {
    hasDatabaseUrlReturnValue = false;

    const { default: HeadToHeadRoute } = await import(
      "@/app/(authenticated)/head-to-head/page"
    );
    const element = await HeadToHeadRoute({ searchParams: undefined });
    render(element);

    expect(screen.getByTestId("icon-callout")).toBeInTheDocument();
    expect(screen.getByTestId("icon-callout")).toHaveTextContent("Confronto Direto indisponível");
  });

  it("shows unavailable callout when user is not authenticated", async () => {
    currentUser = null;

    const { default: HeadToHeadRoute } = await import(
      "@/app/(authenticated)/head-to-head/page"
    );
    const element = await HeadToHeadRoute({ searchParams: undefined });
    render(element);

    expect(screen.getByTestId("icon-callout")).toBeInTheDocument();
    expect(screen.getByTestId("icon-callout")).toHaveTextContent("Autenticação necessária");
  });

  it("renders HeadToHeadView with fallback pair when no params provided (D-15)", async () => {
    const { default: HeadToHeadRoute } = await import(
      "@/app/(authenticated)/head-to-head/page"
    );
    const element = await HeadToHeadRoute({ searchParams: undefined });
    render(element);

    const view = screen.getByTestId("head-to-head-view");
    expect(view).toBeInTheDocument();

    const payload = JSON.parse(view.textContent ?? "{}");
    // D-15: fallback to first valid pair
    expect(payload.pair.teamA.id).toBe("team-a");
    expect(payload.pair.teamB.id).toBe("team-b");
    expect(payload.warning).toBeNull();
  });

  it("renders warning when invalid teamA param provided (D-16)", async () => {
    const { default: HeadToHeadRoute } = await import(
      "@/app/(authenticated)/head-to-head/page"
    );
    const element = await HeadToHeadRoute({
      searchParams: Promise.resolve({ teamA: "nonexistent-team", teamB: "team-b" }),
    });
    render(element);

    const view = screen.getByTestId("head-to-head-view");
    const payload = JSON.parse(view.textContent ?? "{}");
    expect(payload.warning).toContain("Seleção inválida");
    // Fallback pair should still be valid
    expect(payload.pair.teamA.id).not.toBe(payload.pair.teamB?.id);
  });

  it("renders warning when same team selected for both sides (D-17)", async () => {
    const { default: HeadToHeadRoute } = await import(
      "@/app/(authenticated)/head-to-head/page"
    );
    const element = await HeadToHeadRoute({
      searchParams: Promise.resolve({ teamA: "team-a", teamB: "team-a" }),
    });
    render(element);

    const view = screen.getByTestId("head-to-head-view");
    const payload = JSON.parse(view.textContent ?? "{}");
    expect(payload.warning).toContain("Seleção inválida");
  });
});
