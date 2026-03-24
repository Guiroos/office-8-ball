# Architecture Research: Ranking & Stats for Office 8 Ball

**Domain:** Match-based ranking system with derived stats aggregation and head-to-head tracking
**Researched:** 2026-03-23
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                         UI & Presentation Layer                        │
├────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │  Dashboard      │  │  Rankings Page   │  │  Head-to-Head View  │   │
│  │  (team stats)   │  │  (sorted teams)  │  │  (match history)    │   │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬──────────┘   │
│           │                    │                       │               │
├───────────┴────────────────────┴───────────────────────┴───────────────┤
│                           API Layer (Routing)                          │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  GET /api/       │  │  GET /api/       │  │  GET /api/           │ │
│  │  scoreboard      │  │  head-to-head    │  │  team-stats/:id      │ │
│  │                  │  │                  │  │                      │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘ │
│           │                    │                       │               │
├───────────┴────────────────────┴───────────────────────┴───────────────┤
│                      Aggregation & Computation Layer                   │
├────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Stats Computation Module                                       │   │
│  │  - Win/loss aggregation                                         │   │
│  │  - Win rate calculation                                         │   │
│  │  - Streak detection (current & longest)                         │   │
│  │  - Head-to-head metrics                                         │   │
│  │  - Team ranking via sorted wins                                 │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                          │
├─────────────────────────────┴──────────────────────────────────────────┤
│                         Domain & Query Layer                           │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Data Layer (Prisma ORM + PostgreSQL)                            │  │
│  │  - listMatches()  - fetch all matches for user's teams           │  │
│  │  - getTeams()     - fetch teams with member info                 │  │
│  │  - Raw queries for head-to-head filtering                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Database (PostgreSQL)                                           │  │
│  │  - matches (teamAId, teamBId, winnerTeamId, playedAt)            │  │
│  │  - teams (id, name, createdBy, status)                           │  │
│  │  - team_members (teamId, userId)                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation Pattern |
|-----------|---|---|
| **Scoreboard API** | Fetch all user's team matches; compute aggregated stats (W/L, win rate, streak) for display | `GET /api/scoreboard` → fetches matches via `listMatches()` → pipes to stats engine |
| **Ranking Module** | Sort all teams by wins descending; include W/L, win rate %, total matches played | Computed on-demand from scoreboard data; no persisted ranking table |
| **Streak Detector** | Identify current winning/losing streak and longest streak in history for a team | Reads match history in chronological order; tracks consecutive wins against `loserTeamId` |
| **Head-to-Head Engine** | Query matches between two specific teams; compute isolated W/L, win rate, recent matches | Filters matches where `(teamAId = A AND teamBId = B) OR (teamAId = B AND teamBId = A)` |
| **Team Stats Aggregator** | Compute per-team metrics: total matches, total wins, win rate %, current/longest streak | Reduce operation over match array; keyed by `teamId` |
| **Match History Service** | Fetch and normalize match records for display; expose `GET /api/matches` (recent) | Returns sorted matches; client filters by team membership |

## Recommended Project Structure

```
src/
├── lib/
│   ├── data.ts                    # Existing: listMatches(), createMatch()
│   ├── types.ts                   # Extend: ScoreboardRecord, TeamStatsRecord
│   ├── stats/                     # NEW: Stats computation module
│   │   ├── compute-team-stats.ts  # Core: aggregate W/L, rate, streaks per team
│   │   ├── compute-ranking.ts     # Sort teams by wins; include all stats
│   │   ├── streak-detector.ts     # Identify streaks from match sequence
│   │   └── head-to-head.ts        # Isolate and compute H2H metrics
│   └── constants.ts               # Existing: TEAMS, auth defaults
│
├── components/
│   ├── dashboard/                 # Existing
│   │   ├── dashboard-hero.tsx     # Update: show team stats from scoreboard
│   │   └── use-dashboard-data.ts  # Update: call GET /api/scoreboard
│   ├── ranking/                   # NEW: Ranking page
│   │   ├── ranking-table.tsx      # Render sorted teams + stats
│   │   ├── ranking-filters.tsx    # Optional: filter by type (solo/duo)
│   │   └── use-ranking-data.ts    # Call GET /api/scoreboard
│   ├── head-to-head/              # NEW: H2H detail view
│   │   ├── h2h-summary.tsx        # Card: H2H stats for two teams
│   │   ├── h2h-history.tsx        # Match list: only between two teams
│   │   └── use-h2h-data.ts        # Call GET /api/head-to-head?teamA=x&teamB=y
│   └── team-detail/               # NEW or Update
│       ├── team-stats-card.tsx    # Display team stats (W/L, rate, streak)
│       └── use-team-stats.ts      # Call GET /api/team-stats/:id
│
└── app/api/
    ├── scoreboard/route.ts        # Reactivate: return all user's teams + aggregated stats
    ├── head-to-head/route.ts      # NEW: GET with ?teamAId=x&teamBId=y → H2H metrics
    ├── team-stats/[id]/route.ts   # NEW: GET team by ID with computed stats
    └── teams/route.ts             # Existing: team CRUD
```

### Structure Rationale

- **`lib/stats/`:** Isolated stats computation logic — testable without database, reusable across routes. Each module handles one concern (streak, H2H, etc.) for clarity and testability.
- **`components/{ranking,head-to-head,team-detail}/`:** Feature-driven folders mirror new UI pages. Custom hooks (`use-*-data.ts`) encapsulate API call logic and loading state.
- **`app/api/{scoreboard,head-to-head,team-stats}`:** REST routes follow resource naming. Scoreboard reactivated as main aggregation endpoint; new routes for specific queries.
- **`lib/types.ts`:** Extended with `ScoreboardRecord`, `RankingEntry`, `HeadToHeadStats` for type safety across components and API.

## Architectural Patterns

### Pattern 1: On-Demand Derivation with No Persisted Counters

**What:** All stats (wins, streaks, rankings) computed fresh from match history on each request. No stored `wins` or `rank` columns.

**When to use:**
- Small-scale data (office team pool, <1000 matches)
- Correctness is critical; stored state can drift
- Data changes infrequently (matches added once at a time, not bulk)

**Trade-offs:**
- Pro: Match history is source of truth; stats always consistent
- Pro: Easier to debug (recompute == reset)
- Con: Computation cost grows with match history size (O(n) per team)
- Con: No analytics on historical rankings (past snapshots lost)

**Example:**
```typescript
// src/lib/stats/compute-team-stats.ts
export function computeTeamStats(
  teamId: string,
  matches: MatchRecord[]
): TeamStats {
  const teamMatches = matches.filter(
    (m) => m.teamAId === teamId || m.teamBId === teamId
  );

  const wins = teamMatches.filter((m) => m.winnerTeamId === teamId).length;
  const losses = teamMatches.length - wins;
  const winRate = teamMatches.length ? (wins / teamMatches.length) * 100 : 0;

  // Streak computation: iterate chronologically, track consecutive wins
  let currentStreak = 0;
  let longestStreak = 0;
  let currentStreakType: "win" | "loss" | null = null;

  for (const match of teamMatches) {
    const isWin = match.winnerTeamId === teamId;
    if (isWin) {
      if (currentStreakType === "win") {
        currentStreak++;
      } else {
        currentStreak = 1;
        currentStreakType = "win";
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreakType = "loss";
      currentStreak = 0;
    }
  }

  return {
    teamId,
    wins,
    losses,
    totalMatches: teamMatches.length,
    winRate,
    currentStreak,
    longestStreak,
  };
}
```

### Pattern 2: Aggregation as Reduce + Sort

**What:** Fetch all user's matches once, map to per-team stats, sort by wins to produce ranking.

**When to use:**
- Ranking page or scoreboard with multiple teams
- Avoids N+1 queries (one fetch, compute all teams from results)
- Client-side memory permissible for match set

**Trade-offs:**
- Pro: Single database query; O(n) sort on results
- Pro: Enables flexible re-sorting (by winRate, streak, etc.) without re-query
- Con: Must load entire match history into memory
- Con: Doesn't scale past ~10k matches per user (memory + compute)

**Example:**
```typescript
// src/lib/stats/compute-ranking.ts
export function computeRanking(matches: MatchRecord[], teams: TeamRecord[]): RankingEntry[] {
  const stats = teams.map((team) =>
    computeTeamStats(team.id, matches)
  );

  return stats
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)
    .map((stat, rank) => ({
      rank: rank + 1,
      ...stat,
    }));
}
```

### Pattern 3: Head-to-Head as Filtered + Computed Subset

**What:** Filter matches between two teams; compute W/L, head-to-head record, recent match list.

**When to use:**
- Two-team comparison view
- Answering "who's ahead in our matchup" without polluting main ranking

**Trade-offs:**
- Pro: Isolated computation; easy to add H2H-specific metrics (e.g., "never lost to them")
- Pro: Can be cached per team-pair if needed later
- Con: Requires additional filtering logic (bidirectional team pair logic)
- Con: API must accept two team IDs; adds parameter validation burden

**Example:**
```typescript
// src/lib/stats/head-to-head.ts
export function computeHeadToHead(
  teamAId: string,
  teamBId: string,
  matches: MatchRecord[]
): HeadToHeadStats {
  const h2hMatches = matches.filter(
    (m) =>
      (m.teamAId === teamAId && m.teamBId === teamBId) ||
      (m.teamAId === teamBId && m.teamBId === teamAId)
  );

  const teamAWins = h2hMatches.filter((m) => m.winnerTeamId === teamAId).length;
  const teamBWins = h2hMatches.length - teamAWins;

  return {
    teamAId,
    teamBId,
    teamAWins,
    teamBWins,
    totalMatches: h2hMatches.length,
    recentMatches: h2hMatches.slice(0, 10), // 10 most recent
    teamAWinRate: h2hMatches.length ? (teamAWins / h2hMatches.length) * 100 : 0,
  };
}
```

### Pattern 4: Type-Safe API Responses with Typed Returns

**What:** Every API route returns `NextResponse.json<TypeName>()` with explicit generic. Stats types defined in `lib/types.ts` and reused across routes and components.

**When to use:**
- Always; enforces consistency between server and client
- Prevents runtime type mismatches in client hooks

**Trade-offs:**
- Pro: Client-side hooks have type hints; fewer casting errors
- Pro: Breaking API changes caught at compile time
- Con: Types duplicated (request input, response output)

**Example:**
```typescript
// src/lib/types.ts
export type TeamStats = {
  teamId: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
};

export type ScoreboardRecord = {
  teams: (TeamRecord & TeamStats)[];
  lastUpdated: string;
};

// src/app/api/scoreboard/route.ts
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const teams = await listUserTeams(user.id);
  const matches = await listMatches(user.id);
  const ranking = computeRanking(matches, teams);

  return NextResponse.json<ScoreboardRecord>(
    {
      teams: ranking,
      lastUpdated: new Date().toISOString(),
    },
    { status: 200 }
  );
}
```

## Data Flow

### Scoreboard Load & Aggregation Flow

```
User opens Dashboard
    ↓
useDashboardData() hook triggers
    ↓
GET /api/scoreboard
    ↓
getAuthenticatedUser() validates session
    ↓
listUserTeams(userId) → fetch teams where user is member
    ↓
listMatches(userId) → fetch all matches for user's teams
    ↓
computeRanking(matches, teams) in memory
    ├─ computeTeamStats() for each team
    │   └─ streak detection + W/L aggregation
    ├─ sort by wins DESC
    └─ return ranked array
    ↓
Return ScoreboardRecord { teams: [...], lastUpdated }
    ↓
Client state updated; dashboard renders ranking
```

### Head-to-Head Query Flow

```
User clicks "vs <Team>" in ranking view
    ↓
Navigate to /head-to-head?teamA=x&teamB=y
    ↓
useHeadToHeadData(teamAId, teamBId) hook triggers
    ↓
GET /api/head-to-head?teamAId=x&teamBId=y
    ↓
getAuthenticatedUser() validates session
    ↓
Validate both teamAId and teamBId exist
    ↓
listMatches(userId) → full match history
    ↓
computeHeadToHead(teamAId, teamBId, matches) in memory
    ├─ filter matches for (A ↔ B) pair only
    ├─ count wins each direction
    ├─ compute win rates
    └─ return recent match list
    ↓
Return HeadToHeadStats
    ↓
Client renders H2H summary card + match history list
```

### Team Stats Detail Flow

```
User clicks team name to see detail
    ↓
Navigate to /team/:id
    ↓
useTeamStats(teamId) hook triggers
    ↓
GET /api/team-stats/:id
    ↓
getAuthenticatedUser() validates session
    ↓
Validate teamId exists and user is member OR public
    ↓
listMatches(userId) → full history
    ↓
computeTeamStats(teamId, matches)
    ├─ W/L aggregation
    ├─ streak detection
    └─ metrics
    ↓
Return TeamStats { teamId, wins, losses, ..., currentStreak, longestStreak }
    ↓
Client renders team detail page with stats + member list + recent matches
```

### Key Data Flows

1. **Scoreboard Refresh:** Match registered → `POST /api/matches` → client re-fetches `GET /api/scoreboard` → fresh computation → UI updates
2. **Ranking Update:** Derivation on-demand; no cache invalidation needed (always fresh from source)
3. **Head-to-Head Drill-Down:** User explores specific matchup without affecting main ranking query
4. **Team Detail Lookup:** Per-team stats sliced from full ranking computation; no separate database call required

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|---|
| **0–1k matches (current office)** | Current architecture: fetch all, compute in-memory. No caching needed. All derivations < 100ms. |
| **1k–10k matches (2–3 year horizon)** | Add server-side caching layer (Redis or in-memory). Cache invalidate on match creation. Consider computing ranking async via job queue. |
| **10k–100k matches** | Introduce ranking materialization: pre-compute team stats nightly; serve from cache. Keep match history for H2H queries. Query optimization: index on `(teamAId, playedAt)` and `(teamBId, playedAt)`. |
| **100k+ matches** | Separate read replicas for reporting; write main database for match creation. Consider PostgreSQL partitioning by team or date. Investigate Prisma raw query helpers for window functions. |

### Scaling Priorities (For This Project)

1. **First bottleneck (1k–5k matches):** In-memory aggregation becomes slow. **Fix:** Cache scoreboard result in memory for 5–10 seconds; invalidate on match create.
2. **Second bottleneck (5k–20k matches):** Network payload grows; clients feel slower loading large match lists. **Fix:** Paginate recent matches endpoint; return only last 50 matches by default.
3. **Third bottleneck (20k+ matches):** Streak detection O(n) becomes noticeable. **Fix:** Pre-compute streak snapshots on match creation; store only current streak in cache.

## Anti-Patterns

### Anti-Pattern 1: Persisting Aggregated Counters (Wins, Streaks)

**What people do:** Store `wins`, `currentStreak` columns on Team or create a `TeamStats` table; update on every match.

**Why it's wrong:**
- Breaks if update logic fails (race conditions in concurrent matches)
- Stats can diverge from match history (e.g., if a match is deleted, counters not updated)
- Makes debugging hard (recompute doesn't match persisted state)
- Adds migration burden if stats logic changes

**Do this instead:** Keep match history authoritative. Compute stats on-demand or cache with explicit invalidation. Makes truth single-source: match array.

### Anti-Pattern 2: N+1 Queries in Stats Computation

**What people do:** For each team, fetch its matches separately via `prisma.match.findMany({ where: { teamId } })` in a loop.

**Why it's wrong:**
- Database query per team = slow (O(n) queries)
- Excessive network latency; roundtrips add up
- Easy to hit connection pool limits on high concurrency

**Do this instead:** Fetch all matches once (`listMatches(userId)`), filter in memory. Single query + CPU is faster than N queries.

### Anti-Pattern 3: Computing Streaks Incorrectly (Ignoring Opponent)

**What people do:** Count all consecutive wins without checking opponent; claims "5-game win streak" even if opponent changed.

**Why it's wrong:**
- Misleading for H2H narrative (makes no sense in context)
- Stats become meaningless for competitive context (user confusion)

**Do this instead:** When computing streaks, track `(teamId, winnerTeamId)` pair. A streak ends when loser changes OR when team loses a match. Current streak = consecutive wins at current moment, regardless of opponent.

### Anti-Pattern 4: API Accepting Unvalidated Team IDs

**What people do:** Accept `?teamA=abc&teamB=def` without checking IDs exist or match format.

**Why it's wrong:**
- Silent failures (query returns empty, user sees "no H2H data")
- Potential for injection if IDs not sanitized
- No error feedback to client (is ID wrong or just no matches?)

**Do this instead:** Validate IDs are valid CUIDs before query. Return 400 if invalid; return 404 if teams don't exist.

## Component Integration Boundaries

### Boundary 1: Presentation ↔ API

| Component | Talks To | Communication | Constraints |
|-----------|----------|---|---|
| RankingTable (UI) | GET /api/scoreboard | HTTP JSON | Typed response; handles error state |
| HeadToHeadView (UI) | GET /api/head-to-head | Query params + JSON | Validates teamA, teamB params; 400 if invalid |
| TeamDetailPage (UI) | GET /api/team-stats/:id | Dynamic ID in path | 404 if team not found or user not member |

### Boundary 2: API ↔ Domain

| API Route | Domain Function | Data Contract |
|-----------|---|---|
| GET /api/scoreboard | `listMatches(userId)` + `listUserTeams(userId)` | Returns MatchRecord[] + TeamRecord[]; stats computed in route |
| GET /api/head-to-head | `listMatches(userId)` | Filtering by team pair happens in route; stats computed in memory |
| GET /api/team-stats/:id | `listMatches(userId)` | One team focused; reuses same aggregation logic |

### Boundary 3: Domain ↔ Persistence

| Domain Function | Prisma Method | Notes |
|---|---|---|
| `listMatches()` | `prisma.match.findMany({ where: { OR: [...] } })` | Existing; no changes needed |
| `listUserTeams()` | `prisma.teamMember.findMany()` + `prisma.team.findMany()` | Existing; fetches team IDs then teams |
| Streak detection | In-memory iteration (no DB) | Stateless; pure function |
| Ranking sort | JavaScript sort (no DB) | No SQL window functions needed for MVP |

## Summary: Build Order & Dependencies

1. **Phase 1 (Immediate):** Extend `lib/types.ts` with `TeamStats`, `ScoreboardRecord`, `RankingEntry`, `HeadToHeadStats` types.
2. **Phase 2 (Immediate):** Implement `lib/stats/` module: `compute-team-stats.ts`, `streak-detector.ts`, `compute-ranking.ts`, `head-to-head.ts`.
3. **Phase 3 (Follow-up):** Reactivate `GET /api/scoreboard` using stats module; return aggregated ranking.
4. **Phase 4 (Follow-up):** Add `GET /api/head-to-head?teamAId=x&teamBId=y` route.
5. **Phase 5 (Follow-up):** Add `GET /api/team-stats/:id` route.
6. **Phase 6 (UI):** Create `RankingTable` component; wire `useDashboardData()` to `GET /api/scoreboard`.
7. **Phase 7 (UI):** Create `HeadToHeadView` component; add route `/head-to-head?teamA=:id&teamB=:id`.
8. **Phase 8 (UI):** Create `TeamDetailPage` component; add route `/team/:id`.

## Sources

- [Prisma Aggregation & Grouping Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing)
- [PostgreSQL rank() Window Function](https://neon.com/docs/functions/window-rank)
- [PostgreSQL Performance Tuning Checklist 2026](https://dev.to/_d7eb1c1703182e3ce1782/postgresql-performance-tuning-checklist-2026-complete-guide-65a)
- [Design Patterns for Sports Apps & Live Events](https://ably.com/blog/design-patterns-sports-live-events)
- [Building a Stats Website for a Sports Club](https://dev.to/bangsluke/building-a-stats-website-for-a-sports-club-4g5m)

---

*Architecture research for: Match-based ranking & stats system*
*Researched: 2026-03-23*
