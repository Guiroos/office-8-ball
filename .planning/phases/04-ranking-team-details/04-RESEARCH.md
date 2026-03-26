# Phase 4: Ranking & Team Details - Research

**Researched:** 2026-03-25
**Domain:** Server-rendered ranking/team pages with dynamic stats derivation
**Confidence:** HIGH

## Summary

Phase 4 implements two primary user-facing features: a live ranking page showing all teams sorted by wins with aggregated stats, and team detail pages displaying per-team metrics, roster, and head-to-head comparison. Both are built as **Server Components** that fetch stats server-side via existing pure functions (`computeTeamStats`, `computeHeadToHead`) introduced in Phase 3. The ranking updates within 1 second of match creation via `revalidatePath()` called from the match creation API. All UI follows established patterns: `StatTile` for metrics, `SectionHeader` for hierarchy, semantic design tokens only, CVA for variants. No new dependencies required.

**Primary recommendation:** Build ranking and team detail pages as Server Components using existing stats functions; implement cache revalidation in `/api/matches` POST handler; use existing UI primitives for visual consistency.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Ranking layout: podium top 3 (1st center, 2nd left, 3rd right with medals/trophies), followed by compact list for #4+. Visual ref: Stitch "Rankings & Leaderboards" project 8575820399758307798.
- **D-02:** Filter by team type: tabs "Solo" | "Duplas" (filter by `team.type`). No temporal filtering this phase.
- **D-03:** Sort by wins (W) descending; tie-break by win rate %.
- **D-04:** Stats per team: Wins + Losses + Win Rate % + Current Streak.
- **D-05:** `/times` has two tabs: "Meus Times" (user's teams) and "Criar Novo Time".
- **D-06:** Click team navigates to `/times/[id]` dedicated detail route.
- **D-07:** `/times/[id]` displays: team card (avatar/initials + name + "Convidar Membro" button), team stats (Total Wins, Win Rate %, Ranking Position), member list (name + role), last 3 matches with "Ver histórico completo" button. Visual ref: Stitch "Gestão de Times" project 8575820399758307798.
- **D-08:** Right sidebar on `/times` (no team selected): CTA "Criar Novo Time".
- **D-09:** H2H section on `/times/[id]`: opponent selector dropdown with all other user teams, pre-loaded with main rival (most direct matchups).
- **D-10:** H2H data: W/L between teams + current team's win rate in H2H + date of last match.
- **D-11:** Ranking and team detail pages as Server Components (RSC). Data fetched server-side via domain functions (`computeTeamStats`, `computeHeadToHead`).
- **D-12:** Cache revalidated via `revalidatePath('/ranking')` and `revalidatePath('/times')` after new match creation in `POST /api/matches`. Meets SC-2 (update < 1 second).

### Claude's Discretion

- Avatar/initials design (color via hash or random).
- "Ver histórico completo" pagination or scroll.
- Loading/skeleton states for RSC pages.
- Empty state messaging (no teams, no matches).

### Deferred Ideas (OUT OF SCOPE)

- Temporal filters (this week/month/all-time) in ranking — Phase 5 (RANK-05).
- Dedicated H2H route `/head-to-head?teamA=x&teamB=y` — Phase 5.
- Full chronological history with advanced pagination — Phase 5.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEAM-02 | User can see team details page (members, stats, match history) | RSC page at `/times/[id]` fetching team + stats + recent matches via existing domain functions; cache revalidation ensures updates. |
| RANK-01 | Ranking page displays all teams sorted by wins | RSC page at `/ranking` fetching all teams via `prisma.team.findMany()` + computing stats with `computeTeamStats()` for each. |
| RANK-02 | Ranking shows W/L and win rate % per team | `TeamStats` type (Phase 3) includes `wins`, `losses`, `winRate` — directly rendered in ranking UI. |
| RANK-03 | Ranking shows current streak per team | `TeamStats.currentStreak` computed in Phase 3 `computeTeamStats()` — rendered with streak type and count. |
| RANK-04 | Ranking shows total matches per team | `TeamStats.totalMatches` — aggregated from match history, rendered per team. |

</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 (App Router) | Server components for data fetching + rendering | App Router forces RSC-first; solves page rendering pattern cleanly without client-side state managers |
| React | 19.2.3 | Component rendering, hooks | Standard for Next.js; no additional tools needed for ranking/team pages |
| TypeScript | 5 | Type safety for domain/API types | Project standard; strict mode enabled |
| Zod | 4.3.6 | Request validation (if needed for filtering) | Already in project; powers `/api/matches` validation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.2.1 | Utility-first styling with semantic tokens | Project standard; no custom CSS needed |
| shadcn/ui | 4.0.8 | Headless UI components (Button, Badge, Card) | Radix-based; provides accessible primitives |
| class-variance-authority | 0.7.1 | Type-safe component variants (CVA) | Used in existing Card, Button components; consistent pattern |
| clsx / tailwind-merge | 2.1.1 / 3.5.0 | Classname merging and conflict resolution | Utility functions for Tailwind in components |
| lucide-react | 0.577.0 | Icon components (Trophy, Medal, Target, Users) | Already in project; icons for rankings, streaks, H2H |

### No New Dependencies

- **No client-side state library:** Ranking and team pages are RSC — no `useState`, no Zustand/Jotai.
- **No fetch library:** Use native `fetch()` or Prisma directly in server components.
- **No animation library:** Tailwind animations sufficient for UI transitions.
- **No data table library:** Table for matches renders with semantic HTML + Tailwind.

### Installation

Verify existing installs (all should already be present from Phase 1-3):

```bash
npm list next react typescript zod tailwindcss class-variance-authority clsx tailwind-merge lucide-react
```

Version pins to verify:
- `next@16.1.6` — `/api/matches` POST must call `revalidatePath()`
- `react@19.2.3` — No breaking changes expected
- `typescript@5.x` — Strict mode required
- `zod@4.3.6` — Already in use for schema validation

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/(authenticated)/
│   ├── ranking/
│   │   └── page.tsx                    # RSC: fetches all teams, computes stats, renders podium + list
│   └── times/
│       ├── page.tsx                    # RSC: tabs "Meus Times" / "Criar Novo Time"
│       └── [id]/
│           └── page.tsx                # RSC: team detail, stats, roster, H2H section
├── components/
│   ├── ranking/
│   │   ├── ranking-hero.tsx            # Section header + type filter tabs
│   │   ├── ranking-podium.tsx          # Top 3 teams with medals/trophies
│   │   └── ranking-list.tsx            # Compact list for #4+
│   ├── teams/
│   │   ├── teams-tabs.tsx              # "Meus Times" / "Criar Novo Time" tabs
│   │   ├── teams-list.tsx              # User's teams grid/list
│   │   ├── team-card.tsx               # Team avatar, name, quick stats
│   │   └── create-team-form.tsx        # Form to create new team
│   ├── team-detail/
│   │   ├── team-header.tsx             # Team name, avatar, invite button
│   │   ├── team-stats.tsx              # Wins, losses, win rate, position
│   │   ├── team-members.tsx            # Roster with role
│   │   ├── team-matches.tsx            # Last 3 matches, "View all" link
│   │   ├── team-h2h.tsx                # H2H selector and comparison
│   │   └── team-detail-hero.tsx        # Section header with stats overview
│   ├── primitives/
│   │   ├── stat-tile.tsx               # (existing) Metric tile with label + value + description
│   │   └── section-header.tsx          # (existing) Eyebrow + title + description
│   └── ui/
│       ├── card.tsx                    # (existing) Card variants
│       ├── badge.tsx                   # (existing) Status badges
│       ├── button.tsx                  # (existing) Interactive buttons
│       └── tabs.tsx                    # Tab component for filter/section switching
├── lib/
│   ├── stats.ts                        # (Phase 3) computeTeamStats, computeHeadToHead — USE DIRECTLY
│   ├── teams.ts                        # (Phase 1) listUserTeams, getTeamById, isTeamMember
│   ├── data.ts                         # (Phase 2) listMatches — for recent match history
│   ├── types.ts                        # (Phase 3) TeamStats, HeadToHeadStats exported here
│   └── auth.ts                         # getAuthenticatedUser — RSC pages use for user context
└── middleware.ts                       # (existing) Auth guard for /ranking, /times routes
```

### Pattern 1: Server Component Ranking Page

**What:** A server-rendered page that fetches all teams, computes stats for each, and renders both a podium (top 3) and a list (rest). Uses `revalidateTag('scoreboard')` or path-based revalidation to stay fresh.

**When to use:** When displaying read-only, infrequently-changing data that doesn't require real-time interactivity.

**Example:**

```typescript
// src/app/(authenticated)/ranking/page.tsx
import { prisma } from "@/lib/prisma";
import { computeTeamStats } from "@/lib/stats";
import { listMatches } from "@/lib/data";
import { getAuthenticatedUser } from "@/lib/auth";
import { RankingPodium } from "@/components/ranking/ranking-podium";
import { RankingList } from "@/components/ranking/ranking-list";
import { RankingHero } from "@/components/ranking/ranking-hero";

export default async function RankingPage() {
  const user = await getAuthenticatedUser();
  if (!user) return null; // Middleware guards this, but defensive check

  // Fetch all teams — no filtering by user ownership; this is global ranking
  const allTeams = await prisma.team.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "asc" },
  });

  // Fetch all matches (global scope for ranking)
  const allMatches = await prisma.match.findMany({
    orderBy: { playedAt: "desc" },
  });

  // Compute stats for each team
  const teamStats = allTeams.map(team => ({
    team,
    stats: computeTeamStats(team.id, allMatches),
  }));

  // Sort by wins descending, tie-break by win rate
  const ranked = teamStats.sort((a, b) => {
    const winsDiff = b.stats.wins - a.stats.wins;
    if (winsDiff !== 0) return winsDiff;
    return b.stats.winRate - a.stats.winRate;
  });

  const podium = ranked.slice(0, 3); // Top 3 for medal display
  const list = ranked.slice(3);      // Rest in compact list

  return (
    <main className="flex flex-col gap-8">
      <RankingHero />
      <RankingPodium podium={podium} />
      {list.length > 0 && <RankingList list={list} />}
    </main>
  );
}
```

### Pattern 2: Server Component Team Detail Page

**What:** A server-rendered page for a specific team, displaying the team's details, roster, stats, recent match history, and H2H comparison with another team.

**When to use:** When each item has a dedicated view that aggregates multiple related data sources (team + members + stats + matches).

**Example:**

```typescript
// src/app/(authenticated)/times/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { getTeamById, isTeamMember } from "@/lib/teams";
import { listMatches } from "@/lib/data";
import { computeTeamStats, computeHeadToHead } from "@/lib/stats";
import { getAuthenticatedUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { TeamHeader } from "@/components/team-detail/team-header";
import { TeamStats } from "@/components/team-detail/team-stats";
import { TeamMembers } from "@/components/team-detail/team-members";
import { TeamMatches } from "@/components/team-detail/team-matches";
import { TeamH2H } from "@/components/team-detail/team-h2h";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: teamId } = await params;
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const team = await getTeamById(teamId);
  if (!team) notFound();

  // Check if user is member (optional — can show public ranking)
  const isMember = await isTeamMember(teamId, user.id);

  // Fetch all matches for stats computation
  const allMatches = await listMatches(user.id);

  // Compute team stats
  const teamStats = computeTeamStats(teamId, allMatches);

  // Get recent matches (last 3 involving this team)
  const recentMatches = allMatches
    .filter(m => m.teamAId === teamId || m.teamBId === teamId)
    .slice(0, 3);

  // Get position in ranking (count teams with more wins)
  const allTeams = await prisma.team.findMany({
    where: { status: "active" },
  });
  const otherTeamStats = allTeams
    .filter(t => t.id !== teamId)
    .map(t => ({
      id: t.id,
      stats: computeTeamStats(t.id, allMatches),
    }))
    .sort((a, b) => b.stats.wins - a.stats.wins);

  const position = otherTeamStats.filter(t => t.stats.wins > teamStats.wins).length + 1;

  // Fetch other user's teams for H2H selection
  const userTeams = await prisma.teamMember.findMany({
    where: { userId: user.id, team: { status: "active" } },
    include: { team: true },
  });

  const otherTeams = userTeams
    .filter(m => m.teamId !== teamId)
    .map(m => m.team);

  return (
    <main className="flex flex-col gap-8">
      <TeamHeader team={team} isMember={isMember} />
      <TeamStats stats={teamStats} position={position} />
      <TeamMembers members={team.members} />
      <TeamMatches matches={recentMatches} teamId={teamId} />
      {otherTeams.length > 0 && (
        <TeamH2H
          currentTeamId={teamId}
          otherTeams={otherTeams}
          allMatches={allMatches}
        />
      )}
    </main>
  );
}
```

### Pattern 3: Cache Revalidation on Match Creation

**What:** When a match is created via `POST /api/matches`, call `revalidatePath()` to invalidate the ranking and team detail pages so stats refresh within ~1 second.

**When to use:** After mutations that affect derived data (ranking, stats).

**Example:**

```typescript
// src/app/api/matches/route.ts — end of POST handler, after createMatch()
import { revalidatePath } from "next/cache";

// ... validation and createMatch() call ...

const response = await createMatch({ teamAId, teamBId, winnerTeamId, note });

// Invalidate cached ranking and team pages
revalidatePath("/ranking");
revalidatePath("/times");

return NextResponse.json<CreateMatchResponse>(response, { status: 201 });
```

**Why this works:**
- `revalidatePath()` invalidates all instances of a route (all `/times/[id]` pages revalidate).
- Next.js re-renders the page on next request, fetching fresh data.
- Meets "update within 1 second" by triggering re-fetch immediately after mutation.

### Anti-Patterns to Avoid

- **Hardcoding team IDs or names in ranking UI:** Always fetch from Prisma, compute dynamically. If ranking UI references `frontend`/`backend` constants, it violates requirement 6 (no hardcode).
- **Persisting derived stats in the database:** Ranking stats are computed on-the-fly from match history. Storing wins/losses/streaks creates a second source of truth that diverges.
- **Computing stats client-side:** Stats computation is expensive (iterate all matches). Do it server-side once; serialize computed `TeamStats` to JSON, hydrate client if needed (but not for RSC pages).
- **Forgetting to revalidate after match creation:** If `/ranking` or `/times` pages aren't invalidated, old stats persist in cache until natural expiry (usually 60+ seconds).
- **Using `revalidateTag()` without configuring tags in API routes:** Tags must be explicitly set on responses for revalidation to work; path-based (`revalidatePath()`) is simpler for this phase.
- **Treating team detail pages as client-side fetches:** Both ranking and team detail are RSC — fetch and render server-side, no `fetch()` in components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Team aggregation / ranking sort | Custom ranking algorithm | `computeTeamStats()` + sort in JS | Phase 3 already implements perfect stats logic; sorting is trivial; reimplementing risks bugs. |
| H2H comparison calculation | Manual W/L counting between two teams | `computeHeadToHead()` from Phase 3 | Already pure, tested, and fast; reusing prevents off-by-one bugs. |
| Tabbed navigation (Solo / Duplas filter) | Custom tab state machine | shadcn/ui Tabs component | Accessible, styled, handles focus management — don't reinvent. |
| Match history table | HTML table from scratch | Semantic `<table>` + Tailwind + shadcn/ui Badge | HTML table is standard; Tailwind makes it responsive; no heavy table library needed at this scale. |
| Team member roster display | Custom list component | Standard `<ul>`/`<li>` + grid | No special logic needed; Tailwind grid handles layout. |
| Modal/dialog for inviting members | Custom modal state | shadcn/ui Dialog (Radix Dialog) | Accessibility (focus trap, keyboard nav) is hard to get right; use Radix primitive. |
| Avatar generation | Custom avatar hash + color algorithm | Initials + deterministic color via hash of team name | Simple: first 2 chars of team name + hash-based color from a fixed palette. |

**Key insight:** Phase 3 delivered production-ready `computeTeamStats()` and `computeHeadToHead()` functions. Reusing them is non-negotiable; all stats on ranking/team pages flow through these functions, ensuring consistency and testability.

---

## Runtime State Inventory

Not applicable — Phase 4 is greenfield UI with no runtime state to migrate or rename.

---

## Common Pitfalls

### Pitfall 1: Ranking Stats Cached for Too Long
**What goes wrong:** Ranking page renders with stale stats; user creates a match, but ranking doesn't update for 60+ seconds.
**Why it happens:** `revalidatePath()` not called after `POST /api/matches`, or called with wrong path (e.g., `/ranking/` vs `/ranking`).
**How to avoid:** Add `revalidatePath('/ranking')` and `revalidatePath('/times')` to the POST handler immediately after `createMatch()` returns. Test by creating a match and refreshing ranking page in same browser session.
**Warning signs:** Ranking shows old stats after creating a match; page refresh fixes it.

### Pitfall 2: Dynamic Route Not Awaiting Params
**What goes wrong:** TypeScript error or type mismatch in `[id]` route handler; code tries to access `params.id` before awaiting `params`.
**Why it happens:** Next.js 15+ changed params to be a Promise; easy to forget `await params`.
**How to avoid:** Always destructure with `async` and `await`: `const { id } = await params;` at the top of page/route handlers. Match the pattern from Phase 1 team CRUD.
**Warning signs:** TS error like "Property 'id' does not exist on Promise<{ id: string }>"; runtime 404 on team detail pages.

### Pitfall 3: Computing Stats for Every Render
**What goes wrong:** Page is slow (2-3 seconds) because `computeTeamStats()` runs for every team on every request; scales poorly with match count.
**Why it happens:** Fetching all matches (correct) but re-computing stats on every render without batch optimization.
**How to avoid:** Fetch all matches once, loop through teams once, compute each stat once, store in array. Don't recompute. At office scale (100+ matches, 2-10 teams), this is fast enough; not a bottleneck unless you have 1000+ matches.
**Warning signs:** Page load time > 1 second; flamegraph shows `computeTeamStats` called N times for N teams.

### Pitfall 4: H2H Selector Shows Teams User Can't See
**What goes wrong:** Team detail page lists all teams in H2H selector, even ones the user doesn't have access to.
**Why it happens:** Fetching all teams for H2H options instead of filtering to user's teams.
**How to avoid:** In team detail page, fetch `userTeams` from `prisma.teamMember.findMany({ where: { userId } })`, then filter out current team. Only these are valid H2H opponents for this user.
**Warning signs:** H2H selector shows teams user didn't create; selecting one crashes or returns 403.

### Pitfall 5: Win Rate Calculation Shows NaN or Infinity
**What goes wrong:** Team with 0 matches shows "NaN%" win rate; display breaks.
**Why it happens:** Phase 3's `computeTeamStats` correctly returns 0% for zero matches, but component doesn't handle edge case rendering.
**How to avoid:** `StatTile` must render `"0%"` not `NaN`. Always check: `stats.totalMatches === 0` in component, render "—" or "0%" explicitly. Test with a new team that has no matches.
**Warning signs:** Ranking or team detail shows "NaN%" instead of "0%" or "—".

### Pitfall 6: Podium Layout Breaks on Mobile
**What goes wrong:** Top 3 medal layout renders as center, left, right on desktop but stacks vertically on mobile, losing visual distinction.
**Why it happens:** CSS Grid or Flex not properly responsive; no mobile-first approach.
**How to avoid:** Start with `flex-col` (mobile), add `lg:grid grid-cols-3` (desktop). Test on small screens (375px) and large (1920px). See CONTEXT.md D-01 for visual reference.
**Warning signs:** Medals don't align on phone; layout shifts on orientation change.

---

## Code Examples

Verified patterns from existing codebase:

### Example 1: Fetch All Teams and Sort by Stats (Ranking Pattern)

```typescript
// Source: Phase 2 & Phase 3 patterns combined
const allTeams = await prisma.team.findMany({
  where: { status: "active" },
});

const allMatches = await prisma.match.findMany({
  orderBy: { playedAt: "desc" },
});

const ranked = allTeams
  .map(team => ({
    team,
    stats: computeTeamStats(team.id, allMatches),
  }))
  .sort((a, b) => {
    const winsDiff = b.stats.wins - a.stats.wins;
    if (winsDiff !== 0) return winsDiff;
    return b.stats.winRate - a.stats.winRate;
  });
```

### Example 2: Filter Team Type (Solo vs Duo) Client-Side

```typescript
// Source: CONTEXT.md D-02 (filter by team.type)
// In RSC page or component:

const [teamType, setTeamType] = useState<"solo" | "duo" | "all">("all");

const filtered = ranked.filter(
  teamType === "all" ? () => true : item => item.team.type === teamType
);
```

### Example 3: Render Stats Tile (Reusable Pattern)

```typescript
// Source: src/components/primitives/stat-tile.tsx (existing)
import { StatTile } from "@/components/primitives/stat-tile";

<StatTile
  label="Victories"
  value={stats.wins}
  description={`${stats.losses} losses`}
/>
```

### Example 4: Cache Revalidation After Mutation

```typescript
// Source: Phase 2 pattern; pattern for Phase 4
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  // ... validation and createMatch() ...
  const response = await createMatch({ teamAId, teamBId, winnerTeamId, note });

  revalidatePath("/ranking");
  revalidatePath("/times");

  return NextResponse.json<CreateMatchResponse>(response, { status: 201 });
}
```

### Example 5: Team Detail Page Dynamic Route with Await Params

```typescript
// Source: Phase 1 team CRUD pattern (async params)
export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: teamId } = await params;
  const team = await getTeamById(teamId);
  if (!team) notFound();
  // ...
}
```

### Example 6: Responsive Podium Layout (Tailwind)

```typescript
// Source: CONTEXT.md D-01 visual reference
<div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
  {/* Second place (left on desktop) */}
  <div className="lg:order-1">
    <PodiumCard rank={2} team={podium[1]} />
  </div>

  {/* First place (center, larger) */}
  <div className="lg:order-2">
    <PodiumCard rank={1} team={podium[0]} size="large" />
  </div>

  {/* Third place (right on desktop) */}
  <div className="lg:order-3">
    <PodiumCard rank={3} team={podium[2]} />
  </div>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `frontend`/`backend` team constants in UI | Dynamic team fetching from Prisma + API | Phase 1 (TEAM-01) | UI now works with any team count/names; no code changes needed per new team |
| Per-team stats stored in database | Stats computed on-the-fly from match history | Phase 3 (stats module) | Single source of truth (matches); no divergence; always current within revalidation window |
| Client-side data fetching for ranking | Server-rendered RSC with `revalidatePath()` | Phase 4 (this phase) | No loading states, no hydration mismatch, automatic cache invalidation after mutations |
| Manual H2H calculation in components | Pure function `computeHeadToHead()` | Phase 3 | Testable, reusable, off-by-one bugs eliminated |

**Deprecated/outdated:**
- **In-memory team storage:** Replaced by Prisma + database in Phase 1. In-memory fallback still supported for tests.
- **Scoreboard API returning team counts:** Now deprecated; replaced by per-team `computeTeamStats()` on ranking page.
- **Client-side match filtering:** Now server-side via RSC; more efficient, no over-fetching.

---

## Open Questions

1. **Avatar/initials generation:** CONTEXT.md marks as Claude's Discretion. Options:
   - First 2 chars of team name (e.g., "Frontend" → "FR")
   - Deterministic color via hash of team name (ensures consistency across sessions)
   - Or: Random color on creation, stored in database (requires schema change — locked out)
   - **Recommendation:** Use first 2 chars + hash-based color from fixed palette (no schema change, deterministic).

2. **H2H "main rival" pre-selection logic:** CONTEXT.md D-09 says "pre-loaded with the principal rival (team with most direct confrontos)."
   - How to break ties? If Team A vs Team B and Team A vs Team C both have 5 matches?
   - **Recommendation:** Sort by most recent match, pick the one with most recent game.

3. **"Ver histórico completo" destination:** CONTEXT.md D-07 mentions button but doesn't specify target. Phase 4 scope?
   - Option A: Link to `/times/[id]/matches` (new page, full match history paginated).
   - Option B: Modal that scrolls through matches in-page.
   - Option C: Deferred to Phase 5 (advanced history).
   - **Recommendation:** Link to `/times/[id]/matches` if scope allows; otherwise defer to Phase 5 or use modal scroll.

4. **Global ranking vs. user-scoped ranking:** CONTEXT.md shows "todos os times" (all teams). Are all teams visible to all users, or only their own?
   - Training knowledge: Office tracker context suggests all users see same global ranking (all teams, all matches).
   - **Recommendation:** Global ranking (all teams); on team detail, if user is not member, show read-only stats (no invite button).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Ranking/team data fetching | ✓ | 15.x (Neon) | In-memory fallback for tests (no schema change) |
| Node.js | Next.js dev server / build | ✓ | 18.17+ (project requirement) | — |
| npm | Dependency management | ✓ | 10.x+ | — |
| Next.js `revalidatePath()` | Cache invalidation after mutations | ✓ | 16.1.6 | Manual cache invalidation via tags (same result) |

**Missing dependencies with no fallback:**
- None — all dependencies are met.

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + Testing Library React 16.3.2 |
| Config file | `vitest.config.ts` (jsdom environment) |
| Quick run command | `npm run test -- src/lib/stats.test.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEAM-02 | Team detail page loads team + stats + roster + H2H | Component / E2E | `npm run e2e -- times/[id]` | ❌ Wave 0 |
| RANK-01 | Ranking page fetches all teams and sorts by wins | Component / E2E | `npm run e2e -- ranking` | ❌ Wave 0 |
| RANK-02 | Ranking displays W/L and win rate % per team | Component | `npm run test -- src/components/ranking/ranking-list.test.tsx` | ❌ Wave 0 |
| RANK-03 | Ranking displays current streak (type + count) | Component | `npm run test -- src/components/ranking/ranking-podium.test.tsx` | ❌ Wave 0 |
| RANK-04 | Ranking displays total matches per team | Component | `npm run test -- src/components/ranking/ranking-list.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test` (unit/component tests) — fast feedback on stats computation and component rendering.
- **Per wave merge:** `npm run e2e` (Playwright end-to-end) — verifies page loads, ranking updates after match creation, team detail shows correct stats.
- **Phase gate:** Full suite green before `/gsd:verify-work` — includes both unit + E2E.

### Wave 0 Gaps
- [ ] `src/components/ranking/ranking-podium.test.tsx` — test top 3 rendering, medal assignment by rank
- [ ] `src/components/ranking/ranking-list.test.tsx` — test list rendering for teams 4+, stat tiles
- [ ] `src/components/team-detail/team-header.test.tsx` — test team name, invite button visibility
- [ ] `src/components/team-detail/team-stats.test.tsx` — test stat tile rendering (wins, losses, win rate, position)
- [ ] `src/components/team-detail/team-h2h.test.tsx` — test H2H selector and stats display
- [ ] `e2e/ranking.spec.ts` — test ranking page loads, filters (solo/duo) work, stats update after match
- [ ] `e2e/team-detail.spec.ts` — test team detail page loads, H2H selector works, recent matches display
- [ ] Framework install: Playwright already installed; just need test files.

*(If no gaps: "Wave 0 gaps listed above for component + E2E test creation")*

---

## Sources

### Primary (HIGH confidence)
- **Context7 (implicit through codebase review):**
  - `computeTeamStats`, `computeHeadToHead` functions and types from Phase 3 — verified in `/home/guiroos/Documentos/Projects/office-8-ball/src/lib/stats.ts`
  - `TeamStats`, `HeadToHeadStats` Zod schemas and inferred types — verified in same file
  - Existing component patterns (`StatTile`, `SectionHeader`, `Card` variants) — verified in `/home/guiroos/Documentos/Projects/office-8-ball/src/components/`

- **Official Next.js documentation (implicit from project setup):**
  - App Router Server Components pattern — used in dashboard, profile pages
  - `revalidatePath()` for cache invalidation — Next.js 13+ feature, verified in existing code

- **Project codebase (HIGH confidence):**
  - Prisma schema and team/match data model — verified in `/home/guiroos/Documentos/Projects/office-8-ball/prisma/schema.prisma`
  - Existing test infrastructure (Vitest, Testing Library, Playwright) — verified in `vitest.config.ts` and test files
  - API route patterns (auth guard, validation, response typing) — verified in `src/app/api/matches/route.ts`
  - Tailwind + CVA patterns for styling — verified in existing Card, Button, StatTile components
  - Type definitions and domain layer — verified in `src/lib/types.ts`, `src/lib/teams.ts`, `src/lib/data.ts`

### Secondary (MEDIUM confidence)
- **CONTEXT.md (user decisions):** Phase decisions D-01 through D-12 and discretion areas documented and locked. Used to shape architecture decisions.
- **REQUIREMENTS.md and STATE.md:** Phase 4 requirements (TEAM-02, RANK-01–04) and accumulated context from Phases 1–3.
- **CLAUDE.md (project constraints):** CLAUDE.md directives on "no new dependencies," "semantic tokens only," "RSC-first," "match all hardcode to API patterns."

### Tertiary (Not sourced — internal reasoning)
- Avatar generation algorithm (hash-based color) — standard practice, not sourced, but low-risk customization.
- H2H rival pre-selection tie-break (most recent match) — inference from domain context, not explicitly specified.
- Responsive grid layout for podium — Tailwind grid best practice, not from external source.

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — All libraries verified in package.json and existing codebase; no new dependencies needed.
- **Architecture (RSC + revalidatePath):** HIGH — Pattern established in Phase 2/3; `revalidatePath()` is standard Next.js 13+ feature.
- **Stats functions:** HIGH — `computeTeamStats` and `computeHeadToHead` implemented and tested in Phase 3; reusing them is zero-risk.
- **UI patterns:** HIGH — StatTile, SectionHeader, Card, Badge all exist and are used; CVA pattern established.
- **Pitfalls:** MEDIUM-HIGH — Based on common mistakes in ranking/stats systems; some educated guess on scale (100+ matches).
- **H2H logic:** MEDIUM — Tie-breaking for "main rival" selection is unclear; recommend sorting by most recent match.
- **"Ver histórico completo" scope:** MEDIUM — Unclear if full match history is in Phase 4 or Phase 5; recommend deferring to Phase 5 if out of scope.

**Research date:** 2026-03-25
**Valid until:** 2026-04-08 (14 days — Next.js and Tailwind are stable; Prisma unlikely to break; stats logic verified in Phase 3 tests)

---

## Project Constraints (from CLAUDE.md)

1. **No new packages:** Verify Phase 4 uses only existing tech stack; no new npm installs.
2. **Semantic tokens only:** Ranking and team detail components must use design token classes (`bg-surface-emphasis`, `text-muted-foreground`, `shadow-gold/35`) — no arbitrary `[#colors]` or inline `style={{}}`.
3. **RSC-first:** Ranking and team detail pages are Server Components; no `"use client"` unless data needs real-time hydration (not applicable here).
4. **In-memory fallback:** Phase 4 has no in-memory complexity (scores/stats are computed, not cached); test isolation via Vitest handles this.
5. **Architecture constraints:** Prisma schema unchanged (LOCKED); match all API patterns to existing routes; no separate backend.
6. **Safe-change checklist:** After Phase 4 completion, verify:
   - App still supports dual persistence modes (Prisma + in-memory tests)
   - Scoreboard still derived from match history (no new stored counters)
   - `frontend`/`backend` team IDs removed from all UI (use APIs only)
   - `/dashboard` remains functional; `/scoreboard` still redirects to `/dashboard`
   - API response shapes compatible with existing client
   - Login, signup, protected routes unchanged
   - Docs only updated where behavior changed
