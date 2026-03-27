import { describe, it, expect } from "vitest";
import { resolvePeriodWindow } from "@/lib/time-period";

// All "now" timestamps are anchored in UTC so the BRT offset (UTC-3) is predictable.
// BRT = UTC-3 → 2026-03-26T03:00:00Z = 2026-03-26T00:00:00 BRT (midnight Thursday)
//               2026-03-26T09:00:00Z = 2026-03-26T06:00:00 BRT (06:00 Thursday)

describe("resolvePeriodWindow", () => {
  it('Teste 1: "all" returns no date boundaries', () => {
    const now = new Date("2026-03-26T09:00:00Z");
    const window = resolvePeriodWindow("all", now);

    expect(window.startUtc).toBeNull();
    expect(window.endUtc).toBeNull();
  });

  it('Teste 2: "week" uses ISO week (Mon–Sun) anchored in America/Sao_Paulo (D-10)', () => {
    // 2026-03-26T09:00:00Z = Thursday 2026-03-26 06:00 BRT
    // ISO week: Mon 2026-03-23 00:00 BRT → Sun 2026-03-29 23:59:59.999 BRT
    // In UTC+0: Mon start = 2026-03-23T03:00:00Z (BRT midnight = UTC+3h)
    //           Sun end   = 2026-03-30T02:59:59.999Z
    const now = new Date("2026-03-26T09:00:00Z");
    const window = resolvePeriodWindow("week", now);

    expect(window.startUtc).not.toBeNull();
    expect(window.endUtc).not.toBeNull();
    expect(window.startUtc!.toISOString()).toBe("2026-03-23T03:00:00.000Z");
    expect(window.endUtc!.toISOString()).toBe("2026-03-30T02:59:59.999Z");
  });

  it('Teste 3: "month" uses calendar month anchored in America/Sao_Paulo (D-11)', () => {
    // 2026-03-26T09:00:00Z = 2026-03-26 06:00 BRT → March 2026
    // Month start: 2026-03-01 00:00 BRT = 2026-03-01T03:00:00Z
    // Month end  : 2026-03-31 23:59:59.999 BRT = 2026-04-01T02:59:59.999Z
    const now = new Date("2026-03-26T09:00:00Z");
    const window = resolvePeriodWindow("month", now);

    expect(window.startUtc).not.toBeNull();
    expect(window.endUtc).not.toBeNull();
    expect(window.startUtc!.toISOString()).toBe("2026-03-01T03:00:00.000Z");
    expect(window.endUtc!.toISOString()).toBe("2026-04-01T02:59:59.999Z");
  });

  it('"week" correctly resolves Monday as start of ISO week', () => {
    // 2026-03-23T09:00:00Z = Monday 2026-03-23 06:00 BRT
    // ISO week start: 2026-03-23 00:00 BRT = 2026-03-23T03:00:00Z
    // ISO week end  : 2026-03-29 23:59:59.999 BRT = 2026-03-30T02:59:59.999Z
    const now = new Date("2026-03-23T09:00:00Z");
    const window = resolvePeriodWindow("week", now);

    expect(window.startUtc!.toISOString()).toBe("2026-03-23T03:00:00.000Z");
    expect(window.endUtc!.toISOString()).toBe("2026-03-30T02:59:59.999Z");
  });
});
