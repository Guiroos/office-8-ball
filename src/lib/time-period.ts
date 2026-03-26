import type { RankingPeriod } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PeriodWindow = {
  /** UTC start of the window (inclusive), or null for "all" */
  startUtc: Date | null;
  /** UTC end of the window (inclusive), or null for "all" */
  endUtc: Date | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** BRT offset in milliseconds. America/Sao_Paulo is UTC-3 (no DST in 2026). */
const BRT_OFFSET_MS = 3 * 60 * 60 * 1000; // 3 hours

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a UTC Date to a "BRT wall-clock" Date object whose UTC fields
 * reflect what a BRT clock would show.
 *
 * Example: 2026-03-26T09:00:00Z → 2026-03-26T06:00:00 in BRT
 * The returned Date's getUTCFullYear/Month/Day/Hours return the BRT values.
 */
function toBrtWall(utc: Date): Date {
  return new Date(utc.getTime() - BRT_OFFSET_MS);
}

/**
 * Convert a "BRT wall-clock" Date (whose UTC fields encode BRT time) back to
 * a true UTC Date by re-adding the BRT offset.
 */
function fromBrtWall(brt: Date): Date {
  return new Date(brt.getTime() + BRT_OFFSET_MS);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve the UTC date window for the given ranking period.
 *
 * - "all"   → { startUtc: null, endUtc: null } (no time boundary)
 * - "week"  → ISO week (Mon 00:00 – Sun 23:59:59.999) anchored in America/Sao_Paulo (D-10)
 * - "month" → Calendar month (1st 00:00 – last 23:59:59.999) anchored in America/Sao_Paulo (D-11)
 *
 * @param period  The requested ranking period.
 * @param now     Current time in UTC. Defaults to Date.now(); injectable for tests.
 */
export function resolvePeriodWindow(period: RankingPeriod, now: Date = new Date()): PeriodWindow {
  if (period === "all") {
    return { startUtc: null, endUtc: null };
  }

  // Translate current UTC time to BRT wall-clock values
  const brtNow = toBrtWall(now);

  if (period === "week") {
    // ISO week: Monday = day 1. JS getUTCDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // dayOfWeek: Mon=1 → offset 0, Tue=2 → offset 1, ..., Sun=0 → offset 6
    const jsDay = brtNow.getUTCDay(); // 0=Sun
    const dayOffset = jsDay === 0 ? 6 : jsDay - 1; // days since last Monday

    // Monday 00:00:00.000 BRT
    const brtMonday = new Date(
      Date.UTC(
        brtNow.getUTCFullYear(),
        brtNow.getUTCMonth(),
        brtNow.getUTCDate() - dayOffset,
        0, 0, 0, 0
      )
    );

    // Sunday 23:59:59.999 BRT = Monday + 7 days - 1ms
    const brtSundayEnd = new Date(brtMonday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    return {
      startUtc: fromBrtWall(brtMonday),
      endUtc: fromBrtWall(brtSundayEnd),
    };
  }

  // period === "month"
  // First day of current BRT month, 00:00:00.000 BRT
  const brtMonthStart = new Date(
    Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth(), 1, 0, 0, 0, 0)
  );

  // First day of NEXT BRT month - 1ms = last moment of current month BRT
  const brtMonthEnd = new Date(
    Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth() + 1, 1, 0, 0, 0, 0) - 1
  );

  return {
    startUtc: fromBrtWall(brtMonthStart),
    endUtc: fromBrtWall(brtMonthEnd),
  };
}
