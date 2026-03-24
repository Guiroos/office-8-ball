# Project Research Summary

**Project:** Office 8 Ball — Dynamic Teams Leaderboard & Stats
**Domain:** Office sports tracker (billiards/darts) with team rankings and match history
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

Office 8 Ball is transitioning from a fixed two-team demo app to a **dynamic team-based leaderboard with match rankings and statistics**. The recommended approach is to leverage the existing tech stack (Prisma 6.19.2 + PostgreSQL + Next.js 16) without adding external libraries. All stats (wins, losses, streaks, head-to-head) are derived on-demand from match history — never stored — which keeps the scoreboard authoritative and consistent. The primary technical risk is silent data corruption via misguided query limits or cache invalidation failures, both of which are easily prevented with explicit rules and test coverage. The secondary risk is architectural drift where hardcoded UI constants shadow the dynamic APIs; this is mitigated by completing the dynamic team management work before stats aggregation begins.

The feature set for launch (v1) includes: dynamic leaderboard ranking, match recording, team management (solo and duo types), team detail pages, and basic stats (W/L, win rate %, current streak). Time-based leaderboard filters, head-to-head drill-down, and individual player profiles defer to v1.x after the core loop is validated. The architecture is clean: stats computation is isolated in `lib/stats/` module; API routes are simple aggregation endpoints; components are feature-driven with custom hooks. Dual-mode persistence (in-memory + Prisma) remains supported for testing and local development.

Implementation order is **tightly constrained by dependencies**: Dynamic team APIs must complete first, then scoreboard reactivation, then stats aggregation. Attempting them in parallel risks rework and inconsistent data.

---

## Key Findings

### Recommended Stack

Use the **existing stack with no new dependencies**. Prisma 6.19.2 has all required aggregation, grouping, and sorting capabilities. The work is application-level computation (win rates, streaks, rankings) combined with PostgreSQL indexing for performance.

**Core technologies:**
- **Prisma 6.19.2**: Native `groupBy()`, `aggregate()`, `findMany()` with `orderBy` and `take/skip` eliminate need for external stats libraries. Type-safe with full TypeScript support.
- **PostgreSQL**: B-tree indexes on `winnerId`, `createdAt`, and compound `(winnerId, createdAt)` enable fast leaderboard queries. No separate analytics backend needed.
- **Next.js 16.1.6**: Server-side aggregation at `/api/scoreboard`, `/api/team-stats/:id`, `/api/head-to-head` keeps logic centralized and cacheable.

**Database patterns (no new libraries):**
- **Aggregation via `groupBy()`:** Count wins/losses per team from match history
- **Sorting & pagination:** `findMany()` with `orderBy` and `take/skip` for ranked lists
- **Computed stats in application:** Win rate = (wins / total) × 100; streaks from match sequence scan
- **Raw SQL only if needed:** `prisma.$queryRaw()` for complex head-to-head filters (likely unnecessary for v1)

Performance expectations for office scale (< 5K matches/month):
- Top 10 leaderboard: < 50ms (with indexes)
- One team's stats (100 matches): < 200ms (inline aggregation)
- Head-to-head record: < 100ms (direct filter, no joins)

---

### Expected Features

**Must have (table stakes for v1):**
- **Dynamic Leaderboard/Ranking Page** — Primary feature: all teams sorted by wins, showing W/L, win %, current streak. Must auto-update after match recorded. (Currently missing; hardcoded `frontend`/`backend` constants need replacement.)
- **Match Result Recording** — Simple form: select winner, optional note. Fast path (< 3 clicks from login). (Currently working for fixed teams; requires dynamic team integration.)
- **Dynamic Team Management** — Users create teams (solo or duo type); view team record (W/L, win%, streak). Users can belong to multiple teams. (Partially implemented; Task 7 in progress per CONCERNS.md.)
- **Team Detail Page** — Shows individual team: roster, stats, recent matches, head-to-head records. (New; depends on dynamic teams + stats aggregation.)
- **Basic Statistics Display** — W/L counts, win rate %, current streak, total matches played. Derived from match history, never stored. (Not yet aggregated; awaits stats module.)
- **Match History** — List of past results (date, winner, loser, optional note) for transparency. (Needed; simple view of sorted matches.)

**Should have (v1.x, after validation):**
- **Head-to-Head History** — Filter matches between two teams; show isolated record (e.g., "Frontend 7-3 Backend") and recent match list. (Medium complexity; builds narrative.)
- **Weekly/Monthly Leaderboard Views** — Time-filter toggles to show "who's hot this month" vs. all-time. (Medium complexity; adds engagement.)
- **Individual Player Profiles** — Personal stats (total matches, win% across teams), team memberships, joined date. (Medium complexity; personalizes experience.)

**Defer to v2 or skip (anti-features):**
- **ELO / Dynamic Rating System** — Unnecessary at office scale; W/L is transparent and fair. No user demand yet.
- **Real-Time WebSocket Updates** — Premature optimization; server-side polling or manual refresh sufficient. No infrastructure needed.
- **Tournaments / Brackets** — Explicit non-goal per PROJECT.md; continuous league keeps engagement longer.
- **Multi-Organization Support** — Would require schema redesign; team names assumed unique globally. Defer to v2+ if scaling demands it.
- **Mobile Native App** — Responsive web works on phones; only revisit if mobile usage becomes critical.

**Feature dependencies (build order):**
```
Authentication & Persistence (Foundation)
    └─ Team Management (create/view teams)
        └─ Match Recording (register results)
            └─ Leaderboard Calculation (derive ranking)
                ├─ Win Rate % (stat)
                ├─ Streak Tracking (stat)
                └─ Match History (audit trail)

Leaderboard Calculation
    ├─ Head-to-Head View (filtered ranking)
    ├─ Time-Based Views (weekly/monthly)
    ├─ Team Detail Page (team + stats)
    └─ Individual Profiles (personal stats)
```

See FEATURES.md for full feature matrix, competitor analysis, and UX considerations.

---

### Architecture Approach

Stats are **computed on-demand from match history** — never persisted as `wins` or `currentStreak` columns. This keeps match history authoritative and makes the system self-healing (recompute always resets state).

**Recommended structure:**
```
src/lib/stats/                          # NEW: Stats computation module
├── compute-team-stats.ts               # Aggregate W/L, rate, streaks per team
├── compute-ranking.ts                  # Sort teams by wins; include all stats
├── streak-detector.ts                  # Identify streaks from match sequence
└── head-to-head.ts                     # Isolate and compute H2H metrics

src/app/api/
├── scoreboard/route.ts                 # GET: return all user's teams + aggregated stats
├── head-to-head/route.ts               # GET ?teamAId=x&teamBId=y → H2H metrics
└── team-stats/[id]/route.ts            # GET: team by ID with computed stats

src/components/{ranking,team-detail,head-to-head}/
├── [feature]/[component].tsx           # Feature-driven UI components
└── use-*-data.ts                       # Custom hooks encapsulating API calls
```

**Key patterns:**
1. **On-demand derivation:** Fetch all matches once per request; compute stats in memory. Avoids N+1 queries. Scales fine to 10K matches.
2. **Aggregation as reduce + sort:** Map each team to `TeamStats`, sort by wins DESC. Flexible re-sorting without re-query.
3. **Head-to-head as filtered subset:** Filter matches for team pair; compute isolated W/L and win rate.
4. **Type-safe API responses:** Every route returns `NextResponse.json<TypeName>()` for compile-time consistency.

**Data flow example (Scoreboard Load):**
```
User opens Dashboard
    ↓
useScoreboardData() hook
    ↓
GET /api/scoreboard
    ↓
listUserTeams(userId) → teams where user is member
    ↓
listMatches(userId) → all matches for user's teams
    ↓
computeRanking(matches, teams) in memory
    ├─ computeTeamStats() for each team
    │   ├─ W/L aggregation
    │   └─ streak detection
    ├─ sort by wins DESC
    └─ return ranked array
    ↓
Return ScoreboardRecord { teams: [...], lastUpdated }
    ↓
Dashboard renders ranking
```

See ARCHITECTURE.md for full component responsibilities, scaling strategies, and integration boundaries.

---

### Critical Pitfalls

Research identified 8 pitfalls with clear prevention strategies:

1. **Silent Scoreboard Corruption via Query Limits**
   - **What:** Adding `LIMIT` or `take()` to scoreboard query causes silent data corruption. Wins, streaks, and rankings are based on incomplete history. Bug doesn't fail loudly — just wrong numbers.
   - **Prevention:** Enforce rule in code with comment. Add unit tests with 100+ matches. E2E tests verify scoreboard accuracy. Code review checklist flags scoreboard query changes.

2. **Hardcoded UI Disconnected from Dynamic APIs**
   - **What:** Dashboard imports `TEAMS` constants; when `/api/teams` API is added, UI doesn't use it. New teams exist in DB but invisible in UI. "I created a team but it's not showing" confusion.
   - **Prevention:** Delete hardcoded constants immediately after API is added. Don't have both. Code review flags any component importing team constants alongside API data.

3. **Derived Stats Cached Without Revalidation**
   - **What:** Ranking page cached in Next.js ISR; match created but cache not invalidated. Users see yesterday's rankings for hours. Inconsistent UX across app.
   - **Prevention:** Call `revalidateTag('scoreboard')` immediately after match creation. Use on-demand revalidation, not ISR. E2E tests verify: create match → fetch ranking API → ranking includes new match.

4. **Inconsistent Team Data Between Constants and Database**
   - **What:** Teams defined in `src/lib/constants.ts` (in-memory fallback) and Prisma `teams` table (production). Changes to one path not reflected in other. "Works locally but breaks in prod" or vice versa.
   - **Prevention:** Treat constants as source of truth; seed DB from constants. Dual-mode tests verify: same teams in both paths. Schema changes require synchronized constant + seed updates.

5. **Missing Head-to-Head Isolation**
   - **What:** H2H filter is wrong (off-by-one, case sensitivity, type mismatch). Two teams show no history together even though matches exist. Or history duplicated across team pairs.
   - **Prevention:** Explicit test cases for: Team A vs B (both directions), Team A vs Team A (empty), non-existent IDs. Validate H2H results are subset of overall history.

6. **Migration Safety — Schema & Data Divergence**
   - **What:** Prisma migration adds column; seed data not updated. New instances fail to seed because seed references removed fields. Or schema change requires backfill, but migration doesn't include it.
   - **Prevention:** Migration checklist: (1) Prisma migration, (2) seed updated, (3) backfill if needed, (4) test migrate + seed end-to-end. Test against both fresh DB and existing data.

7. **Win Rate & Streak Calculations Off by One**
   - **What:** Win rate `0 / 0` = NaN. Streak calculation off by one at boundaries (1 win shows as 2; 3 consecutive wins shows as 2). Edge cases only.
   - **Prevention:** Explicit edge case tests: 0 matches, 1 match, NaN scenarios. Type safety ensures stats fields are numbers, never null. Zod validates API responses (winRate in [0,1], currentStreak >= 0).

8. **Race Condition on Concurrent Match Submissions**
   - **What:** Two users submit matches simultaneously; both read current team state, both write back. Second write overwrites first. One match lost in aggregation.
   - **Prevention:** Use Prisma transactions for all match creation + team updates. In-memory mode: add mutex/queue to serialize writes. E2E test: simulate concurrent POSTs; verify all counted correctly.

See PITFALLS.md for detailed recovery strategies, technical debt patterns, and full checklist.

---

## Implications for Roadmap

Research strongly constrains the phase structure. **Phases are tightly ordered by dependencies**: dynamic teams first, scoreboard second, stats third. Attempting them in parallel causes rework and inconsistent data.

### Phase 1: Complete Dynamic Team Management
**Rationale:** Team APIs must exist before stats aggregation can work. Scoreboard, match recording, and ranking all depend on dynamic teams. This is the foundation.

**Delivers:**
- `GET /api/teams` — list all teams (or user's teams)
- `GET /api/teams/:id` — fetch single team with stats skeleton
- `POST /api/teams` — create team (solo or duo type)
- `PATCH /api/teams/:id` — update team name/description
- Complete team member management (add/remove users)
- Verify dual-mode (in-memory + Prisma) still works
- Verify in-memory constants stay synchronized

**Avoids pitfalls:**
- Pitfall 2: Removes all hardcoded UI constants before stats are added; prevents "created a team but UI doesn't show it"
- Pitfall 4: Validates constants and DB stay in sync; dual-mode tests catch divergence

**When done:**
- All team CRUD works
- Dashboard can fetch teams from API instead of constants
- Match recording form can list dynamic teams as choices
- Ready for scoreboard reactivation

---

### Phase 2: Reactivate Scoreboard & Match Recording
**Rationale:** Scoreboard API is the core of the app — it aggregates user's teams and their match history. This phase reconnects the dashboard to dynamic teams and ensures match recording works with new teams.

**Delivers:**
- Reactivate `GET /api/scoreboard` — returns all user's teams + combined match history
- Update dashboard to call `/api/scoreboard` instead of hardcoded constants
- Update match recording form to use dynamic teams
- Add database indexes on `winnerId`, `createdAt`, `(winnerId, createdAt)` for performance
- Implement `listMatches(userId)` function (may exist; verify works with dynamic teams)
- E2E test with 100+ matches to verify correctness

**Avoids pitfalls:**
- Pitfall 1: Establishes "no limits on scoreboard" rule; adds test coverage; documents in comments
- Pitfall 2: Removes all hardcoded team constants from components; only dynamic API calls remain
- Pitfall 8: Uses Prisma transactions for match creation; ensures concurrency safety

**When done:**
- Dashboard shows correct ranking derived from all user's team matches
- Match recording creates records that appear in scoreboard
- Performance is acceptable (< 500ms for typical office scale)
- Ready for stats aggregation module

---

### Phase 3: Implement Stats Aggregation Module
**Rationale:** Extract stats computation into testable, reusable module. Build `lib/stats/` with pure functions. This is the most complex computational work; isolation makes it testable and maintainable.

**Delivers:**
- `src/lib/stats/compute-team-stats.ts` — W/L count, win rate %, current & longest streak per team
- `src/lib/stats/compute-ranking.ts` — sort all teams by wins; include all stats
- `src/lib/stats/streak-detector.ts` — identify winning/losing streaks from match sequence
- `src/lib/stats/head-to-head.ts` — filter matches between team pair; compute isolated H2H metrics
- Updated `src/lib/types.ts` with `TeamStats`, `ScoreboardRecord`, `RankingEntry`, `HeadToHeadStats`
- Full unit test coverage (edge cases: 0 matches, 1 match, 100+ matches, NaN handling)
- Zod validation on all output types

**Avoids pitfalls:**
- Pitfall 7: Edge case tests for 0/1 matches, NaN, division by zero, off-by-one streaks
- Pitfall 5: H2H filter tests verify result is subset of all matches; swapped teams return same result
- Pitfall 3: Cache invalidation pattern ready (will implement in Phase 4)

**When done:**
- Stats logic is testable without database
- Functions are pure and reusable across multiple API routes
- Ready for API route implementation

---

### Phase 4: Build Ranking Page & Team Detail Pages
**Rationale:** Wire stats module to API routes and UI components. Implement caching with revalidation. This phase connects computation to presentation.

**Delivers:**
- `src/app/api/scoreboard/route.ts` — uses stats module; returns ranked teams
- `src/app/api/team-stats/[id]/route.ts` — returns single team's stats
- `src/app/api/head-to-head/route.ts` — takes `?teamAId=x&teamBId=y`; returns H2H metrics
- `src/components/ranking/ranking-table.tsx` — displays teams ranked by wins
- `src/components/team-detail/team-detail-page.tsx` — shows team: roster, stats, recent matches
- Cache revalidation on match creation: `revalidateTag('scoreboard')` + `revalidatePath()`
- E2E test: create match → verify ranking updates within 1 second

**Avoids pitfalls:**
- Pitfall 3: Cache invalidation implemented immediately; tested in E2E
- Pitfall 1: Scoreboard uses unrestricted match fetch (no limits)

**When done:**
- Ranking page displays correct, current standings
- Team detail pages show per-team stats and roster
- Match recording immediately updates all views
- Ready for polish and v1.x differentiators

---

### Phase 5: Add Head-to-Head & Time-Based Views (v1.x)
**Rationale:** Defer to after core is stable. Once users engage with leaderboard, these features add value. Lower priority, higher complexity.

**Delivers:**
- `src/components/head-to-head/h2h-view.tsx` — navigable via `/head-to-head?teamA=x&teamB=y`
- Time-based filters on ranking page: All-Time, This Month, This Week
- Computed via date-filtered match queries (no schema change; filter in application)

**Avoids pitfalls:**
- Pitfall 6: No schema migration needed for time filters; computed in stats functions

**When done:**
- Users can drill into head-to-head rivalry history
- Leaderboard shows time-scoped standings
- App feels complete for office use case

---

### Phase 6: Individual Player Profiles (v1.x)
**Rationale:** Personalization feature; low priority. Build after core features are stable and user feedback indicates value.

**Delivers:**
- `/user/profile` — personal stats, team memberships, joined date
- User-specific stats aggregation (wins/losses across all teams)

---

### Phase Ordering Rationale

**Why this order:**
1. **Teams first:** All downstream features depend on dynamic teams existing. Enables scoreboard, match recording, and stats aggregation. Separating team creation from other work reduces scope per phase.
2. **Scoreboard second:** Core of app; validates team APIs work end-to-end. Establishes "no limits" rule before stats code is added. Mitigates Pitfall 1 early.
3. **Stats third:** Most complex computational work; benefits from being isolated in module. Tests are faster without API layer. Stats functions reused across multiple routes.
4. **Ranking & Details fourth:** Connects stats to UI. Caching patterns established. All wiring tested. Phase is mostly integration, not algorithmic risk.
5. **Differentiators & polish fifth:** H2H, time filters, profiles add value after core validated. Lower risk; can defer without breaking MVP.

**Why this grouping:**
- Phases 1-4 deliver MVP: working dynamic leaderboard with accurate stats
- Phases 5-6 deliver competitive features; can defer if schedule tight
- Each phase has clear dependencies and exit criteria
- Each phase is testable in isolation (Phase 3 has no API dependency; Phase 4 integrates everything)

---

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 1 (Dynamic Team Management):** Team member model is partially implemented. Planning must verify existing schema supports solo vs. duo types correctly. Risk: schema mismatch between team creation and match recording. Mitigation: validate schema in kickoff; update if needed.
- **Phase 3 (Stats Module):** Streak detection edge cases complex (ignore opponent changes? or track). Planning must clarify business logic. Research provides pattern; implementation must match office context expectations.

**Phases with standard patterns (skip research-phase):**
- **Phase 2 (Scoreboard reactivation):** Pattern well-established in codebase. No new research needed.
- **Phase 4 (Ranking page):** Next.js caching/revalidation fully documented. Standard patterns.
- **Phase 5-6:** Standard CRUD + filtering patterns; low research risk.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Prisma 6.19.2 + PostgreSQL fully document aggregation patterns. No external libraries needed. Verified with official Prisma docs. |
| **Features** | HIGH | Feature list derived from competitor analysis (PlayPass, RackEmApp, Slack leaderboard apps) + FEATURES.md research. MVP is clear; v1.x roadmap grounded in user value. |
| **Architecture** | HIGH | Architecture patterns well-established in codebase (dual-mode persistence, on-demand derivation). Scaling considerations researched. Component boundaries clear. |
| **Pitfalls** | HIGH | 8 pitfalls extracted from CONCERNS.md (project-specific) + ecosystem patterns. Prevention strategies include code examples and test patterns. Recovery costs identified. |

**Overall confidence:** HIGH

Research is comprehensive, grounded in official documentation, codebase analysis, and competitor benchmarking. The main uncertainty is team member model details (solo vs. duo handling in match records) — this must be clarified during Phase 1 planning. No blockers identified; all phases have clear exit criteria.

---

### Gaps to Address

1. **Team member model clarification:** Does a "duo" team mean 2 or more players? Can a user belong to multiple teams and record matches on behalf of different teams? Plan Phase 1 to answer this explicitly and update schema if needed.
2. **Match loser tracking:** Current schema only tracks `winnerId`. Head-to-head queries require knowing both teams in each match. Phase 1 planning must decide: extend Match schema to include loser/opponent, or infer from match context (e.g., duo matches: if Team A won, Team B lost).
3. **Streak business logic:** Should a streak end only on loss, or also on opponent change? E.g., Team A beats Team B 3 times, then Team C once. Is that "3-game streak" or separate streaks? Phase 3 planning must clarify.
4. **In-memory mode limits:** Local dev with 10,000+ matches in memory becomes slow. Phase 1 should cap in-memory state or add warnings. Not a blocker for MVP, but affects developer experience.

All gaps are resolvable during phase kickoff without major architecture changes. No fundamental blockers to implementation.

---

## Sources

### Primary (Official Documentation)
- [Prisma Aggregation & Grouping Docs](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing) — groupBy(), aggregate(), findMany() patterns
- [Prisma Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) — Race condition prevention
- [Next.js Caching & Revalidation](https://nextjs.org/docs/app/getting-started/caching-and-revalidating) — Tag-based cache invalidation

### Secondary (Codebase Analysis)
- `.planning/codebase/CONCERNS.md` — Active incomplete work, schema review, invariants
- `CLAUDE.md` — Dual-mode persistence constraints, architecture decisions, safe-change rules
- `src/lib/data.ts` — Existing data layer patterns, in-memory fallback
- `prisma/schema.prisma` — Current schema, team/match/user model

### Tertiary (Ecosystem Research)
- PlayPass, RackEmApp, Leaderboard for Slack — Feature/UX benchmarking
- PostgreSQL indexing best practices, sports rating algorithms — Performance & algorithm reference

---

*Research completed: 2026-03-23*
*Ready for roadmap creation: yes*
