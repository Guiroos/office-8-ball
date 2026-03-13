import { beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/scoreboard", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T10:00:00.000Z"));
  });

  it("returns a scoreboard consistent with the current match history", async () => {
    const matchesRoute = await import("@/app/api/matches/route");
    const scoreboardRoute = await import("@/app/api/scoreboard/route");

    await matchesRoute.POST(
      new Request("http://localhost/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerTeamId: "frontend" }),
      }),
    );

    vi.setSystemTime(new Date("2026-03-12T10:01:00.000Z"));

    await matchesRoute.POST(
      new Request("http://localhost/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerTeamId: "frontend" }),
      }),
    );

    const response = await scoreboardRoute.GET();
    const payload = await response.json();

    expect(payload.scoreboard).toMatchObject({
      leaderTeamId: "frontend",
      leadBy: 2,
      totalMatches: 2,
      currentStreak: {
        teamId: "frontend",
        teamName: "Frontend",
        count: 2,
      },
    });
  });
});
