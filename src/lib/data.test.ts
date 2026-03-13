import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("data layer", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty scoreboard before any match is registered", async () => {
    const { getScoreboard, listMatches } = await import("@/lib/data");

    await expect(listMatches()).resolves.toEqual([]);
    await expect(getScoreboard()).resolves.toMatchObject({
      leaderTeamId: null,
      leadBy: 0,
      totalMatches: 0,
      currentStreak: null,
    });
  });

  it("derives leader, leadBy and streak from match history in memory mode", async () => {
    const { createMatch, getScoreboard, listMatches } = await import("@/lib/data");

    await createMatch({ winnerTeamId: "frontend" });
    vi.setSystemTime(new Date("2026-03-12T10:01:00.000Z"));
    await createMatch({ winnerTeamId: "frontend", note: "  virou passeio  " });
    vi.setSystemTime(new Date("2026-03-12T10:02:00.000Z"));
    await createMatch({ winnerTeamId: "backend" });

    const scoreboard = await getScoreboard();
    const matches = await listMatches();

    expect(scoreboard).toMatchObject({
      leaderTeamId: "frontend",
      leadBy: 1,
      totalMatches: 3,
      currentStreak: {
        teamId: "backend",
        teamName: "Backend",
        count: 1,
      },
    });
    expect(scoreboard.teams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "frontend", wins: 2 }),
        expect.objectContaining({ id: "backend", wins: 1 }),
      ]),
    );
    expect(matches).toHaveLength(3);
    expect(matches[0]).toMatchObject({
      winnerTeamId: "backend",
      note: null,
    });
    expect(matches[1]).toMatchObject({
      winnerTeamId: "frontend",
      note: "virou passeio",
    });
  });
});
