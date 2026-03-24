# Stack Research: Rankings, Leaderboards & Stats Aggregation

**Domain:** Sports/billiards tracker with ranking systems and stats aggregation
**Researched:** 2026-03-23
**Confidence:** MEDIUM-HIGH

## Executive Summary

Rankings and stats aggregation for a small-scale office sports tracker (billiards/darts/similar) should be **built without additional libraries**. The existing stack (Prisma 6.19.2 + PostgreSQL + Next.js 16) has all the required aggregation, grouping, and sorting capabilities. The primary work is application-level computation (win rates, streaks, head-to-head stats) combined with strategic PostgreSQL indexing. No ELO or complex rating system is warranted for office context.

---

## Recommended Stack

### Core Technologies (Use Existing)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Prisma** | 6.19.2 | Query aggregation and grouping for leaderboards | Native groupBy(), aggregate(), and count() eliminate need for external stats libraries; type-safe with full TypeScript support |
| **PostgreSQL** | (via Neon) | Ranking queries, indexing, sorting | B-tree indexes on `createdAt` and team IDs enable fast leaderboard queries; ORDER BY with LIMIT/OFFSET for pagination |
| **Next.js** | 16.1.6 | API routes for stats endpoints | Server-side aggregation at `/api/teams/:id/stats`, `/api/leaderboard` keeps logic centralized and cacheable |

### Database Patterns (No New Libraries)

| Pattern | Implementation | When to Use |
|---------|----------------|-------------|
| **Aggregation via `groupBy()`** | `prisma.match.groupBy({ by: ['winnerId'], _count: { id: true } })` | Counting wins/losses per team from match history |
| **Sorting & Pagination** | `findMany()` with `orderBy` and `take/skip` | Leaderboard ranking with pagination (top 10, etc.) |
| **Computed Stats in Application** | Calculate win rate, streak, head-to-head from raw counts | Win % = (wins / total) × 100; streaks require scanning match history |
| **Raw SQL for Complex Queries** | `prisma.$queryRaw()` only if `groupBy()` insufficient | Head-to-head match histories with detailed filters |

---

## Stats Computation Strategy

### Table Stakes (Must Calculate)

| Metric | Calculation | Notes |
|--------|-----------|-------|
| **Wins (W)** | COUNT matches where team is winner | Derived from Match.winnerId = Team.id |
| **Losses (L)** | COUNT matches where team is not winner | Total matches - wins |
| **Win Rate %** | (W / Total) × 100, rounded to 1 decimal | Display format: "65.5%" |
| **Total Matches** | COUNT all matches for team | Ensures users see participation level |
| **Current Streak** | Last N consecutive wins or losses | Scan match history chronologically; track direction change |
| **Longest Streak** | Historical best/worst streak | Background computation opportunity |

### Implementation Pattern (Typescript)

```typescript
// src/lib/stats.ts - Compute stats from raw match data

export interface TeamStats {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  winRate: number; // percentage (0-100)
  totalMatches: number;
  currentStreak: {
    type: 'win' | 'loss';
    count: number;
  };
}

export async function getTeamStats(teamId: string): Promise<TeamStats> {
  // Query 1: Get all matches (winner or participant)
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ winnerId: teamId }],
      // Note: if Match schema tracks loser, add here
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, winnerId: true, createdAt: true },
  });

  const wins = matches.filter(m => m.winnerId === teamId).length;
  const losses = matches.length - wins;
  const totalMatches = matches.length;

  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

  // Current streak: scan from most recent
  let currentStreak = { type: 'loss' as const, count: 0 };
  for (const match of matches) {
    const isWin = match.winnerId === teamId;
    if (currentStreak.count === 0) {
      currentStreak.type = isWin ? 'win' : 'loss';
      currentStreak.count = 1;
    } else if (
      (currentStreak.type === 'win' && isWin) ||
      (currentStreak.type === 'loss' && !isWin)
    ) {
      currentStreak.count++;
    } else {
      break; // Streak ended
    }
  }

  return {
    teamId,
    teamName: 'Team Name', // Join with Team entity for full data
    wins,
    losses,
    winRate: Math.round(winRate * 10) / 10,
    totalMatches,
    currentStreak,
  };
}
```

### Leaderboard Query Pattern

```typescript
// Get top 10 teams by wins (simplest approach)
export async function getLeaderboard(limit = 10) {
  const teams = await prisma.team.findMany({
    take: limit,
    select: { id: true, name: true, type: true },
  });

  // Compute stats for each team in application
  const leaderboard = await Promise.all(
    teams.map(async (team) => ({
      ...team,
      stats: await getTeamStats(team.id),
    }))
  );

  // Sort by win rate (descending), then by wins (descending)
  return leaderboard.sort((a, b) => {
    if (b.stats.winRate !== a.stats.winRate) {
      return b.stats.winRate - a.stats.winRate;
    }
    return b.stats.wins - a.stats.wins;
  });
}
```

### Optimization for Large Datasets

For office context (< 1000 matches/month), inline aggregation is sufficient. If scaling needed:

| Approach | When to Use | Trade-off |
|----------|-----------|-----------|
| **Materialized View** (PostgreSQL) | 10K+ matches, frequent leaderboard queries | Requires `REFRESH MATERIALIZED VIEW` after each match; adds complexity |
| **Cached Computed Field** | Real-time leaderboard critical | Cache invalidation on every match; use Redis/in-memory if simple |
| **Background Job** | Leaderboard computed nightly | Acceptable stale data (< 24hr); offload computation |
| **SQL Indexing** (Recommended for v1) | All cases | Index on `Match(winnerId, createdAt)` + `Team(id)`; enables fast sorting |

---

## Head-to-Head Records

**Pattern:** Direct comparison between two teams across all their matches.

```typescript
export async function getHeadToHeadRecord(
  teamA: string,
  teamB: string
) {
  const matches = await prisma.match.findMany({
    where: {
      AND: [
        { OR: [{ winnerId: teamA }, { winnerId: teamB }] },
        // Ensure both teams participated (requires Match schema to track loser/participants)
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  const aWins = matches.filter(m => m.winnerId === teamA).length;
  const bWins = matches.filter(m => m.winnerId === teamB).length;

  return {
    teamA,
    teamB,
    teamAWins: aWins,
    teamBWins: bWins,
    total: matches.length,
    matches, // Return full history for UI
  };
}
```

**Note:** Current schema only tracks winner. To support full head-to-head, either:
1. Extend `Match` to include loser/opponent field (preferred)
2. Infer from context (e.g., duo matches: if team A won, team B lost)

---

## Database Indexing Strategy

Add these indexes to `prisma/schema.prisma` for leaderboard performance:

```prisma
model Match {
  id        String   @id @default(cuid())
  winnerId  String
  winner    Team     @relation("Winner", fields: [winnerId], references: [id])
  createdAt DateTime @default(now())

  @@index([winnerId]) // Fast lookup: "all wins by team"
  @@index([createdAt]) // Fast sorting: "most recent matches"
  @@index([winnerId, createdAt]) // Fast combined: "wins ordered by date"
}

model Team {
  id   String @id @default(cuid())
  name String @unique
  type String // "solo" | "duo"

  @@index([createdAt]) // For team list ordering
}
```

**When to add:** Before going live with leaderboard. Verify with `EXPLAIN ANALYZE` that indexes are used.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Correct Approach |
|--------------|---------|------------------|
| **Storing computed counters in Team table** | Diverges from match history; manual update needed | Always derive from matches |
| **Complex ELO/rating systems** | Overkill for office context; adds math complexity | Simple W/L sufficient; context doesn't warrant predictive power |
| **Real-time leaderboard via WebSocket** | Premature optimization; overhead not justified | Server-side ranking at `/api/leaderboard`, refresh on demand |
| **Calculating stats on every page load** | N+1 queries; poor for large datasets | Batch compute stats, implement caching if needed |
| **Hardcoding team names in ranking logic** | Doesn't support dynamic teams | Query Team table; parameterize by team type |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **NPM stats libraries (e.g., `sports-stats`, `statistics.js`)** | Overkill for simple W/L; no sports-specific features needed; added maintenance | Native Prisma aggregation + TypeScript |
| **Separate analytics backend** (BigQuery, etc.) | Office scale doesn't warrant separate service; adds operational complexity | PostgreSQL with proper indexes is sufficient |
| **Redis caching for stats** | First-order optimization premature; Prisma queries are fast for office scale | Implement only if profiling shows bottleneck |
| **GraphQL for leaderboard** | Over-engineering for this domain; REST API simpler to test and reason about | Standard Next.js route handlers |

---

## API Route Examples

### `/api/leaderboard` — GET

```typescript
// Route: src/app/api/leaderboard/route.ts
import { getLeaderboard } from '@/lib/stats';

export async function GET() {
  try {
    const leaderboard = await getLeaderboard(limit: 50);
    return Response.json(leaderboard);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
```

### `/api/teams/:id/stats` — GET

```typescript
// Route: src/app/api/teams/[id]/stats/route.ts
import { getTeamStats } from '@/lib/stats';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const stats = await getTeamStats(params.id);
    return Response.json(stats);
  } catch (error) {
    return Response.json({ error: 'Team not found' }, { status: 404 });
  }
}
```

### `/api/teams/:id/head-to-head/:opponentId` — GET

```typescript
// Route: src/app/api/teams/[id]/head-to-head/[opponentId]/route.ts
import { getHeadToHeadRecord } from '@/lib/stats';

export async function GET(
  req: Request,
  { params }: { params: { id: string; opponentId: string } }
) {
  try {
    const record = await getHeadToHeadRecord(params.id, params.opponentId);
    return Response.json(record);
  } catch (error) {
    return Response.json({ error: 'Comparison failed' }, { status: 500 });
  }
}
```

---

## Installation & Setup

**No new packages required.** Use existing stack:

```bash
# Verify Prisma version
npm ls prisma

# If upgrading Prisma (optional, for latest aggregation features):
npm install --save prisma@^6.19.2 @prisma/client@^6.19.2

# Generate updated Prisma client (runs on postinstall)
npm run prisma:generate

# Add indexes to schema, then migrate:
npm run prisma:migrate -- --name add_leaderboard_indexes
```

**TypeScript:** Stats logic lives in `src/lib/stats.ts` with full type inference from Prisma.

---

## Alternative Approaches (Not Recommended)

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Stored Procedures (PostgreSQL)** | Native performance, single source of truth | Maintenance burden; harder to test; language split | Only if stats become bottleneck (unlikely at this scale) |
| **Elasticsearch for ranking** | Sub-millisecond leaderboard queries | Operational overhead; overkill for < 1000 teams | Not recommended for v1 |
| **Cloud analytics (BigQuery/Snowflake)** | Unlimited scale; SQL flexibility | Cost & complexity; network latency | Not needed for office context |
| **Time-series DB (ClickHouse)** | Optimized for aggregations | Overkill; another service to maintain | Not justified unless 100K+ matches/month |

---

## Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| Prisma | 6.19.2 | groupBy() and aggregate() fully stable; includes computed fields support |
| PostgreSQL | Latest (via Neon) | B-tree indexing standard; EXPLAIN ANALYZE available |
| Next.js | 16.1.6 | Route handlers fully async; Prisma client injection safe |
| TypeScript | 5.x | Type inference from Prisma queries automatic |

---

## Performance Expectations

| Query | Expected Time | Notes |
|-------|---------------|-------|
| Get top 10 leaderboard | < 50ms | With proper indexes on winnerId, createdAt |
| Get one team's stats (100 matches) | < 200ms | Inline aggregation; inline streak calculation |
| Head-to-head record (2 teams) | < 100ms | Direct match filter; no join overhead |
| Leaderboard refresh (50 teams) | < 2s | Parallel stat computation via Promise.all |

*Assumes office scale (< 5K matches/month, < 50 teams)*

---

## Sources

### Prisma & PostgreSQL
- [Prisma Aggregation & Grouping Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing) — Official docs on groupBy(), aggregate(), and compute patterns
- [Prisma with Next.js Guide](https://www.prisma.io/docs/guides/frameworks/nextjs) — Setup and best practices for Next.js integration
- [Vercel: Next.js + Prisma + Postgres](https://vercel.com/kb/guide/nextjs-prisma-postgres) — Production deployment guidelines

### Database Performance
- [PostgreSQL Indexing Best Practices](https://www.mydbops.com/blog/postgresql-indexing-best-practices-guide) — Index strategy for leaderboard queries
- [SQL Query Optimization for Large Datasets](https://medium.com/@saravana.861999/sql-query-optimization-techniques-for-large-datasets-improve-performance-by-10x-d1b2c2fbcd3a) — Performance tuning reference (2026)
- [Making Postgres Queries Fast](https://mattermost.com/blog/making-a-postgres-query-1000-times-faster/) — Real-world optimization case study

### Sports Ranking Algorithms
- [Sports Rating System (Wikipedia)](https://en.wikipedia.org/wiki/Sports_rating_system) — Overview of Elo, Massey, Colley methods
- [Generate Sports Rankings with Data Science](https://medium.com/data-science/generate-sports-rankings-with-data-science-4dd1979571da) — When to use complex ranking systems
- [Streaks in Baseball](https://sabr.org/journal/article/going-beyond-the-baseball-adage-one-game-at-a-time-a-geeks-peek-at-streaks/) — Streak calculation edge cases

### Win Rate & Aggregation Patterns
- [Prisma Aggregate & GroupBy Patterns](https://dev.to/this-is-learning/its-prisma-time-aggregate-and-groupby-36a7) — Practical examples of stat aggregation in Prisma
- [Node.js Sports Score Tracker](https://www.geeksforgeeks.org/node-js/sports-score-tracker-with-nodejs-and-expressjs/) — End-to-end example of sports data patterns

---

**Stack Decision:** Keep existing stack; add no external libraries. Implement ranking logic in application code with Prisma queries and PostgreSQL indexes.

**Next Step:** Update `prisma/schema.prisma` to add indexes, then implement `src/lib/stats.ts` with the patterns outlined above.

*Research completed: 2026-03-23*
