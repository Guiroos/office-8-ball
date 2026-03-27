# Phase 5: User Profiles & Advanced Features - Research

**Researched:** 2026-03-26
**Domain:** Profile aggregation, time-filtered ranking, and dedicated head-to-head routing
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
| PROF-01 | Perfil do usuário mostra seus times com stats agregados | `profile-stats` assembler + per-team derivação reutilizando `computeTeamStats` |
| PROF-02 | Perfil mostra win rate geral do jogador (across all teams) | Agregação por partidas únicas (sem dupla contagem) e fórmula única de winRate |
| PROF-03 | Perfil mostra total de partidas jogadas pelo usuário | Regra D-05..D-08 implementada em módulo de domínio dedicado |
| RANK-05 | Ranking suporta filtros por período (semana / mês / geral) | `period` query contract + helper de janela temporal + filtro em query de partidas |
</phase_requirements>

## Summary

Phase 5 should be planned as incremental extensions over existing domain modules, not as isolated page logic. The current code already has reusable primitives (`computeTeamStats`, `computeHeadToHead`, `listAllTeamsWithStats`, `getTeamDetailData`) and a query-param-driven ranking route. The missing work is composition: profile aggregation, period windows, and dedicated H2H routing with resilient URL handling.

`/profile` currently depends on client fetches and hardcoded teams (`frontend/backend`) in `src/components/profile/profile-page.tsx`; this is the highest-risk gap versus requirements PROF-01..03. The correct path is server-first rendering via a new domain assembler module, while keeping `GET/PUT /api/profile` scoped to editable identity data (D-02).

For RANK-05 and dedicated H2H UX, the current architecture already supports query-param parsing and server rendering. Extend that contract with `period=all|month|week`, preserve `type` and `period` together, keep explicit empty states, and add `/head-to-head` with strict param validation + fallback without throwing.

**Primary recommendation:** Build `src/lib/profile-stats.ts` and `src/lib/time-period.ts` first, then wire `/profile`, `/ranking`, and `/head-to-head` around those tested domain helpers.

## Project Constraints (from project instructions)

- Do not edit `prisma/schema.prisma` without explicit approval.
- Do not install new packages without approval.
- Keep DB-backed mode and in-memory mode behavior intact.
- Do not change protected API statuses `401`, `409`, `429`, `500`, `503` without coordinated client/test updates.
- Keep `/dashboard` as the functional authenticated route (`/scoreboard` remains redirect).
- Keep stats derived from match history; do not add persisted aggregate counters.
- Use `@/` imports; use named exports except Next page/layout defaults.
- Prefer server components; add `"use client"` only when required.
- Route tests must mock `@/lib/auth`; tests should not import Prisma directly.
- Data-layer tests requiring in-memory behavior must use `delete process.env.DATABASE_URL`, `vi.resetModules()`, and dynamic imports.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | repo `16.1.6` / latest `16.2.1` | App Router routes + RSC data fetching | Existing framework and route model |
| `react` | repo `19.2.3` / latest `19.2.4` | UI composition for profile/ranking/H2H | Existing rendering layer |
| `prisma` + `@prisma/client` | repo `6.19.2` / latest `7.5.0` | Team/match/user read model queries | Existing DB access contract |
| `next-auth` | `4.24.13` | User identity for protected pages | Existing auth/session integration |
| `zod` | `4.3.6` | Query and payload validation | Existing validation standard in routes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | repo `4.1.0` / latest `4.1.2` | Unit/route tests for new domain modules | Required for PROF and RANK behavior coverage |
| `@playwright/test` | `1.58.2` | Deep-link/URL behavior verification | Optional higher-confidence check for H2H URL sync |
| `@testing-library/react` | `16.3.2` | Component-level query-param and empty-state tests | For ranking/profile client components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| App-layer time-window helper | Raw SQL timezone expressions | Harder to test and maintain in this codebase |
| Dedicated profile domain module | Inline logic in page component | Violates D-04 and reduces testability |
| Reusing only `/times/[id]` H2H | Dedicated `/head-to-head` route | Does not satisfy D-14 deep-link requirement |

**Installation:**
```bash
# No new dependencies required for this phase.
```

**Version verification:** Before finalizing the plan, verify versions with:
```bash
npm view next version
npm view react version
npm view prisma version
npm view @prisma/client version
npm view next-auth version
npm view zod version
npm view vitest version
npm view @playwright/test version
```
Registry check performed on 2026-03-26 (`npm view ... version time.modified --json`) confirmed the "latest" versions listed above.

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/(authenticated)/
│   ├── profile/page.tsx            # server-first profile route
│   ├── ranking/page.tsx            # supports type + period query params
│   └── head-to-head/page.tsx       # dedicated authenticated H2H route
├── components/
│   ├── profile/                    # profile view components
│   ├── ranking/                    # type + period filter controls
│   └── head-to-head/               # selector + state messaging
└── lib/
    ├── profile-stats.ts            # user aggregate and per-team stats (D-04)
    ├── time-period.ts              # all/week/month window resolution (D-10/D-11)
    ├── ranking.ts                  # extend listing with period filtering
    └── head-to-head.ts             # shared validation/fallback assembler
```

### Pattern 1: Domain Assembler for `/profile`
**What:** Fetch identity + memberships + matches once on server, then derive all profile metrics in one module.
**When to use:** Any route where all required data is available server-side and should render without client bootstrap.
**Example:**
```typescript
// Source: local pattern from src/lib/team-details.ts and locked D-01..D-04
export async function getProfilePageData(userId: string) {
  const teams = await listUserTeams(userId, true); // includes archived per D-07
  const teamIds = new Set(teams.map((team) => team.id));
  const matches = await listMatchesForTeams([...teamIds]);
  return buildProfileStats({ teams, teamIds, matches });
}
```

### Pattern 2: Single Time-Window Resolver
**What:** Parse `period` and compute one canonical `{startUtc, endUtc}` used by ranking queries.
**When to use:** Any period-filtered stat query (`all`, `week`, `month`).
**Example:**
```typescript
// Source: existing Prisma query style in src/lib/ranking.ts
const window = resolvePeriodWindow(period, "America/Sao_Paulo");
const matchRows = await prisma.match.findMany({
  where: {
    OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }],
    ...(window ? { playedAt: { gte: window.startUtc, lt: window.endUtc } } : {}),
  },
  orderBy: { playedAt: "desc" },
});
```

### Pattern 3: URL-Validated H2H Selection
**What:** Parse `teamA/teamB`, validate against accessible teams, reject same-team pair, and fallback to first valid pair with warning.
**When to use:** `/head-to-head` initial load and on param mutation.
**Example:**
```typescript
// Source: query-param handling style from src/app/(authenticated)/ranking/page.tsx
const parsed = parseH2HSearchParams(searchParams);
const resolved = resolveValidPair(parsed, viewerTeams); // never throws
return { pair: resolved.pair, warning: resolved.warning };
```

### Anti-Patterns to Avoid
- **Client-side profile bootstrap as primary data flow:** keeps hardcoded state and violates D-03.
- **Copying stats formulas into UI components:** creates drift from `stats.ts`.
- **Dropping existing query params when changing one filter:** breaks D-12 shareable URLs.
- **Silent fallback to all-time when filtered result is empty:** violates D-13.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Win/loss/winRate/streak math | New custom stat formulas | `computeTeamStats` in `src/lib/stats.ts` | Existing tested contract |
| H2H pair aggregation | New ad-hoc H2H algorithm | `computeHeadToHead` in `src/lib/stats.ts` | Existing tested edge-case behavior |
| Profile aggregation in component state | `useEffect` + local reduction logic | `src/lib/profile-stats.ts` domain module | Deterministic and unit-testable |
| URL query string manipulation | Manual string concatenation | `URLSearchParams` and Next `Link`/router updates | Preserves `type` + `period` reliably |

**Key insight:** Phase 5 is primarily orchestration of existing domain primitives; hand-rolled replacements increase regression risk without adding capability.

## Common Pitfalls

### Pitfall 1: Double counting matches in profile totals
**What goes wrong:** User total matches is inflated.
**Why it happens:** Summing per-team totals instead of deduping match IDs (D-08).
**How to avoid:** Build a unique match set first; derive wins/losses from that set.
**Warning signs:** `wins + losses` exceeds count of unique matches.

### Pitfall 2: Wrong week/month boundaries at day rollover
**What goes wrong:** Matches near midnight appear in wrong period filter.
**Why it happens:** Multiple ad-hoc timezone conversions across files.
**How to avoid:** Centralize period boundaries in one helper anchored to `America/Sao_Paulo` per D-10/D-11.
**Warning signs:** Flaky tests around Monday 00:00 and month transitions.

### Pitfall 3: Invalid H2H URL breaks route
**What goes wrong:** `/head-to-head` errors or shows blank UI on bad params.
**Why it happens:** Assumption that URL params are always valid and authorized.
**How to avoid:** Validate IDs against viewer teams and fallback with explicit message (D-16).
**Warning signs:** 404/500 on malformed `teamA/teamB`.

### Pitfall 4: Missing middleware protection for new route
**What goes wrong:** `/head-to-head` bypasses auth unexpectedly.
**Why it happens:** `middleware.ts` matcher not updated.
**How to avoid:** Add `/head-to-head/:path*` in the same task as route creation.
**Warning signs:** Auth behavior differs from `/ranking` and `/times`.

## Code Examples

Verified patterns from existing code:

### Unique-match profile aggregation
```typescript
// Source: src/lib/stats.ts usage style + D-05..D-08
const matchById = new Map(matches.map((match) => [match.id, match]));
let wins = 0;
let losses = 0;

for (const match of matchById.values()) {
  const involved = teamIds.has(match.teamAId) || teamIds.has(match.teamBId);
  if (!involved) continue;
  if (teamIds.has(match.winnerTeamId)) wins += 1;
  else losses += 1;
}
```

### Preserve `type` and `period` query params
```tsx
// Source: src/components/ranking/type-tabs.tsx pattern
const params = new URLSearchParams(currentParams);
params.set("period", nextPeriod);
const href = `/ranking?${params.toString()}`;
```

### Fallback-safe H2H pair resolver
```typescript
// Source: fallback selection pattern inspired by src/lib/team-details.ts
function resolvePair(teamA: string | null, teamB: string | null, teams: string[]) {
  const valid = new Set(teams);
  if (teamA && teamB && teamA !== teamB && valid.has(teamA) && valid.has(teamB)) {
    return { teamA, teamB, warning: null };
  }
  return {
    teamA: teams[0] ?? null,
    teamB: teams[1] ?? null,
    warning: "Seleção inválida; exibindo confronto disponível.",
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-fetched profile data with placeholders | Server-side profile assembler with derived metrics | Phase 5 target (2026-03) | Removes hardcoded drift and improves determinism |
| Ranking filtered only by team type | Ranking filtered by team type + period | Phase 5 target (2026-03) | Enables requirement RANK-05 |
| H2H only within team detail page | Dedicated `/head-to-head` route + existing embedded H2H | Phase 5 target (2026-03) | Deep-linkable comparisons and better discoverability |

**Deprecated/outdated:**
- Hardcoded `TEAMS` constant in `src/components/profile/profile-page.tsx`.
- Primary profile loading via client-side `/api/profile` and `/api/matches` effects.

## Open Questions

1. **UTC-3 fixed offset vs named timezone behavior**
   - What we know: Decisions lock behavior to `America/Sao_Paulo` and specify UTC-3.
   - What's unclear: Whether historical DST edge dates matter for this product.
   - Recommendation: Implement explicit current product rule (UTC-3 calendar boundaries), document it, and revisit only if per-user timezone becomes scope.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next/Vitest/Playwright scripts | ✓ | `v24.14.0` | — |
| npm/npx | package scripts + test commands | ✓ | `11.9.0` | — |
| PostgreSQL CLI (`psql`) | manual DB inspection only | ✗ | — | Use Prisma client queries/tests |
| Docker | optional local DB provisioning | ✓ | `29.2.1` (client) | Existing DB or in-memory mode |

**Missing dependencies with no fallback:**
- None identified for planning or implementation.

**Missing dependencies with fallback:**
- `psql` is unavailable; use Prisma-backed integration tests for DB verification.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.0` (repo), Playwright `1.58.2` |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `npm run test -- src/lib/ranking.test.ts src/components/ranking/ranking-view.test.tsx src/app/api/profile/route.test.ts` |
| Full suite command | `npm run typecheck && npm run test && npm run e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Profile lists user teams with per-team stats | unit + route/component | `npm run test -- src/lib/profile-stats.test.ts src/app/(authenticated)/profile/page.test.tsx` | ❌ Wave 0 |
| PROF-02 | Profile computes overall user win rate | unit | `npm run test -- src/lib/profile-stats.test.ts -t "win rate"` | ❌ Wave 0 |
| PROF-03 | Profile computes total played matches with dedupe | unit | `npm run test -- src/lib/profile-stats.test.ts -t "total matches"` | ❌ Wave 0 |
| RANK-05 | Ranking supports `period=all|month|week` and empty states | unit + component | `npm run test -- src/lib/ranking.test.ts src/components/ranking/ranking-view.test.tsx` | ⚠️ Partial (period cases missing) |

### Sampling Rate
- **Per task commit:** `npm run test -- src/lib/profile-stats.test.ts src/lib/ranking.test.ts`
- **Per wave merge:** `npm run typecheck && npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/profile-stats.test.ts` — PROF-01/02/03 core semantics
- [ ] `src/lib/time-period.test.ts` — week/month boundary edge cases
- [ ] `src/app/(authenticated)/profile/page.test.tsx` — RSC payload wiring and empty states
- [ ] `src/app/(authenticated)/head-to-head/page.test.tsx` — fallback + invalid query behavior
- [ ] Extend `src/lib/ranking.test.ts` for `period` filter query behavior
- [ ] Extend `src/components/ranking/ranking-view.test.tsx` for period filter empty-state visibility

## Sources

### Primary (HIGH confidence)
- Local phase decisions and constraints:
  - `.planning/phases/05-user-profiles-advanced-features/05-CONTEXT.md`
  - `AGENTS.md`
  - `.planning/REQUIREMENTS.md`
  - `.planning/ROADMAP.md`
  - `.planning/STATE.md`
- Local implementation contracts:
  - `src/lib/stats.ts`
  - `src/lib/ranking.ts`
  - `src/lib/team-details.ts`
  - `src/components/profile/profile-page.tsx`
  - `src/app/(authenticated)/ranking/page.tsx`
  - `src/components/ranking/type-tabs.tsx`
  - `src/components/ranking/ranking-view.tsx`
  - `middleware.ts`
- npm registry checks (2026-03-26):
  - https://www.npmjs.com/package/next
  - https://www.npmjs.com/package/react
  - https://www.npmjs.com/package/prisma
  - https://www.npmjs.com/package/@prisma/client
  - https://www.npmjs.com/package/next-auth
  - https://www.npmjs.com/package/zod
  - https://www.npmjs.com/package/vitest
  - https://www.npmjs.com/package/@playwright/test

### Secondary (MEDIUM confidence)
- Next.js App Router page/search params reference:
  - https://nextjs.org/docs/app/api-reference/file-conventions/page
- Prisma query filtering docs:
  - https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from local `package.json` and npm registry metadata on 2026-03-26.
- Architecture: HIGH - anchored in locked decisions and existing Phase 4 patterns in code.
- Pitfalls: HIGH - derived from currently implemented code paths and known guardrails.

**Research date:** 2026-03-26
**Valid until:** 2026-04-25
