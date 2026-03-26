# Phase 5: User Profiles & Advanced Features - Research

**Researched:** 2026-03-26
**Domain:** Profile aggregation, period-filtered ranking, and dedicated head-to-head routing in Next.js App Router + Prisma
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Profile data architecture
- **D-01:** Perfil será montado server-side por assembler de domínio (RSC em `/profile`) com payload consolidado (user + stats agregadas + stats por time).
- **D-02:** `GET/PUT /api/profile` permanece focado em campos editáveis da conta (identidade/bio/avatar/email), sem agregar métricas de jogo.
- **D-03:** `/profile` adota renderização server-first com estados de rota (sem fluxo principal de loading por fetch client).
- **D-04:** Agregação de perfil ficará em módulo dedicado (ex.: `src/lib/profile-stats.ts`), não em `team-details.ts` e não no page component.

### Profile aggregation semantics
- **D-05:** "Partidas jogadas" conta partida quando usuário pertence a pelo menos um dos dois times da partida.
- **D-06:** Contagem usa membership atual (snapshot atual), sem janela histórica de membership nesta fase.
- **D-07:** Partidas de times arquivados continuam contando para agregados históricos do usuário.
- **D-08:** Se usuário pertencer aos dois times da mesma partida (edge case), a partida conta 1 vez.

### Ranking time filters
- **D-09:** Filtros temporais são `all`, `month`, `week`.
- **D-10:** `week` usa semana ISO (segunda a domingo) ancorada em `America/Sao_Paulo` (UTC-3).
- **D-11:** `month` usa mês calendário ancorado em `America/Sao_Paulo` (UTC-3).
- **D-12:** Filtro de período e filtro de tipo coexistem e são preservados em query params (ex.: `/ranking?type=solo&period=month`).
- **D-13:** Sem partidas no período/categoria exibe empty state explícito mantendo filtros visíveis (sem fallback automático para all-time).

### Dedicated head-to-head route
- **D-14:** Criar rota dedicada `/head-to-head?teamA=x&teamB=y`, complementar à seção H2H em `/times/[id]`.
- **D-15:** Sem query params, página auto-seleciona o primeiro par válido acessível pelo usuário.
- **D-16:** Query params inválidos/não autorizados não derrubam a página: mostrar mensagem de validação e recuperar com fallback válido.
- **D-17:** UI dedicada usa dois seletores explícitos (`Team A` e `Team B`) com prevenção de seleção do mesmo time nos dois lados.
- **D-18:** Alteração de seleção sincroniza imediatamente `teamA`/`teamB` na URL sem full reload, mantendo deep-link compartilhável.

### the agent's Discretion
- Detalhes visuais dos controles (tabs/chips/segmented) preservando linguagem UI existente.
- Texto final das mensagens de validação/empty state em PT-BR.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Filtro de intervalo customizado (`from`/`to`) no ranking.
- Timezone por usuário/perfil.
- Analytics avançado por jogador com histórico cronológico completo e drill-down.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROF-01 | Perfil do usuário mostra seus times com stats agregados | Profile assembler server-side + `profile-stats` domain module + per-team stats composition |
| PROF-02 | Perfil mostra win rate geral do jogador (across all teams) | Aggregation semantics + de-dup de partidas + reusable win-rate derivation |
| PROF-03 | Perfil mostra total de partidas jogadas pelo usuário | Membership-based match inclusion and unique match counting rule (D-05..D-08) |
| RANK-05 | Ranking suporta filtros por período (semana / mês / geral) | `period` query contract, Sao Paulo boundary helper, date-window Prisma filtering |
</phase_requirements>

## Summary

Phase 5 should be implemented as three domain additions, not route-local logic: a profile aggregation module, a ranking period-window module, and a dedicated head-to-head assembler for URL-driven comparisons. This matches existing architecture (`stats.ts`, `ranking.ts`, `team-details.ts`) and keeps `/profile`, `/ranking`, and `/head-to-head` pages thin server components.

The current profile UI (`src/components/profile/profile-page.tsx`) is still client-fetch based and hardcoded around legacy teams. Replace it with server-first rendering from a domain payload and keep `/api/profile` unchanged for editable identity fields only. Ranking period filters should extend existing type filtering (`/ranking?type=...`) with `period` while preserving both params and explicit empty states.

For time windows, enforce the locked business rule (America/Sao_Paulo / UTC-3) through a single helper used by ranking queries. Do not change Prisma schema and do not persist aggregates. Everything remains derived from match history on read.

**Primary recommendation:** Implement `src/lib/profile-stats.ts` and `src/lib/time-period.ts` first, then wire `/profile`, `/ranking`, and `/head-to-head` to these modules with query-param-preserving UI.

## Project Constraints (from project instructions)

- Do not edit `prisma/schema.prisma` without explicit approval; this phase must remain schema-neutral.
- Do not install new packages without approval.
- Keep dual-mode behavior (DB-backed and in-memory without `DATABASE_URL`) working.
- Keep protected API statuses (`401`, `409`, `429`, `500`, `503`) unchanged unless client handling/tests are updated.
- Keep `/dashboard` functional; `/scoreboard` remains legacy redirect.
- Keep stats derived from match history; do not persist aggregate counters.
- Use `@/` imports, named exports (except Next page/layout defaults), and server components by default.
- Route tests must mock `@/lib/auth`; data-layer in-memory tests must reset modules and dynamically import.
- Unit/route tests should not import Prisma directly.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `16.1.6` (repo), `16.2.1` latest | App Router pages, server components, query-param routing | Already the app framework; phase requires RSC + URL state |
| `react` | `19.2.3` (repo), `19.2.4` latest | UI composition for profile/ranking/H2H components | Existing rendering model and hooks |
| `prisma` + `@prisma/client` | `6.19.2` (repo), `7.5.0` latest | Match/team/user queries and date-window filtering | Existing DB abstraction and typed models |
| `next-auth` (Auth.js v4) | `4.24.13` | Authenticated user resolution for protected pages/routes | Existing auth contract in middleware/lib/auth |
| `zod` | `4.3.6` | Validation for query params and view-model contracts | Already used in routes and domain |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | `4.1.0` (repo), `4.1.2` latest | Unit and route tests for domain/filter behavior | For profile aggregation and period-window edge cases |
| `@playwright/test` | `1.58.2` | End-to-end deep-link and filter persistence checks | Optional final gate for `/head-to-head` URL behavior |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| App-layer UTC window helper | Raw SQL with `AT TIME ZONE` in `$queryRaw` | More SQL complexity and weaker type safety for this phase |
| Dedicated `profile-stats.ts` | Inline logic inside `/profile` page | Harder to test and reuse; violates D-04 |
| Keep H2H only in `/times/[id]` | Dedicated `/head-to-head` route | Existing section is not shareable/deep-linkable; D-14 requires route |

**Installation:**
```bash
# No new packages required for Phase 5.
```

**Version verification (npm registry, checked 2026-03-26):**
- `next@16.2.1` published `2026-03-20T23:31:11.148Z`
- `react@19.2.4` published `2026-01-26T18:23:10.244Z`
- `next-auth@4.24.13` published `2025-10-29T20:52:19.822Z`
- `prisma@7.5.0` published `2026-03-11T14:45:10.779Z`
- `@prisma/client@7.5.0` published `2026-03-11T14:44:35.031Z`
- `zod@4.3.6` published `2026-01-22T19:14:35.382Z`
- `vitest@4.1.2` published `2026-03-26T14:36:51.447Z`
- `@playwright/test@1.58.2` published `2026-02-06T16:42:52.725Z`

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/(authenticated)/
│   ├── profile/page.tsx              # RSC profile route consuming server assembler
│   ├── ranking/page.tsx              # Extends query parsing with period
│   └── head-to-head/page.tsx         # New dedicated authenticated route
├── components/
│   ├── profile/                      # Server-friendly profile view components
│   ├── ranking/                      # Type + period filter controls
│   └── head-to-head/                 # URL-synced selector UI
└── lib/
    ├── profile-stats.ts              # D-04 aggregation module
    ├── time-period.ts                # week/month/all period boundaries (UTC-3)
    ├── ranking.ts                    # accepts type + period and applies date window
    └── head-to-head.ts               # dedicated route assembler + validation/fallback
```

### Pattern 1: Server Assembler for Profile (D-01, D-03, D-04)
**What:** Build one domain payload combining identity + aggregate stats + per-team stats; page renders it directly.
**When to use:** Any authenticated route where all core data is available server-side.
**Example:**
```typescript
// Source: local code pattern from src/lib/team-details.ts + D-01..D-04
export async function getProfilePageData(userId: string) {
  const teams = await listUserTeams(userId, true); // include archived for D-07
  const teamIds = teams.map((t) => t.id);
  const matches = await listMatchesForTeams(teamIds); // ordered desc
  return buildProfileStats({ userId, teams, matches });
}
```

### Pattern 2: Period Window Helper + Ranking Query Composition
**What:** Parse `period` query once, compute date boundaries once, apply in Prisma `where`.
**When to use:** Any route/service that filters match-derived stats by time.
**Example:**
```typescript
// Source: Prisma filtering style in docs + existing src/lib/ranking.ts query style
const { startUtc, endUtc } = resolvePeriodWindow(period, new Date());
const where = startUtc && endUtc ? { playedAt: { gte: startUtc, lt: endUtc } } : {};

const matchRows = await prisma.match.findMany({
  where: {
    OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }],
    ...where,
  },
  orderBy: { playedAt: "desc" },
});
```

### Pattern 3: URL-Driven H2H Route With Validation + Fallback
**What:** Parse `teamA/teamB` from URL, validate ownership and distinct IDs, render fallback pair and message when invalid.
**When to use:** Deep-linkable comparisons where state must survive refresh/share.
**Example:**
```typescript
// Source: query-param style from src/app/(authenticated)/ranking/page.tsx + D-14..D-18
const requested = parseHeadToHeadParams(searchParams);
const resolved = resolveValidPair(requested, viewerTeams); // never throws
return { pair: resolved.pair, warning: resolved.warning };
```

### Anti-Patterns to Avoid
- **Client-first profile fetch loop:** Re-implementing `/profile` with `useEffect(fetch)` keeps hardcoded/partial state and violates D-01/D-03.
- **Date logic duplicated in components and data layer:** Causes inconsistent week/month boundaries and hard-to-reproduce bugs.
- **Auto-fallback from empty filtered ranking to all-time:** Violates D-13.
- **Adding profile/ranking aggregate columns in DB:** Violates phase constraints and D-06/D-07 principles.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Team/per-team stat formulas | New ad-hoc W/L and H2H math | `computeTeamStats` and `computeHeadToHead` from `src/lib/stats.ts` | Existing, tested formulas reduce regression risk |
| Profile aggregate engine in UI | Local state math inside React component | `src/lib/profile-stats.ts` pure domain module | Testable, reusable, server-friendly |
| Auth/session checks in each component | Custom cookie/session parsing | `getAuthenticatedUser`, `hasDatabaseUrl`, existing middleware pattern | Consistent protected-route behavior |
| Query param mutation | Manual string concatenation for URLs | `URLSearchParams` + Next Router/Link | Prevents dropping `type`/`period` params accidentally |

**Key insight:** This phase is mainly composition work over existing domain primitives; custom reimplementation creates drift from already-tested stats behavior.

## Common Pitfalls

### Pitfall 1: Double-counting user matches
**What goes wrong:** Same match counted twice when user belongs to both teams.
**Why it happens:** Naive loops add per-team totals without unique match ID set.
**How to avoid:** Aggregate by unique match IDs, then derive wins/losses once per match.
**Warning signs:** `wins + losses` greater than deduplicated `totalMatches`.

### Pitfall 2: Wrong week/month boundaries
**What goes wrong:** Filters include/exclude wrong matches near midnight.
**Why it happens:** Boundary calculations in server local timezone or UTC without UTC-3 normalization.
**How to avoid:** Central `time-period` helper with explicit Sao Paulo/UTC-3 boundaries.
**Warning signs:** Tests fail for Sunday/Monday and month rollover timestamps.

### Pitfall 3: Broken deep links for H2H
**What goes wrong:** Invalid `teamA/teamB` throws or blanks page.
**Why it happens:** Route assumes params are always valid.
**How to avoid:** Validate params against accessible teams, show warning, and fallback to first valid pair.
**Warning signs:** 500/404 on malformed URLs.

### Pitfall 4: Middleware mismatch for new protected route
**What goes wrong:** `/head-to-head` is accessible unauthenticated or redirects inconsistently.
**Why it happens:** `middleware.ts` matcher not updated when route is added.
**How to avoid:** Add `/head-to-head/:path*` to matcher in same task as route creation.
**Warning signs:** Auth tests pass on existing routes but fail on new route.

## Code Examples

Verified patterns from existing codebase and official docs:

### Profile aggregation with de-dup
```typescript
// Source: src/lib/stats.ts + Phase 5 decisions D-05..D-08
const uniqueMatches = new Map(matches.map((m) => [m.id, m]));
let wins = 0;
let losses = 0;

for (const match of uniqueMatches.values()) {
  const userInMatch = teamIds.has(match.teamAId) || teamIds.has(match.teamBId);
  if (!userInMatch) continue;
  if (teamIds.has(match.winnerTeamId)) wins++;
  else losses++;
}

const totalMatches = wins + losses;
const winRate = totalMatches === 0 ? 0 : (wins / totalMatches) * 100;
```

### Preserve `type` + `period` filters in ranking links
```tsx
// Source: src/components/ranking/type-tabs.tsx pattern, extended for D-12
const params = new URLSearchParams(searchParams);
params.set("period", nextPeriod);
return `/ranking?${params.toString()}`;
```

### Robust head-to-head fallback resolution
```typescript
// Source: src/lib/team-details.ts rival-selection style + D-15/D-16
function resolveValidPair(input: { teamA?: string; teamB?: string }, teams: TeamRecord[]) {
  const ids = new Set(teams.map((t) => t.id));
  const validA = input.teamA && ids.has(input.teamA) ? input.teamA : null;
  const validB = input.teamB && ids.has(input.teamB) ? input.teamB : null;
  if (validA && validB && validA !== validB) return { pair: [validA, validB], warning: null };
  const fallback = teams.length >= 2 ? [teams[0]!.id, teams[1]!.id] : [null, null];
  return { pair: fallback, warning: "Seleção inválida; exibindo confronto disponível." };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side profile fetching with hardcoded team placeholders | Server-side profile assembler + reusable domain module | Phase 5 target (2026-03) | Deterministic SSR payload, no stale client boot state |
| Ranking filtered only by team type | Combined type + period query contract | Phase 5 target (2026-03) | Time-scoped standings with shareable URLs |
| H2H only inside `/times/[id]` selector | Dedicated `/head-to-head` deep-linkable route plus team detail section | Phase 5 target (2026-03) | Better navigation/shareability without losing existing section |

**Deprecated/outdated:**
- Hardcoded profile team constants (`frontend/backend`) in `src/components/profile/profile-page.tsx`.
- Profile main content driven by `/api/matches` client fetch rather than server assembler payload.

## Open Questions

1. **Exact timezone implementation strategy for `America/Sao_Paulo` boundary math**
   - What we know: Locked decisions require Sao Paulo semantics and label UTC-3.
   - What's unclear: Whether to treat this strictly as fixed UTC-3 offset or as named timezone conversion behavior across historical dates.
   - Recommendation: Implement fixed UTC-3 in `time-period.ts` for Phase 5 consistency; document as explicit product rule and revisit only if user-level timezone becomes in-scope.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/tests/runtime tooling | ✓ | `v24.14.0` | — |
| npm/npx | Scripts, test execution | ✓ | `11.9.0` | — |
| Local Playwright via npx | E2E deep-link verification | ✓ | `1.58.2` | Vitest integration coverage only |
| PostgreSQL CLI (`psql`) | Manual DB inspection/debug | ✗ | — | Use Prisma queries/tests instead |
| Docker | Optional local DB provisioning | ✓ | `29.2.1` | Existing DB instance/in-memory mode |

**Missing dependencies with no fallback:**
- None for planning and implementation.

**Missing dependencies with fallback:**
- `psql` missing; use Prisma Client and route/data-layer tests for verification.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.0` (repo), Playwright `1.58.2` |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `npm run test -- src/lib/profile-stats.test.ts src/lib/ranking.test.ts src/components/ranking/ranking-view.test.tsx` |
| Full suite command | `npm run typecheck && npm run test && npm run e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Profile lists user teams with per-team stats | unit/integration | `npm run test -- src/lib/profile-stats.test.ts src/app/(authenticated)/profile/page.test.tsx` | ❌ Wave 0 |
| PROF-02 | Profile computes overall win rate across teams | unit | `npm run test -- src/lib/profile-stats.test.ts -t "overall win rate"` | ❌ Wave 0 |
| PROF-03 | Profile total matches uses de-duplicated membership semantics | unit | `npm run test -- src/lib/profile-stats.test.ts -t "counts unique matches"` | ❌ Wave 0 |
| RANK-05 | Ranking supports all/week/month with query persistence and empty states | unit/component | `npm run test -- src/lib/ranking.test.ts src/components/ranking/ranking-view.test.tsx` | ⚠️ Partial |

### Sampling Rate
- **Per task commit:** `npm run test -- src/lib/profile-stats.test.ts src/lib/ranking.test.ts`
- **Per wave merge:** `npm run typecheck && npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/profile-stats.test.ts` — covers PROF-01/02/03 aggregation semantics
- [ ] `src/lib/time-period.test.ts` — week/month boundary edge cases (Sunday/Monday and month rollover)
- [ ] `src/app/(authenticated)/profile/page.test.tsx` — server-rendered profile payload wiring
- [ ] `src/app/(authenticated)/head-to-head/page.test.tsx` — invalid query fallback and default pair behavior
- [ ] Extend `src/lib/ranking.test.ts` for `period` date-window filtering
- [ ] Extend `src/components/ranking/ranking-view.test.tsx` for period empty-state copy with filters visible

## Sources

### Primary (HIGH confidence)
- Local codebase:
  - `src/lib/stats.ts`, `src/lib/ranking.ts`, `src/lib/team-details.ts`, `src/lib/teams.ts`, `src/app/(authenticated)/ranking/page.tsx`, `src/components/profile/profile-page.tsx`, `middleware.ts`
  - `.planning/phases/05-user-profiles-advanced-features/05-CONTEXT.md`
  - `AGENTS.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`
- npm registry metadata:
  - https://www.npmjs.com/package/next
  - https://www.npmjs.com/package/react
  - https://www.npmjs.com/package/next-auth
  - https://www.npmjs.com/package/prisma
  - https://www.npmjs.com/package/@prisma/client
  - https://www.npmjs.com/package/zod
  - https://www.npmjs.com/package/vitest
  - https://www.npmjs.com/package/@playwright/test
- PostgreSQL docs:
  - https://www.postgresql.org/docs/current/functions-datetime.html

### Secondary (MEDIUM confidence)
- Prisma docs page structure and filtering examples:
  - https://www.prisma.io/docs/orm/prisma-client/queries/crud

### Tertiary (LOW confidence)
- Next.js search params historical doc snapshot (older version docs):
  - https://nextjs.org/docs/14/app/api-reference/file-conventions/page

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - validated by current repository and npm registry version checks.
- Architecture: HIGH - anchored in locked decisions plus existing project patterns and contracts.
- Pitfalls: HIGH - derived from existing code behavior, middleware coverage, and locked semantics.

**Research date:** 2026-03-26
**Valid until:** 2026-04-25
