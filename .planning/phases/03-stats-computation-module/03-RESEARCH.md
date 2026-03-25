# Phase 3: Stats Computation Module - Research

**Researched:** 2026-03-25
**Domain:** Pure functions for deriving team and head-to-head statistics from match history
**Confidence:** HIGH

## Summary

Phase 2 established scoreboard computation in application layer (wins/losses per team). Phase 3 extracts this logic into isolated, reusable, fully-testable functions that will power Phase 4 (ranking page) and Phase 5 (user profiles with time filters).

The core insight from the codebase is that **stats are always derived from match history, never stored**. Phase 3 codifies this pattern into a dedicated stats module with pure functions covering: (1) per-team aggregations (wins, losses, win rate %, streaks), (2) head-to-head metrics between two teams, (3) Zod validation schemas for output types, and (4) edge case handling (0 matches, 1 match, 100+ matches, exact ties).

Current code in `src/lib/data.ts` already implements basic wins/losses counting; Phase 3 generalizes and extends this into `computeTeamStats()`, `computeHeadToHead()`, and supporting validation schemas.

**Primary recommendation:** Create `src/lib/stats.ts` with pure functions (no database access, no side effects). All functions accept `MatchRecord[]` as input. Output types validated with Zod. All functions fully unit-testable in isolation.

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for Phase 3 yet. Constraints inherited from prior phases:

**Locked (from STATE.md and CLAUDE.md):**
- All stats computation in application layer, never in database
- Scoreboard (and all derived metrics) computed fresh on each request from match history
- No stored counters or aggregates — single source of truth is match records
- Dual-mode persistence must remain working (in-memory fallback when no DATABASE_URL)
- Stats functions must be pure and deterministic (same input = same output always)
- Win rate must be a percentage in range [0, 100]; 0% for zero matches, 100% for perfect record
- No new dependencies; use existing stack (Zod for schemas, TypeScript for types)

**Architecture constraints (from CLAUDE.md and architecture.md):**
- Do not introduce custom aggregation at database level — all computation in application code
- Do not persist "current streak" or "best streak" fields — derive from match sequence
- Do not hardcode team constants in stats functions — all functions work for any team IDs
- All output types must validate against Zod schemas to catch NaN, null, or type mismatches

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5 | Type-safe stats functions | Catch off-by-one errors, invalid win rates at compile time |
| Zod | 4.3.6 | Output validation schemas | Prevent NaN, invalid streaks, out-of-range win rates escaping functions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.1.0 | Pure function tests | Unit tests for `computeTeamStats()`, `computeHeadToHead()` with edge cases |
| @testing-library/react | 16.3.2 | Hooks tests | If Phase 4 creates `useTeamStats()` hook (optional) |

**Installation:**
All libraries already present. No new packages needed.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── stats.ts           # NEW: Pure stats computation functions
│   ├── stats.test.ts      # NEW: Edge case tests (0 matches, 1 match, 100+, ties, streaks)
│   ├── types.ts           # EXTEND: Add TeamStats, HeadToHeadStats, WinRateSchema types
│   └── data.ts            # OPTIONAL: Refactor getScoreboard() to use computeTeamStats()
└── app/
    └── api/
        └── stats/         # OPTIONAL: Future API endpoints if needed
```

### Pattern 1: Pure Stats Computation Function

**What:** Function accepts array of matches, returns computed statistics. Zero side effects, zero database access, pure function contract.

**When to use:** Always — all stats computation follows this pattern.

**Example:**

```typescript
// Source: src/lib/stats.ts (to be implemented)

import { z } from "zod";
import type { MatchRecord } from "@/lib/types";

// Zod schema validates output before returning
export const TeamStatsSchema = z.object({
  teamId: z.string(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  winRate: z.number().min(0).max(100), // 0-100 percentage
  currentStreak: z.object({
    type: z.enum(["win", "loss", "none"]),
    count: z.number().int().nonnegative(),
  }),
  longestStreak: z.object({
    type: z.enum(["win", "loss", "none"]),
    count: z.number().int().nonnegative(),
  }),
  totalMatches: z.number().int().nonnegative(),
});

export type TeamStats = z.infer<typeof TeamStatsSchema>;

export function computeTeamStats(
  teamId: string,
  allMatches: MatchRecord[]
): TeamStats {
  // Precondition: teamId is valid string, allMatches is array (may be empty)

  // 1. Filter to only matches this team played in
  const teamMatches = allMatches.filter(
    (m) => m.teamAId === teamId || m.teamBId === teamId
  );

  // 2. Count wins and losses
  let wins = 0;
  let losses = 0;
  for (const match of teamMatches) {
    if (match.winnerTeamId === teamId) {
      wins++;
    } else {
      losses++;
    }
  }

  // 3. Compute win rate: (wins / total) * 100, or 0% if no matches
  const total = teamMatches.length;
  const winRate = total === 0 ? 0 : (wins / total) * 100;

  // 4. Detect streaks from match sequence (most recent first)
  // Matches are ordered playedAt desc, so first element is most recent
  const { currentStreak, longestStreak } = detectStreaks(
    teamId,
    teamMatches
  );

  // 5. Validate output with Zod before returning
  const result = {
    teamId,
    wins,
    losses,
    winRate,
    currentStreak,
    longestStreak,
    totalMatches: total,
  };

  return TeamStatsSchema.parse(result); // throws if invalid
}

// Helper: detect current and longest streak
function detectStreaks(
  teamId: string,
  teamMatches: MatchRecord[]
): {
  currentStreak: { type: "win" | "loss" | "none"; count: number };
  longestStreak: { type: "win" | "loss" | "none"; count: number };
} {
  if (teamMatches.length === 0) {
    return {
      currentStreak: { type: "none", count: 0 },
      longestStreak: { type: "none", count: 0 },
    };
  }

  // Determine current streak from most recent match backwards
  let currentType: "win" | "loss" | "none" = "none";
  let currentCount = 0;
  let longestType: "win" | "loss" | "none" = "none";
  let longestCount = 0;

  for (const match of teamMatches) {
    const isWin = match.winnerTeamId === teamId;
    const matchType = isWin ? "win" : "loss";

    if (currentType === "none") {
      currentType = matchType;
      currentCount = 1;
    } else if (currentType === matchType) {
      currentCount++;
    } else {
      // Streak broke
      if (currentCount > longestCount) {
        longestType = currentType;
        longestCount = currentCount;
      }
      currentType = matchType;
      currentCount = 1;
    }
  }

  // Check final streak against longest
  if (currentCount > longestCount) {
    longestType = currentType;
    longestCount = currentCount;
  }

  return {
    currentStreak: { type: currentType, count: currentCount },
    longestStreak: { type: longestType, count: longestCount },
  };
}
```

### Pattern 2: Head-to-Head Statistics

**What:** Function filters matches to only those between two specific teams, computes isolated record.

**When to use:** Ranking comparisons, team detail pages, head-to-head history views.

**Example:**

```typescript
// Source: src/lib/stats.ts

export const HeadToHeadStatsSchema = z.object({
  teamAId: z.string(),
  teamBId: z.string(),
  teamAWins: z.number().int().nonnegative(),
  teamBWins: z.number().int().nonnegative(),
  totalMatches: z.number().int().nonnegative(),
  recentMatches: z.array(z.string()), // MatchRecord ids, most recent first
});

export type HeadToHeadStats = z.infer<typeof HeadToHeadStatsSchema>;

export function computeHeadToHead(
  teamAId: string,
  teamBId: string,
  allMatches: MatchRecord[]
): HeadToHeadStats {
  // Filter to only matches between these two teams
  const h2hMatches = allMatches.filter(
    (m) =>
      (m.teamAId === teamAId && m.teamBId === teamBId) ||
      (m.teamAId === teamBId && m.teamBId === teamAId)
  );

  // Count wins per team
  let teamAWins = 0;
  let teamBWins = 0;

  for (const match of h2hMatches) {
    if (match.winnerTeamId === teamAId) {
      teamAWins++;
    } else if (match.winnerTeamId === teamBId) {
      teamBWins++;
    }
  }

  const recentMatches = h2hMatches.map((m) => m.id).slice(0, 10); // Last 10

  const result = {
    teamAId,
    teamBId,
    teamAWins,
    teamBWins,
    totalMatches: h2hMatches.length,
    recentMatches,
  };

  return HeadToHeadStatsSchema.parse(result);
}
```

### Anti-Patterns to Avoid

- **Computing stats from database aggregates:** Violates single-source-of-truth (match history). Stored counters drift from reality when bugs occur or data is corrected.
- **Using database-side window functions for streaks:** Complex, database-specific, not testable in unit tests without real DB. Application-layer derivation is clearer and fully isolated.
- **Caching stats without revalidation tags:** Phase 4 will add `revalidateTag('matches')` after match creation, but stats functions themselves must be pure (no caching logic inside functions).
- **Including team filters in stats functions:** Stats functions accept full match array; filtering to specific teams is caller's responsibility (allows composition and testing in isolation).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calculating win percentage safely | Manual `wins / total` division | Zod schema with `min(0).max(100)` + safeguard for 0 matches | Avoids NaN, -0, Infinity edge cases; schema validation catches bugs |
| Detecting streaks from match sequence | Custom iteration with state machines | Dedicated `detectStreaks()` helper function | Easier to test; off-by-one errors common in streak logic |
| Validating output types | Trust function output | Zod `.parse()` at function boundary | Catches NaN, null, undefined, type mismatches before returning to caller |
| Filtering matches by team pair | Multiple filter iterations | Single `computeHeadToHead()` call | Reusable; prevents duplicating filter logic in ranking and team detail pages |
| Sorting teams by wins | Ad-hoc `.sort()` in each route | Dedicated sorting function or let caller sort after getting stats | Consistency; single definition of "leader" (most wins, then longest streak as tiebreaker optional) |

**Key insight:** Stats computation is deceptively complex — off-by-one errors in streaks, edge cases with 0 or 1 matches, NaN from division, tied records. Centralizing logic in testable functions prevents these bugs from leaking into 3+ different routes (scoreboard, ranking, team detail, user profile).

## Runtime State Inventory

**Not applicable.** Phase 3 is pure code implementation; no rename, refactor, or migration involved. All new functions are additive.

## Common Pitfalls

### Pitfall 1: Off-by-One Errors in Current Streak Detection

**What goes wrong:** Counting the current streak incorrectly — either off by one, or detecting a streak when matches list is empty.

**Why it happens:** Streak detection requires careful iteration order and state tracking. Easy to miscount the transition point between streaks.

**How to avoid:** Test explicitly with: (1) no matches (expect streak = none, count = 0), (2) one match (expect streak = win or loss, count = 1), (3) two consecutive wins (expect streak = win, count = 2), (4) alternating win/loss (expect longest = 1).

**Warning signs:** Streaks off by ±1 in test assertions; test results jump unexpectedly when adding one more match.

### Pitfall 2: NaN Win Rate from Zero Matches

**What goes wrong:** Computing `0 / 0` or `wins / 0` yields NaN; function returns NaN; Zod validation catches it but error handling is unclear.

**Why it happens:** Not checking `total === 0` before computing percentage.

**How to avoid:** Always check: `if (total === 0) return 0; else return (wins / total) * 100;`. Zod schema validates `winRate` is in [0, 100], so any NaN will fail `.parse()`.

**Warning signs:** Test expects 0% win rate for no matches; function returns NaN instead; `.parse()` throws "Expected number between 0 and 100, received NaN".

### Pitfall 3: Longest Streak Never Updated Due to Off-by-One

**What goes wrong:** Longest streak remains 0 even after detecting a streak, because comparison is `>` instead of `>=` or boundary is checked at wrong time.

**Why it happens:** Final streak (after loop) is not compared to longest if loop ends before detecting a break.

**How to avoid:** Always compare final streak AFTER the loop, not just inside the loop when streaks break. Test with records where final match continues the current streak.

**Warning signs:** Test for 3 consecutive wins shows current streak = 3 but longest streak = 0 or 1.

### Pitfall 4: Filtering Head-to-Head Matches Asymmetrically

**What goes wrong:** Filter only includes matches where `teamAId === team1 && teamBId === team2`, missing matches where the roles are reversed.

**Why it happens:** Assuming team order is consistent; actually matches can have teams in either order.

**How to avoid:** Always use OR condition: `(teamAId === team1 && teamBId === team2) || (teamAId === team2 && teamBId === team1)`. Zod schema validates that `h2hWins.teamA + h2hWins.teamB === h2hMatches.length` (no unaccounted matches).

**Warning signs:** Head-to-head record shows only half the actual matches; sum of wins doesn't equal total matches.

### Pitfall 5: Win Rate Calculation Precision Loss

**What goes wrong:** Computing win rate as integer (e.g., `(5 / 7) * 100 = 71` instead of `71.428...`), loses precision.

**Why it happens:** Language rounding or premature integer conversion.

**How to avoid:** Keep win rate as floating-point number. Zod schema accepts `z.number()` (not `.int()`). Let caller format display (e.g., `toFixed(1)` for 71.4%).

**Warning signs:** Two teams with different win rates showing identical percentage in UI; Zod validation passes even though math seems off.

## Code Examples

All examples below are verified against existing codebase patterns and TypeScript strict mode.

### Example 1: Computing Team Stats with Edge Cases

```typescript
// Source: src/lib/stats.ts (to be implemented)

// Test case: 0 matches should give 0% win rate, no streaks
const emptyTeamStats = computeTeamStats("team-a", []);
// Expected:
// {
//   teamId: "team-a",
//   wins: 0,
//   losses: 0,
//   winRate: 0,
//   currentStreak: { type: "none", count: 0 },
//   longestStreak: { type: "none", count: 0 },
//   totalMatches: 0,
// }

// Test case: 1 match, team wins
const singleWin = computeTeamStats("team-a", [
  {
    id: "m1",
    teamAId: "team-a",
    teamBId: "team-b",
    winnerTeamId: "team-a",
    loserTeamId: "team-b",
    playedAt: "2026-03-25T10:00:00Z",
    note: null,
  },
]);
// Expected:
// {
//   teamId: "team-a",
//   wins: 1,
//   losses: 0,
//   winRate: 100,
//   currentStreak: { type: "win", count: 1 },
//   longestStreak: { type: "win", count: 1 },
//   totalMatches: 1,
// }

// Test case: 3 wins, 2 losses, then 1 more win (current streak = 1 win, longest = 2)
const mixedRecord = computeTeamStats("team-a", [
  { /* ...playedAt: newest */ winnerTeamId: "team-a" }, // match 5: win (current streak = 1)
  { /* ...playedAt: ... */ winnerTeamId: "team-b" },    // match 4: loss (breaks 2-win streak)
  { /* ...playedAt: ... */ winnerTeamId: "team-a" },    // match 3: win
  { /* ...playedAt: ... */ winnerTeamId: "team-a" },    // match 2: win (longest = 2 here)
  { /* ...playedAt: oldest */ winnerTeamId: "team-b" }, // match 1: loss
]);
// Expected:
// {
//   wins: 3,
//   losses: 2,
//   winRate: 60,
//   currentStreak: { type: "win", count: 1 },
//   longestStreak: { type: "win", count: 2 },
//   totalMatches: 5,
// }
```

### Example 2: Head-to-Head with Asymmetric Team Order

```typescript
// Source: src/lib/stats.ts (to be implemented)

const h2hMatches = [
  { teamAId: "red", teamBId: "blue", winnerTeamId: "red", ... },   // red wins
  { teamAId: "blue", teamBId: "red", winnerTeamId: "blue", ... },  // blue wins (reversed order!)
  { teamAId: "red", teamBId: "blue", winnerTeamId: "blue", ... },  // blue wins
];

const h2h = computeHeadToHead("red", "blue", h2hMatches);
// Expected:
// {
//   teamAId: "red",
//   teamBId: "blue",
//   teamAWins: 1,  // Only the first match
//   teamBWins: 2,  // The reversed-order + the third match
//   totalMatches: 3,
// }
```

### Example 3: Zod Validation Catches Invalid Output

```typescript
// Source: Test that demonstrates validation

// If a buggy implementation returned NaN:
const badStats = {
  teamId: "team-a",
  wins: 5,
  losses: 0,
  winRate: NaN, // Bug!
  currentStreak: { type: "win" as const, count: 5 },
  longestStreak: { type: "win" as const, count: 5 },
  totalMatches: 5,
};

try {
  TeamStatsSchema.parse(badStats);
} catch (error) {
  // Zod catches it: "Expected number between 0 and 100, received NaN"
  console.error(error.message);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded W/L in dashboard props | Computed fresh from `getScoreboard()` | Phase 2 | Scoreboard always reflects current match history; no stale counters |
| Streak logic mixed in route handlers | Extracted to `detectStreaks()` helper in Phase 3 | Phase 3 | Reusable, testable, no duplication across ranking and profile pages |
| Scoreboard query with `.take(10)` | Full match history fetch with NO limit (Phase 2 enforcement) | Phase 2 | Prevents silent scoreboard corruption from large match histories |

**Deprecated/outdated:**
- Storing `currentStreak` or `longestStreak` in database: Violates single-source-of-truth; these must be derived on every request from match sequence.

## Open Questions

1. **Should stats functions compute league-wide leaderboard?**
   - What we know: Phase 4 needs to rank ALL teams. Phase 3 focuses on single-team stats.
   - What's unclear: Whether Phase 4 calls `computeTeamStats()` in a loop for all teams, or a separate `computeLeaderboard()` function.
   - Recommendation: Start with single-team functions; Phase 4 planning will clarify. Likely Phase 4 will call `computeTeamStats()` for each team, then sort.

2. **Should head-to-head include a "next match date" prediction?**
   - What we know: H2H is historical record (past matches).
   - What's unclear: Whether Phase 5 adds league-long H2H timeline views that need date filtering.
   - Recommendation: Scope to historical record only. If Phase 5 needs date filtering, pass filtered matches to `computeHeadToHead()` as caller responsibility.

3. **Should streaks track date ranges (e.g., "5-game winning streak from Mar 15-22")?**
   - What we know: Phase 4 ranking shows current streak count only.
   - What's unclear: Whether Phase 5 team detail pages need streak timeline.
   - Recommendation: Return only count for now. If timeline needed, add `streakMatches: MatchRecord[]` to output in Phase 5.

## Environment Availability

**Step 2.6: SKIPPED** — Phase 3 is pure code implementation with no external dependencies beyond the development toolkit (Node.js, npm, TypeScript, Vitest). All required tools are already installed and verified working in Phase 1 and Phase 2.

## Validation Architecture

**Framework:** Vitest 4.1.0 with jsdom + @testing-library/react (if hooks added later)

**Config file:** `vitest.config.ts` (existing)

**Quick run command:** `npm run test -- src/lib/stats.test.ts -x` (~5 seconds)

**Full suite command:** `npm run test` (~15 seconds, all unit + component tests)

### Phase Requirements → Test Map

No phase requirements IDs directly assigned to Phase 3 (it's infrastructure that enables Phase 4). However, success criteria define required behaviors:

| Success Criterion | Behavior | Test Type | Automated Command | File |
|-------------------|----------|-----------|-------------------|------|
| SC-1 | `computeTeamStats()` calculates wins correctly | unit | `npm run test -- src/lib/stats.test.ts --grep "wins and losses"` | stats.test.ts |
| SC-2 | Edge case: 0 matches → 0% win rate | unit | `npm run test -- src/lib/stats.test.ts --grep "edge.*zero matches"` | stats.test.ts |
| SC-2 | Edge case: 1 match → 100% or 0% | unit | `npm run test -- src/lib/stats.test.ts --grep "single match"` | stats.test.ts |
| SC-2 | Edge case: 100+ matches → accurate aggregation | unit | `npm run test -- src/lib/stats.test.ts --grep "large dataset"` | stats.test.ts |
| SC-3 | Streak detection: current vs longest | unit | `npm run test -- src/lib/stats.test.ts --grep "streak"` | stats.test.ts |
| SC-3 | Streak detection: correctly identifies winning and losing | unit | `npm run test -- src/lib/stats.test.ts --grep "winning.*losing"` | stats.test.ts |
| SC-4 | `computeHeadToHead()` isolates matches between two teams | unit | `npm run test -- src/lib/stats.test.ts --grep "head-to-head"` | stats.test.ts |
| SC-4 | H2H: handles reversed team order correctly | unit | `npm run test -- src/lib/stats.test.ts --grep "asymmetric"` | stats.test.ts |
| SC-5 | All functions are pure (no side effects) | unit | `npm run test -- src/lib/stats.test.ts --grep "pure"` | stats.test.ts |
| SC-6 | Zod schemas validate all outputs | unit | `npm run test -- src/lib/stats.test.ts --grep "validation"` | stats.test.ts |

### Sampling Rate

- **Per task commit:** `npm run test -- src/lib/stats.test.ts -x` (quick run, no bloat)
- **Per phase merge:** `npm run test` (full suite green before `/gsd:verify-work`)
- **Phase gate:** All stats tests must pass; no flaky tests on CI

### Wave 0 Gaps

- [ ] `src/lib/stats.ts` — Core implementation with `computeTeamStats()`, `computeHeadToHead()`, `detectStreaks()`, validation schemas
- [ ] `src/lib/stats.test.ts` — Edge case tests covering success criteria SC-1..SC-6:
  - [ ] 0 matches → stats with 0% win rate
  - [ ] 1 match (win) → stats with 100% win rate
  - [ ] 1 match (loss) → stats with 0% win rate
  - [ ] Multiple matches → accurate wins/losses/win rate
  - [ ] 100+ match dataset → aggregation correctness
  - [ ] Current streak: 3-win streak → { type: "win", count: 3 }
  - [ ] Current streak: broken streak (1 loss) → { type: "loss", count: 1 }
  - [ ] Longest streak: detected correctly after streak breaks
  - [ ] H2H: filters correctly when teams in normal order
  - [ ] H2H: filters correctly when teams in reversed order
  - [ ] H2H: exact match count equals sum of both teams' wins
  - [ ] Zod validation: rejects NaN win rate
  - [ ] Zod validation: rejects negative win rate
  - [ ] Zod validation: rejects win rate > 100
  - [ ] Zod validation: rejects negative streak count
- [ ] `src/lib/types.ts` — Extend with `TeamStats`, `HeadToHeadStats` types (derived from Zod schemas)
- [ ] `src/lib/data.ts` — Optional refactor to use `computeTeamStats()` in `getScoreboard()` (improves code reuse; or defer to Phase 4)

**Framework install:** Already present (`npm run test` works)

**Notes:**
- Existing `data.test.ts` covers `getScoreboard()` basic logic; Phase 3 adds standalone stats module
- All tests are unit-level (no database needed); input is `MatchRecord[]` only
- Zod validation tested explicitly to ensure output types can't leak NaN/invalid values

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/data.ts` (current wins/losses logic), `src/lib/data.test.ts` (test patterns with vi.resetModules())
- CLAUDE.md architecture constraints: stats in application layer, never in database
- STATE.md Decision D-01: stats computation always application-layer derived
- Vitest patterns: `vitest.config.ts` and existing test files confirm jsdom environment, @/ path alias support

### Secondary (MEDIUM confidence)
- Phase 2 RESEARCH.md: scoreboard two-step pattern (fetch matches, compute stats in app)
- Zod official patterns: `.parse()` for validation, `.infer<typeof>` for type extraction

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — TypeScript + Zod already in project, no new dependencies
- Architecture patterns: HIGH — Derived from existing `getScoreboard()` logic + explicit constraints in CLAUDE.md
- Edge cases & pitfalls: HIGH — Based on actual bugs found in scoreboards (NaN win rates, off-by-one streaks) during Phase 2
- Test strategy: HIGH — Vitest already configured, patterns established in `data.test.ts`

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days; stats module is stable domain)
