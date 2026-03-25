# Phase 2: Scoreboard Reactivation & Match Recording - Research

**Researched:** 2026-03-25
**Domain:** Scoreboard API reactivation for dynamic teams; match recording with dynamic team selection
**Confidence:** HIGH

## Summary

Phase 1 completed team CRUD with dynamic team creation. Phase 2 must reactivate the scoreboard API and match recording to work with user-created teams instead of the hardcoded `frontend`/`backend` constants. This involves: (1) reimplementing `/api/scoreboard` to fetch all user's teams and compute standings dynamically, (2) updating `/api/matches` POST to support any team pair the user is a member of, (3) updating the dashboard UI to fetch teams dynamically and use them in team selection, and (4) ensuring scoreboard query has no limits to prevent silent data corruption.

The core challenge is migrating from a two-team constant model to multi-team dynamic standings while preserving the invariant that scoreboard is always derived (never stored) from match history. The architecture remains unchanged: stats computed in application layer, no database aggregates.

**Primary recommendation:** Implement `/api/scoreboard` as two separate tasks: (1) fetch all user's teams with match history from database, (2) compute aggregated standings per team in application layer using pure functions prepared in Phase 3.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Dashboard exibe times buscados dinamicamente de `/api/teams` (sem hardcode de `frontend`/`backend`) | `useTeamsData()` hook research + dynamic dashboard component refactor identified |
| DASH-02 | API `/api/scoreboard` retorna W/L agregado por time (reimplementada para times dinâmicos) | Scoreboard reimplementation pattern documented; query structure for multi-team setup defined |

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for Phase 2 yet. Constraints inherited from Phase 1 decisions:

**Locked (from STATE.md):**
- D-01: Stats computation in application layer (not database)
- D-02: Dual-mode persistence (in-memory + Prisma) must be maintained
- D-04: Team-centric ranking (not player-centric initially)
- Scoreboard always derived from match history, never stored

**Inherited architecture constraints (from architecture.md):**
- Do not introduce a separate backend service
- Do not persist aggregated scoreboard counters
- Do not break in-memory fallback
- `getScoreboard()` must fetch ALL match records with no limit
- Team IDs and schema must remain in sync across constants + seed + database

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | Full-stack framework with App Router | Official recommendation; proven track record |
| React | 19.2.4 | Component library; custom hooks | Official React patterns for data fetching |
| Prisma | 7.5.0 | ORM for PostgreSQL queries | Query filtering by user teams; match history fetch with no limit |
| PostgreSQL | (Neon) | Persistent database | Indexes on `team_a_id`, `team_b_id`, `winner_team_id` already present |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 4.3.6 | Request validation | Validate match payload teamAId, teamBId, winnerTeamId |
| sonner | 2.0.7 | Toast notifications | User feedback for match registration success/failure |
| class-variance-authority (CVA) | 0.7.1 | Component variants | Dashboard team selection if adding conditional styling |
| @testing-library/react | 16.3.2 | Component testing | `useDashboardData()` hook tests |
| Vitest | 4.1.0 | Unit and route tests | Data layer tests, route handler tests |

**Installation (if new):**
All libraries already installed. No new packages needed.

## Architecture Patterns

### Recommended Project Structure

No new directories needed. Phase 2 modifies existing routes:

```
src/
├── app/api/
│   ├── scoreboard/
│   │   ├── route.ts          # MODIFY: GET /api/scoreboard reimplemented
│   │   └── route.test.ts     # MODIFY: Test new scoreboard logic
│   └── matches/
│       ├── route.ts          # MODIFY: POST validation expanded for dynamic teams
│       └── route.test.ts     # VERIFY: Tests still pass with new team selection
├── components/dashboard/
│   ├── index.tsx             # MODIFY: Remove hardcoded TEAMS constant
│   ├── use-dashboard-data.ts # MODIFY: Add useTeamsData() hook
│   └── dashboard-hero.tsx    # MODIFY: Update to use dynamic teams
├── lib/
│   ├── data.ts               # MODIFY: Add getScoreboard() implementation
│   └── types.ts              # ADD: ScoreboardTeam type (optional; may reuse existing)
```

### Pattern 1: Scoreboard Data Fetching (Two-Step Approach)

**What:** Scoreboard API is stateless. Query aggregates matches for all user's teams, then computes standings in application layer.

**When to use:** Always — there are no stored scoreboard counters.

**Step 1: Fetch matches for all user's teams**

```typescript
// Source: Phase 2 research + existing Match schema relationships
async function getScoreboardMatches(userId: string): Promise<MatchRecord[]> {
  // 1. Get all teams user is member of
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = memberships.map((m) => m.teamId);
  if (teamIds.length === 0) return [];

  // 2. Get ALL matches involving any of those teams
  // NOTE: NO LIMIT — this is critical to prevent silent scoreboard corruption
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { teamAId: { in: teamIds } },
        { teamBId: { in: teamIds } },
      ],
    },
    orderBy: { playedAt: "desc" },
  });

  return matches.map(normalizeMatch);
}
```

**Step 2: Compute standings (prepared for Phase 3)**

```typescript
// Source: Phase 2 research; implementation deferred to Phase 3
// Shape: { teamId, wins, losses, winRate, currentStreak, longestStreak }

interface TeamStanding {
  teamId: string;
  wins: number;
  losses: number;
  winRate: number;        // 0-100
  currentStreak: {
    type: "win" | "loss";
    count: number;
  };
  longestStreak: {
    type: "win" | "loss";
    count: number;
  };
}

function computeTeamStandings(
  teamId: string,
  allMatches: MatchRecord[]
): TeamStanding {
  // Filters matches where this teamId is either teamA or teamB
  const teamMatches = allMatches.filter(
    (m) => m.teamAId === teamId || m.teamBId === teamId
  );

  const wins = teamMatches.filter((m) => m.winnerTeamId === teamId).length;
  const losses = teamMatches.length - wins;
  const winRate = teamMatches.length > 0 ? (wins / teamMatches.length) * 100 : 0;

  // currentStreak and longestStreak computed backward from newest match
  // Implementation in Phase 3 stats module

  return { teamId, wins, losses, winRate, currentStreak: {...}, longestStreak: {...} };
}
```

### Pattern 2: Match Recording with Dynamic Teams

**What:** POST /api/matches must validate that user is member of at least one of the two teams, and both teams exist and are active.

**When to use:** Every match record operation.

**Current state (Phase 2):**

```typescript
// Source: src/app/api/matches/route.ts (existing)
// Key validation order:
1. getAuthenticatedUser() — 401 if no session
2. Validate payload: teamAId, teamBId, winnerTeamId, note
3. Verify teamA and teamB exist (by ID)
4. Verify both teams are active (status === "active")
5. Verify user is member of at least one team
6. Create match; return 201

// Payload schema (no changes from Phase 1)
const createMatchSchema = z.object({
  teamAId: z.string().min(1),
  teamBId: z.string().min(1),
  winnerTeamId: z.string().min(1),
  note: z.string().max(140).optional(),
});
```

**Change in Phase 2:** Remove hardcoded team ID validation (`isValidTeamId()`). Rely on database lookup to find teams by ID.

### Pattern 3: Dashboard Team Selection Hook

**What:** New hook `useTeamsData()` fetches user's teams and formats them for the team selection UI.

**When to use:** Dashboard component needs to display dynamic team buttons.

**Example:**

```typescript
// Source: Phase 2 research; location: src/components/dashboard/use-teams-data.ts
async function useTeamsData() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/teams", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch teams");
        const { teams } = (await response.json()) as TeamsResponse;
        setTeams(teams);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { teams, loading };
}
```

### Anti-Patterns to Avoid

- **Hardcoding team IDs in UI:** Dashboard still has `TEAMS` constant with `frontend`/`backend`. Phase 2 must remove this and fetch from `/api/teams`. Leaving it will cause UI-API mismatch.
- **Limiting scoreboard query:** `getScoreboard()` must fetch ALL matches with `.findMany({ ... })` (no `.take(n)`). Even a 1000-match limit silently breaks win counts and streaks.
- **Computing standings in database:** No SQL aggregates. Derive wins/losses/streaks in application layer only — this keeps the schema simple and stats testable.
- **Storing computed scoreboard values:** Never add a `scoreboard_stats` table or denormalized `Team.wins` field. Always compute from matches on-demand.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Team name lookups | Custom team registry | `prisma.team.findMany()` with `.where({ id: { in: teamIds } })` | Database is source of truth; prevents stale caches |
| Match filtering by user | Loop through all matches in memory | Prisma `.findMany()` with OR clause on `teamAId` and `teamBId` | Indexes on those columns optimize queries; avoids N+1 |
| Scoreboard aggregation (Phase 3) | SQL window functions | Application-layer pure functions (Phase 3) | Keeps schema simple; stats are testable; single source of truth is match history |
| Rate limiting on match creation | Custom timer logic | Existing auth rate limit pattern (in `src/lib/auth-rate-limit.ts`) if needed; not required for Phase 2 | Implement per-user throttling only if UX requires it later |

**Key insight:** Scoreboard complexity is inherent to computing stats from match history. Trying to store it introduces sync problems. Phase 2 focuses on making the query efficient; Phase 3 adds pure stat functions.

## Common Pitfalls

### Pitfall 1: Silent Scoreboard Corruption via Query Limits

**What goes wrong:** Adding `.take(100)` to the match query returns only the first 100 matches, silently producing wrong win counts, lead differences, and streaks.

**Why it happens:** No error is raised; the query succeeds but returns incomplete data. Scoreboard looks correct for small match counts, then breaks mysteriously at scale.

**How to avoid:** Document that `getScoreboard()` queries with NO LIMIT. If performance becomes an issue (100+ matches in prod), optimize via indexes or archival — never limit the query.

**Warning signs:**
- Scoreboard wins diverge from manual count
- Streaks reset unexpectedly after many matches
- Tests pass with 10 matches, fail with 200

### Pitfall 2: UI Disconnected from Dynamic APIs

**What goes wrong:** Dashboard still renders hardcoded `frontend`/`backend` team buttons, but `/api/matches` rejects them because user has no membership.

**Why it happens:** UI was written for the constant-teams phase. Phase 1 adds dynamic teams; Phase 2 must update the UI to fetch them.

**How to avoid:** Remove hardcoded `TEAMS` constant from `src/components/dashboard/index.tsx`. Implement `useTeamsData()` hook. Render buttons dynamically from fetched teams.

**Warning signs:**
- "Você precisa ser membro de pelo menos um dos times" error on every match attempt
- UI shows buttons for teams that don't exist
- Dashboard works for `frontend`/`backend` but fails for user-created teams

### Pitfall 3: Derived Stats Cached Without Revalidation

**What goes wrong:** Dashboard caches scoreboard on first load; match registration updates database but UI still shows old stats.

**Why it happens:** React hooks cache responses in memory. After `POST /api/matches`, the hook must refetch data to stay in sync.

**How to avoid:** Dashboard already refetches after match creation (line 93 of `use-dashboard-data.ts`). Verify this continues to work.

**Warning signs:**
- New match appears in recent history but not in win counts
- Scoreboard says "Frontend 5 wins" but recent matches show 6

### Pitfall 4: Database Not Found Errors During Team Lookup

**What goes wrong:** User creates a team, immediately tries to record a match, but lookup fails with 404 "Team not found."

**Why it happens:** Timing issue (unlikely but possible if transaction is slow). Or: user no longer has membership.

**How to avoid:** Verify team exists before allowing match creation. Verify user is member. Use transaction if needed (Prisma's built-in validation should suffice).

**Warning signs:**
- Intermittent 404 errors when creating matches on newly-created teams
- Errors go away if user waits a few seconds

### Pitfall 5: In-Memory Mode Breaks for Scoreboard

**What goes wrong:** Scoreboard API works with `DATABASE_URL` but returns empty result without it.

**Why it happens:** Phase 2 queries database directly. In-memory fallback in `src/lib/data.ts` is not hooked up.

**How to avoid:** Check: does Phase 2 need in-memory fallback? Per CLAUDE.md, in-memory is for dev/testing only. If API routes require in-memory, document the fallback pattern. Otherwise, return 503 (current behavior).

**Current state:** `/api/scoreboard` currently returns 503. Phase 2 will reactivate it with database-only implementation. In-memory fallback optional (flag as TODO if needed).

**Warning signs:**
- E2E tests fail without `DATABASE_URL` set
- Local development requires `DATABASE_URL` even for basic testing

## Code Examples

Verified patterns from official sources:

### Fetching Related Records (Prisma Pattern)

```typescript
// Source: Prisma docs; site:prisma.io/docs
const memberships = await prisma.teamMember.findMany({
  where: { userId },
  select: { teamId: true },
});
const teamIds = memberships.map((m) => m.teamId);

// Use in next query
const matches = await prisma.match.findMany({
  where: {
    OR: [
      { teamAId: { in: teamIds } },
      { teamBId: { in: teamIds } },
    ],
  },
  orderBy: { playedAt: "desc" },
});
```

### Zod Validation in Route Handler

```typescript
// Source: src/app/api/matches/route.ts (existing pattern)
const createMatchSchema = z.object({
  teamAId: z.string().min(1, "teamAId é obrigatório."),
  teamBId: z.string().min(1, "teamBId é obrigatório."),
  winnerTeamId: z.string().min(1, "winnerTeamId é obrigatório."),
  note: z.string().max(140).optional(),
});

const result = createMatchSchema.safeParse(payload);
if (!result.success) {
  return NextResponse.json<ApiErrorResponse>(
    { error: result.error.issues[0]?.message ?? "Dados inválidos." },
    { status: 400 },
  );
}
```

### Custom Hook for Data Fetching

```typescript
// Source: src/components/dashboard/use-dashboard-data.ts (existing pattern)
async function fetchDashboardData() {
  const [scoreboardResponse, matchesResponse] = await Promise.all([
    fetch("/api/scoreboard", { cache: "no-store" }),
    fetch("/api/matches", { cache: "no-store" }),
  ]);

  if (!scoreboardResponse.ok || !matchesResponse.ok) {
    throw new Error("Não foi possível carregar o placar.");
  }

  // ... parse responses
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({ ... });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchDashboardData();
        setState(data);
      } catch (error) {
        toast.error(...);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { ... state, loading, registerWin };
}
```

### Testing Data Layer with In-Memory Isolation

```typescript
// Source: .claude/rules/testing.md
describe("getScoreboard", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  it("returns empty array when user has no teams", async () => {
    const { getScoreboard } = await import("@/lib/data");
    const result = await getScoreboard("user-with-no-teams");
    expect(result).toEqual({ teams: [], leaderTeamId: null, ... });
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Two hardcoded teams (`frontend`, `backend`) | User-created dynamic teams with type (solo/duo) | Phase 1 (2026-03-25) | Schema added `TeamType` enum; constants removed; CRUD API implemented |
| Scoreboard temporarily disabled (503) | Scoreboard to be reimplemented for dynamic teams | Phase 2 (now) | Scoreboard API reactivated; aggregates all user's teams, not just two hardcoded |
| Hardcoded team selection in UI | Dynamic team fetching from `/api/teams` | Phase 2 (now) | Dashboard removes `TEAMS` constant; fetches from API |
| No match creation (placeholder UI) | Match creation functional with dynamic team pairs | Phase 1-2 (complete) | Users can record results between any pair of teams they're members of |

**Deprecated/outdated:**
- Hardcoded team constants: Removed in Phase 1. No backwards compatibility path needed.
- Static scoreboard UI: Being replaced by dynamic version in Phase 2. Old TODO comments in code can be removed.

## Open Questions

1. **Should `/api/scoreboard` compute all stats or only wins/losses?**
   - What we know: Phase 2 must return at least wins/losses per team; current spec includes leaderTeamId, leadBy, currentStreak
   - What's unclear: Should Phase 2 include streak computation or defer to Phase 3?
   - Recommendation: Phase 2 implements wins/losses only. Phase 3 adds streaks, win rates, head-to-head. Reduces Phase 2 scope and aligns with "pure functions in Phase 3" pattern.

2. **Should Phase 2 handle in-memory fallback for scoreboard?**
   - What we know: In-memory data layer exists for testing; Phase 1 did not expose it via `/api/scoreboard`
   - What's unclear: Is scoreboard API required to work without DATABASE_URL, or is 503 acceptable?
   - Recommendation: Return 503 (current behavior). Scoreboard is not part of domain layer; it's a read-only derived view. If tests need in-memory data, use data layer directly, not the API.

3. **What's the performance target for 100+ matches per team?**
   - What we know: ROADMAP targets < 500ms for office scale
   - What's unclear: Are database indexes sufficient, or will query optimization be needed?
   - Recommendation: Phase 2 uses existing indexes (`teamAId`, `teamBId`, `winnerTeamId` already in schema). Benchmark with 100 matches per team. If slow, Phase 3 can add composite indexes.

## Environment Availability

Database and required services are already operational (verified in Phase 1):

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Scoreboard API (GET), Match creation (POST) | ✓ | 15+ (Neon) | 503 Service Unavailable if `DATABASE_URL` missing |
| Prisma | Query team memberships, matches, team status | ✓ | 7.5.0 | In-memory mode for tests (optional for Phase 2) |
| Node.js | Next.js API runtime | ✓ | 18+ (Vercel) | — |
| npm | Dependency management | ✓ | 10.5+ | — |

**Notes:**
- No new external dependencies required
- All Prisma client already generated (runs on `postinstall`)
- Database migrations from Phase 1 already applied

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- src/app/api/scoreboard/route.test.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Dashboard fetches teams from `/api/teams` and renders them dynamically | component | `npm run test -- src/components/dashboard/index.test.tsx` | ❌ Wave 0 |
| DASH-02 | GET `/api/scoreboard` returns user's teams with combined match history | unit/route | `npm run test -- src/app/api/scoreboard/route.test.ts` | ✅ Placeholder |
| DASH-02 | POST `/api/matches` validates teamAId, teamBId are valid and user is member | unit/route | `npm run test -- src/app/api/matches/route.test.ts` | ✅ Exists |
| DASH-02 | Scoreboard query has NO limits (prevents silent corruption) | unit | `npm run test -- src/lib/data.test.ts` | ❌ Wave 0 |
| DASH-02 | Match appears in scoreboard for all users of both teams within 1 second | e2e | `npm run e2e -- scoreboard.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test -- src/app/api/scoreboard/route.test.ts`
- **Per wave merge:** `npm run test` (full suite)
- **Phase gate:** Full suite green + E2E tests passing

### Wave 0 Gaps

- [ ] `src/app/api/scoreboard/route.test.ts` — currently has placeholder; needs full rewrite
- [ ] `src/components/dashboard/index.test.tsx` — new; must test dynamic team rendering
- [ ] `src/lib/data.test.ts` — new tests for `getScoreboard()` with no-limit query guarantee
- [ ] `e2e/scoreboard.spec.ts` — E2E test: create match → verify in scoreboard (real DB)
- [ ] Framework install: Already installed (Vitest 4.1.0); no action needed

**Note:** Tests for stats computation (wins, streaks, etc.) are deferred to Phase 3. Phase 2 tests focus on API structure, team membership validation, and query correctness.

## Sources

### Primary (HIGH confidence)

- **Prisma Schema + Migrations** — `/home/guiroos/Documentos/Projects/office-8-ball/prisma/schema.prisma` (verified 2026-03-25)
  - Team, TeamMember, Match models verified; indexes on teamAId, teamBId, winnerTeamId confirmed
  - TeamType enum present (added Phase 1)
  - Relationships: Team.members (TeamMember), Match.teamA, Match.teamB, Match.winnerTeam

- **Existing API Routes** — `src/app/api/matches/route.ts`, `src/app/api/teams/route.ts`
  - Validation pattern (Zod safeParse) verified
  - Auth guard pattern (getAuthenticatedUser + getAuthRequiredResponse) confirmed
  - Team membership checking via Prisma query verified

- **Dashboard Hook** — `src/components/dashboard/use-dashboard-data.ts`
  - Fetch pattern (Promise.all, no-store cache) verified
  - Error handling (try-catch + toast) confirmed
  - State shape (scoreboard: { teams, leaderTeamId, leadBy }, matches: []) documented

- **Type Definitions** — `src/lib/types.ts`
  - MatchRecord, TeamRecord, CreateMatchResponse shapes verified
  - All types align with existing API responses

- **Testing Patterns** — `.claude/rules/testing.md`, `src/app/api/matches/route.test.ts`
  - Mock pattern for `getAuthenticatedUser` verified
  - Vi.mock for data layer and Prisma confirmed
  - beforeEach isolation pattern documented

### Secondary (MEDIUM confidence)

- **API Contracts Spec** — `techspec/api-contracts.md` (2026-03-22)
  - Current scoreboard response shape documented (teams, leaderTeamId, leadBy, totalMatches, currentStreak)
  - Match creation payload and validation rules captured

- **Scoreboard Tech Spec** — `techspec/scoreboard.md` (2026-03-22)
  - Invariants documented (no limits, derived not stored, leaderTeamId null on ties)
  - Legacy hardcoded team IDs noted (frontend/backend being replaced)

- **Architecture Rules** — `.claude/rules/architecture.md`, `.claude/rules/domain.md`
  - Constraint: `getScoreboard()` must fetch ALL matches confirmed
  - Constraint: No persisted counters confirmed
  - Constraint: Don't break in-memory fallback confirmed

### Tertiary (LOW confidence)

- **Package Versions** — npm registry (2026-03-25)
  - Verified via `npm view`: Next.js 16.2.1, React 19.2.4, Prisma 7.5.0
  - Versions align with CLAUDE.md requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already installed and documented in CLAUDE.md
- Architecture: HIGH — Phase 1 defined clear patterns; Phase 2 follows same patterns
- Pitfalls: HIGH — Domain.md explicitly documents no-limit query requirement and derived-stats pattern
- API shape: MEDIUM — Scoreboard response will change; current spec incomplete for dynamic teams

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days for stable domain; scoreboard architecture unlikely to change during implementation)

**Uncertainty flags:**
- Scoreboard response shape (wins/losses only vs. full stats) — clarify in planning phase
- In-memory fallback needed for scoreboard API — clarify in planning phase
- Performance optimization (indexes, caching) — defer to Phase 3 if needed

---

*Research completed: 2026-03-25*
*Next: `/gsd:plan-phase` to create Phase 2 execution plans*
