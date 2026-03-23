import { describe, expect, it } from "vitest";

describe("/api/scoreboard", () => {
  it("returns 503 while scoreboard is suspended", async () => {
    const { GET } = await import("@/app/api/scoreboard/route");
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
