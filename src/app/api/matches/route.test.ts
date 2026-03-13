import { beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/matches", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T10:00:00.000Z"));
  });

  it("returns created matches and keeps the newest first", async () => {
    const route = await import("@/app/api/matches/route");

    const firstResponse = await route.POST(
      new Request("http://localhost/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerTeamId: "frontend" }),
      }),
    );

    vi.setSystemTime(new Date("2026-03-12T10:01:00.000Z"));

    const secondResponse = await route.POST(
      new Request("http://localhost/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerTeamId: "backend", note: "boa tacada" }),
      }),
    );

    const listResponse = await route.GET();
    const firstPayload = await firstResponse.json();
    const secondPayload = await secondResponse.json();
    const listPayload = await listResponse.json();

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(firstPayload.match.winnerTeamId).toBe("frontend");
    expect(secondPayload.match).toMatchObject({
      winnerTeamId: "backend",
      note: "boa tacada",
    });
    expect(listPayload.matches).toHaveLength(2);
    expect(listPayload.matches[0].winnerTeamId).toBe("backend");
    expect(listPayload.matches[1].winnerTeamId).toBe("frontend");
  });

  it("rejects invalid team ids", async () => {
    const route = await import("@/app/api/matches/route");

    const response = await route.POST(
      new Request("http://localhost/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerTeamId: "mobile" }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "winnerTeamId must be 'frontend' or 'backend'.",
    });
    expect(response.status).toBe(400);
  });

  it("rejects notes longer than 140 characters", async () => {
    const route = await import("@/app/api/matches/route");

    const response = await route.POST(
      new Request("http://localhost/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerTeamId: "frontend",
          note: "x".repeat(141),
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "note must be a string with at most 140 characters.",
    });
    expect(response.status).toBe(400);
  });
});
