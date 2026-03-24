# Pitfalls Research: Office Billiards Tracker with Ranking & Stats

**Domain:** Sports tracker / team leaderboard system with match history aggregation
**Researched:** 2026-03-23
**Confidence:** HIGH (project-specific concerns from CONCERNS.md) + MEDIUM (ecosystem patterns from WebSearch)

## Critical Pitfalls

### Pitfall 1: Silent Scoreboard Corruption via Query Limits

**What goes wrong:**
Adding a `LIMIT` or `take()` clause to the scoreboard query causes silent data corruption. The aggregation returns partial matches — `wins`, `currentStreak`, and `leadBy` are computed incorrectly because they're based on incomplete history. Users see wrong rankings until the bug is caught in user complaints.

**Why it happens:**
Performance optimization instinct is strong. At scale, fetching all matches seems expensive. Developers add pagination, forget the scoreboard derivation rule, and the bug doesn't fail loudly (no error, just wrong numbers).

**How to avoid:**
- **Rule in code:** Add a comment and lint rule that forbids `take()/limit()` on scoreboard queries:
  ```typescript
  // CRITICAL: getScoreboard() must fetch ALL matches.
  // No pagination, no limits. Scoreboard is derived from complete history.
  // Adding take/limit silently corrupts wins, leadBy, currentStreak.
  const allMatches = await prisma.match.findMany({
    // NO take() here
  });
  ```
- **Test coverage:** Unit tests must verify scoreboard accuracy with >100 matches; E2E tests must verify it doesn't break when historical matches exist.
- **Code review checklist:** Any change to scoreboard query must be flagged for double verification.

**Warning signs:**
- Wins/loss counts don't match manual count of matches
- Streaks reset unexpectedly between page reloads
- `leadBy` is negative when it should be positive
- Performance complaints correlate with leaderboard query adding pagination

**Phase to address:**
Phase 2 (Scoreboard reactivation + ranking API). Establish the rule and test pattern *before* implementing stats aggregation.

---

### Pitfall 2: Hardcoded UI Disconnected from Dynamic Data APIs

**What goes wrong:**
Dashboard or ranking page is built with hardcoded team lists (e.g., `frontend` and `backend` teams baked into the UI component). When new teams are created via `/api/teams`, the UI doesn't show them. Teams exist in the database but are invisible in the dashboard. This creates UX friction and support confusion: "I created a team but it's not showing up."

**Why it happens:**
MVP iterations hardcode UI to unblock feature work. When dynamic APIs are added later, the UI layer is forgotten — developers update the data layer but don't connect it to the view. The old hardcoded constant is still there, shadowing the API.

**How to avoid:**
- **Delete hardcoded data immediately after adding the API:** Don't have both. If `frontend`/`backend` constants exist AND `/api/teams` exists, the code is in a confusing state.
- **Route/component checklist:** Every component that displays teams must fetch from `/api/teams` or be explicitly documented as a static fixture (e.g., a demo page).
- **Code review gate:** Flag any component that imports team constants and also has team data as props or state.
- **Search for TODOs during merge:** The CONCERNS.md already flags this (`// TODO(Task 5+): replace with dynamic teams`). Don't let TODOs survive into production.

**Warning signs:**
- UI shows the same 2 teams even after creating 5 new ones
- Sidebar shows different teams than the dashboard
- Team creation form succeeds (API 200) but team doesn't appear
- Comments in code say "TODO: remove hardcoded teams"

**Phase to address:**
Phase 2 (Dashboard reconnection to dynamic teams). Hardcoded UI must be replaced before stats are added, or stats will also be wrong.

---

### Pitfall 3: Derived Stats Cached Without Revalidation

**What goes wrong:**
Ranking page caches the scoreboard (wins, losses, streaks) in Next.js with ISR or static generation. A match is recorded, the database is updated, but the cache isn't invalidated. Users see yesterday's rankings for hours. On-demand queries from one user return fresh data while cached pages served to others show stale data — inconsistent UX across the app.

**Why it happens:**
Caching is good for performance; revalidation is easy to forget. Developers set `revalidate: 3600` (1 hour) without connecting match creation to cache invalidation. They test locally (no cache) and miss the bug in production.

**How to avoid:**
- **Revalidate on mutation:** When `/api/matches` POST succeeds, call `revalidateTag('scoreboard')` or `revalidatePath('/ranking')` immediately.
  ```typescript
  // After match creation
  revalidateTag('scoreboard');
  revalidatePath('/(authenticated)/ranking');
  revalidatePath('/(authenticated)/dashboard');
  ```
- **Use on-demand revalidation, not ISR:** ISR hides revalidation bugs because stale content is served by time, not by explicit invalidation.
- **Test cache behavior:** E2E tests must verify: (1) create match, (2) fetch ranking API, (3) ranking includes new match.

**Warning signs:**
- Ranking numbers don't change after creating a match (but API returns fresh data)
- Refresh the page and the ranking updates
- Browser cache control headers are wrong (expires far in future)
- No `revalidateTag` calls near POST endpoints

**Phase to address:**
Phase 3 (Stats aggregation & ranking display). Establish revalidation pattern before caching any ranking data.

---

### Pitfall 4: Inconsistent Team Data Between Constants and Database

**What goes wrong:**
Teams are defined in two places: `src/lib/constants.ts` (in-memory fallback for tests and local dev) and the Prisma `teams` table (production). When a team ID or structure changes, one path is updated but not the other. In-memory tests pass but production fails silently — or vice versa. The app "works locally but breaks in prod."

**Why it happens:**
The project has dual-mode persistence (in-memory + Postgres). Developers change the schema and seed but forget to update constants — or vice versa. The mismatch isn't caught until both paths are used (local dev + e2e tests with real DB).

**How to avoid:**
- **Single source of truth:** Team metadata (IDs, names) should live in constants and seed the DB. If constants must match the DB, document this explicitly.
  ```typescript
  // src/lib/constants.ts
  export const TEAMS = [
    { id: 'frontend', name: 'Frontend Team', ... },
    { id: 'backend', name: 'Backend Team', ... },
  ];
  // prisma/seed.mjs must seed exactly these teams
  ```
- **Validation in tests:** Unit tests must verify: (1) constants are seeded into DB, (2) in-memory mode uses constants, (3) both paths return the same team list.
- **Enforce dual-mode testing:** Every team-related test must run in both modes (in-memory and Prisma). This catches divergence immediately.

**Warning signs:**
- Tests pass locally (in-memory) but fail in CI (with Postgres)
- Team validation rejects a valid ID in production but accepts it in local dev
- "Looks done" but e2e test fails with team not found
- Constants and seed are out of sync (spotted in code review)

**Phase to address:**
Phase 1-2 (Dynamic teams setup). Establish the sync rule and dual-mode validation *before* adding new team types (solo/duo).

---

### Pitfall 5: Missing Head-to-Head Isolation

**What goes wrong:**
Head-to-head records between two teams are computed by filtering the match history to matches between Team A and Team B. If the filter is wrong (e.g., one team's ID is mismatched), the result is incomplete or wrong. Two teams show no history together even though matches exist. Or history is duplicated across multiple team pairs because the filter is too broad.

**Why it happens:**
Team ID handling is error-prone when there are multiple team types (solo, duo). Match records have `team_a_id` and `team_b_id`; filtering for "Team X vs Team Y" requires strict equality checks. Off-by-one errors or case sensitivity bugs silently break the filter.

**How to avoid:**
- **Explicit test cases:** H2H must have tests for:
  - Team A vs Team B (both directions; should return same matches)
  - Team A vs Team A (should return empty or error, depending on rules)
  - Non-existent team IDs (should return empty, not error)
  - Multiple matches between same teams (all must be included)
- **Validation:** Assert that h2h results are a subset of overall history:
  ```typescript
  const allMatches = await getScoreboard();
  const h2h = await getHeadToHead(teamA, teamB);
  assert(h2h.length <= allMatches.length);
  ```

**Warning signs:**
- H2H page shows 0 matches even though 5 matches between teams exist
- Swapping team order (A vs B vs B vs A) returns different results
- Team record shows 10 wins but H2H with specific opponent shows 15 matches (more than total)
- H2H API returns matches that don't involve one or both teams

**Phase to address:**
Phase 4 (Head-to-head feature). Establish filter logic and test cases *before* shipping the feature.

---

### Pitfall 6: Migration Safety — Schema & Data Divergence

**What goes wrong:**
A Prisma migration adds a new column or changes a field type. The migration runs in dev, but the seed data isn't updated. New instances fail to seed because the old seed script references removed fields. Or a change to team structure (e.g., adding a `type` field to distinguish solo/duo) requires backfilling existing matches, but the migration doesn't include the backfill — old matches have NULL type, breaking queries.

**Why it happens:**
Prisma migrations and seed scripts are separate. A developer creates a migration (schema change) but forgets to update the seed data or backfill script. The migration test passes in isolation, but the full dev setup (migrate + seed) fails.

**How to avoid:**
- **Migration checklist:** Any schema change must include:
  1. Prisma migration file
  2. Seed data updated or backfill query
  3. Test that verifies migrate + seed works end-to-end
  4. Rollback plan (if the migration breaks, what happens?)
- **Dual-mode migration test:** Migrations must be tested against both a fresh DB and one with existing data.
  ```bash
  npm run prisma:migrate          # Fresh DB
  npm run prisma:seed              # Seed
  npm run test:e2e                 # Should pass
  ```
- **Breaking change docs:** If a migration removes a column or changes a field name, document the breaking change and any manual steps required.

**Warning signs:**
- `npm run prisma:seed` fails after running migrations
- New matches can't be created because a required field is missing
- Old matches render incorrectly (show NULL or unexpected values)
- Rollback instruction is unclear or missing

**Phase to address:**
Phase 2+ (Any feature adding new fields or team types). Establish migration + seed procedure at the start of each phase.

---

### Pitfall 7: Win Rate & Streak Calculations Off by One

**What goes wrong:**
Win rate is calculated as `wins / (wins + losses)`. If a team has 1 win and 0 losses, win rate is 100% — correct. But if a team has 0 wins and 0 losses (no matches), the formula is `0 / 0`, resulting in NaN, Infinity, or division-by-zero errors. Currentstreak is calculated as a sequence of consecutive wins; if the sequence calculation is off by one, a team with 3 consecutive wins shows 2 (or 4). The bug is subtle because it only manifests at edge cases.

**Why it happens:**
Stats calculations are in JavaScript/SQL. Off-by-one errors are easy in loops or boundary checks. Developers test the happy path (many matches) and miss the edge case (zero or one match).

**How to avoid:**
- **Explicit edge case tests:**
  ```typescript
  test('win rate with 0 matches', () => {
    const stats = getStats(teamWithNoMatches);
    expect(stats.winRate).toBe(0);  // or NaN? decide and enforce
  });
  test('streak with exactly 1 match', () => {
    const stats = getStats(teamWithOneMatch);
    expect(stats.currentStreak).toBe(1);
  });
  ```
- **Type safety:** Use TypeScript to ensure stats fields are numbers, not null or string:
  ```typescript
  type TeamStats = {
    wins: number;
    losses: number;
    winRate: number; // 0 to 1, never NaN
    currentStreak: number; // >= 0
  };
  ```
- **Zod validation:** Validate API responses to catch NaN/Infinity:
  ```typescript
  const statsSchema = z.object({
    winRate: z.number().min(0).max(1),
    currentStreak: z.number().min(0),
  });
  ```

**Warning signs:**
- Win rate shows "NaN%" on the ranking page
- Streak jumps between 2 and 4 inconsistently
- New teams (0 matches) crash the ranking page
- Stats API returns 500 for certain teams

**Phase to address:**
Phase 3 (Stats aggregation). Implement stats calculation with full edge case coverage before shipping.

---

### Pitfall 8: Race Condition on Concurrent Match Submissions

**What goes wrong:**
Two users submit match results simultaneously (both hitting `/api/matches` POST at the same time). Both requests read the current team state, increment wins, and write back. The second write overwrites the first one — one win is lost. The match history table has both records (correct), but the scoreboard aggregation includes both, yet one team's wins counter is only +1 instead of +2.

**Why it happens:**
API handlers in Next.js are stateless; concurrent requests don't serialize by default. Without transaction or locking, concurrent writes can race. In-memory mode (using a global object) is even more vulnerable than Prisma (which has transaction support, but it must be used).

**How to avoid:**
- **Use Prisma transactions:** All match creation + team updates must be atomic:
  ```typescript
  await prisma.$transaction(async (tx) => {
    const match = await tx.match.create({ data: { ... } });
    // Team updates happen in same transaction
    await tx.team.update(...);
  });
  ```
- **In-memory mode:** Add a mutex or queue to serialize writes:
  ```typescript
  const matchQueue = [];
  async function addMatch(data) {
    await writeLock.acquire();
    try {
      // Perform mutation
    } finally {
      writeLock.release();
    }
  }
  ```
- **E2E test:** Simulate concurrent submissions:
  ```typescript
  test('concurrent match submissions', async () => {
    const team = await createTeam();
    await Promise.all([
      fetch('/api/matches', { ... }),
      fetch('/api/matches', { ... }),
    ]);
    const score = await fetch('/api/scoreboard');
    expect(score.team.wins).toBe(2);
  });
  ```

**Warning signs:**
- Scoreboard wins don't match match history count
- Random test failures that pass on re-run (flaky, indicates race condition)
- Concurrent E2E tests fail inconsistently
- Production logs show mismatched win counts (detected via audit query)

**Phase to address:**
Phase 2+ (Match creation, especially when scaling to multiple users). Use transactions from day 1.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode team IDs in UI | Unblocks feature dev, no API needed yet | Disconnected UI when API is added; future devs forget to remove | Phase 1 MVP only; must be removed before Phase 2 |
| Skip revalidation on POST | API fast, no tag bookkeeping | Stale cache, user confusion, inconsistent data | Never; cost is bugs in production |
| Store computed stats in DB | Scoreboard query is faster | Stats diverge from history; "source of truth" problem | Never for read-only stats; only acceptable for audit log |
| Loose team ID validation | Accept any string as team ID | Typos create ghost teams; matches link to wrong teams | Never; validate against constants or DB from day 1 |
| Pagination on match history | Query faster for big tables | Silent scoreboard corruption | Never; use indexes instead of pagination |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Prisma + In-Memory** | Using Prisma features (transactions, aggregations) that don't exist in in-memory mode | Check `hasDatabaseUrl()` before using advanced Prisma features; fallback to simpler logic in memory mode |
| **Teams API → Dashboard** | Dashboard imports old team constants; API data is fetched but ignored | Delete constants after API is added; dashboard consumes API data exclusively |
| **Match POST → Scoreboard Cache** | Match is created but cache isn't invalidated | Call `revalidateTag('scoreboard')` immediately after `create()` |
| **Schema Migration → Seed** | Migration changes team fields; seed still uses old field names | Update seed to match new schema; test migrate + seed together |
| **H2H Filter → Match History** | H2H query uses wrong team ID comparison (case sensitivity, type mismatch) | Use strict equality; test H2H result is subset of all matches |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Unindexed scoreboard query** | Dashboard loads slow; query takes 5+ seconds | Add DB indexes on `winner_team_id`, `team_a_id`, `team_b_id`, `played_at` | 1000+ matches |
| **N+1 queries in ranking page** | Fetching rankings loads once, then queries team details once per row | Use join or batch query; fetch all teams at once | 20+ teams on ranking page |
| **Revalidating too frequently** | Tag-based revalidation regenerates page every request, defeating cache | Revalidate only on actual data change (POST/PATCH), not on every GET | Production with high traffic |
| **In-memory mode without limits** | Local dev accumulates matches in RAM; restart needed | Clear state between test runs; cap in-memory data for safety | 10,000+ matches in memory |
| **No pagination for match history** | H2H page loads all 500 matches at once; page is slow | Add pagination (or lazy load) if history is large; scoreboard stays unpaginated | 1000+ matches between two teams |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Team ownership not validated** | User A creates a match for Team B, then User B's team record is modified without permission | Verify user is a member of both teams in the match; check `TeamMember` relation |
| **Missing auth on stats endpoints** | `/api/scoreboard` or `/api/ranking` is public; sensitive team data exposed | Require session on all APIs; return only data user is authorized to see |
| **Unvalidated team IDs in input** | Attacker submits team ID "'; DROP TABLE--" | Validate team IDs against constants or DB; use parameterized queries (Prisma handles this) |
| **Modification of historical matches** | User edits a match from 2 weeks ago, scoreboard changes retroactively | Disable match editing after creation; if needed, only allow deletion with audit trail |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Stale ranking after creating team** | User creates team, page doesn't update; "Did it work?" confusion | Revalidate immediately on POST; show toast "Team created"; refresh table |
| **Confusing win rate display** | Shows "NaN%" for new teams; shows "50%" for 1 win, 1 loss (looks wrong) | Show "0 matches" state explicitly; format percentages to 1 decimal place |
| **No empty state for ranking** | New user sees blank page; thinks feature is broken | Show "No teams yet. Create one to get started." with action button |
| **Unclear which team is "winning"** | Ranking shows teams by name; unclear which is ahead | Sort by wins DESC; show "lead by X" or progress bars |
| **H2H history is too compact** | H2H page shows tiny list; hard to see trends | Add date, score, or "winning streak" badges; make each row visible |

---

## "Looks Done But Isn't" Checklist

- [ ] **Scoreboard aggregation:** Verify tested with 100+ matches; pagination is disabled; edge cases (0 matches, 1 match) work.
- [ ] **Rankings page:** Verify teams are fetched from API (not hardcoded); cache is revalidated on match POST; empty state is shown.
- [ ] **Team creation:** Verify new teams appear in dashboard immediately; in-memory mode still works; dual-mode tests pass.
- [ ] **Head-to-head:** Verify filter logic is tested; result is subset of all matches; swapped team order returns same result.
- [ ] **Stats calculations:** Verify win rate handles 0 matches (shows 0, not NaN); streaks are off-by-one tested; Zod validates output.
- [ ] **Migration + seed:** Verify `npm run prisma:migrate && npm run prisma:seed` runs without error; old data backfill is included if schema changed.
- [ ] **Concurrency safety:** Verify matches created in same millisecond don't lose data; transaction or lock is in place.
- [ ] **Revalidation:** Verify POST match → scoreboard is fresh on next GET; cache tags are set and cleared correctly.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Corrupted scoreboard (missing wins)** | MEDIUM | (1) Audit query: compare match count vs. scoreboard wins, (2) Identify affected teams, (3) Regenerate scoreboard from match history, (4) Run data integrity test |
| **Stale cache (users see old rankings)** | LOW | (1) Clear cache tag in Vercel dashboard, (2) Revalidate affected pages, (3) Verify fresh data serves within 1 minute |
| **Hardcoded UI not showing new teams** | MEDIUM | (1) Remove hardcoded constants from component, (2) Add API fetch, (3) Test in staging, (4) Deploy new code |
| **Schema/seed mismatch (migration broken)** | HIGH | (1) Rollback migration, (2) Fix seed script, (3) Create new migration with correct backfill, (4) Test migrate + seed again, (5) Re-deploy |
| **Lost match due to race condition** | HIGH | (1) Detect via audit log (match in history, but not in scoreboard), (2) Recompute scoreboard from history, (3) Implement transaction if not already done |
| **H2H filter returning wrong data** | LOW | (1) Add debug logging to filter logic, (2) Verify team IDs match exactly, (3) Test edge cases (0 matches, same team twice), (4) Deploy fix |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Silent scoreboard corruption | Phase 2 (Scoreboard reactivation) | E2E test with 100+ matches; verify wins match history |
| Hardcoded UI disconnected from API | Phase 2 (Dashboard reconnection) | Code review: no `TEAMS` constant imported in components; all teams from API |
| Stale cache without revalidation | Phase 3 (Ranking display + caching) | E2E: create match → rankings update within 1 second |
| Team constant/DB divergence | Phase 1-2 (Dynamic teams setup) | Dual-mode test: same teams in in-memory and Prisma |
| H2H filter isolation bugs | Phase 4 (Head-to-head) | Unit test: H2H subset of all matches; swapped teams same result |
| Migration/seed mismatch | Phase 2+ (Any schema change) | Test command: `migrate && seed` runs without error |
| Streak/win rate edge cases | Phase 3 (Stats aggregation) | Unit tests: 0 matches, 1 match, NaN cases all handled |
| Concurrent write race condition | Phase 2+ (Match creation) | E2E test: 10 concurrent match POSTs; all counted correctly |

---

## Sources

**Project-specific concerns:**
- `/home/guiroos/Documentos/Projects/office-8-ball/.planning/codebase/CONCERNS.md` — High-impact invariants and active incomplete work
- `/home/guiroos/Documentos/Projects/office-8-ball/CLAUDE.md` — Dual-mode architecture constraint

**Ecosystem research:**
- [Getting Started: Caching | Next.js](https://nextjs.org/docs/app/getting-started/caching-and-revalidating) — Tag-based cache invalidation strategy
- [Transactions and batch queries | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) — Race condition prevention via transactions
- [State vs. Migration-Based Database Deployments | Liquibase](https://www.liquibase.com/blog/database-deployments-state-database-migration) — Migration safety patterns
- [How to Build Metric Aggregation Strategies | OneUptime](https://oneuptime.com/blog/post/2026-01-30-metric-aggregation-strategies/view) — Stats aggregation patterns and pitfalls

---

*Pitfalls research for: Office Billiards Tracker with Dynamic Teams and Rankings*
*Researched: 2026-03-23*
