# Phase 6: Team Creation Flow Wiring - Research

**Researched:** 2026-03-26
**Domain:** `/times?tab=create` UI wiring to `POST /api/teams` (solo flow)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No `06-CONTEXT.md` file exists for this phase. Locked/discretion/deferred sections were not provided by `/gsd:discuss-phase`.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEAM-01 | Usuário pode criar time do tipo solo (1 jogador, `type: solo`) com nome único | Existing `POST /api/teams` already supports solo create + uniqueness; Phase 6 must wire `/times?tab=create` client submit, success refresh/feedback, and auth/validation error handling end-to-end |
</phase_requirements>

## Summary

Phase 6 is a wiring phase, not a backend redesign phase. The critical gap is that `/times?tab=create` is still a placeholder in [`src/app/(authenticated)/times/page.tsx`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/(authenticated)/times/page.tsx), while `POST /api/teams` is already implemented with auth guard, payload validation, solo/duo branching, and typed error responses in [`src/app/api/teams/route.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/api/teams/route.ts).

For planning, the standard path is: add a focused client form for solo creation, call `POST /api/teams` with `{ name, type: "solo" }`, surface API errors with existing toast conventions, and refresh list state on success. Do not change schema, do not add packages, and do not alter protected auth-status behavior (`401`, `500`, `503`) from existing auth helpers.

Current test coverage already validates the API route contract for solo creation, but there is no test coverage for `/times?tab=create` UI submit wiring and no E2E flow for "create solo team" in authenticated runtime. Phase 6 planning should explicitly front-load those coverage gaps.

**Primary recommendation:** Implement a dedicated client create-form component under `src/components/teams/`, wire it into the create tab, and verify with route test (existing), component test (new), and authenticated E2E test (new).

## Project Constraints (from project instructions)

- Do not edit `prisma/schema.prisma` without explicit approval.
- Do not install new packages without approval.
- Keep both persistence modes behavior intact (DB-backed runtime + in-memory-safe test/dev behavior).
- Do not change protected API statuses `401`, `409`, `429`, `500`, `503` without coordinated client handling and tests.
- Keep `/dashboard` as functional authenticated route; `/scoreboard` remains legacy redirect.
- Keep scoreboard/team stats derived from match history; do not persist aggregate counters.
- Use `@/` imports (no `../` imports).
- Use named exports except Next.js-required default page/layout exports.
- Prefer server components by default; use `"use client"` only where required.
- Route tests must mock `@/lib/auth`; unit/route tests should not import Prisma directly.
- Data-layer tests relying on in-memory behavior must use `delete process.env.DATABASE_URL`, `vi.resetModules()`, and dynamic imports.
- Source precedence for this phase: `src/` + `prisma/` + `.planning/*` over stale legacy docs/rules.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | repo `16.1.6` / latest `16.2.1` | App Router page + API route integration | Existing framework and route model |
| `react` | repo `19.2.3` / latest `19.2.4` | Client form interactivity in create tab | Existing UI runtime |
| `zod` | `4.3.6` (repo/latest) | Form + payload validation parity | Already used in routes and forms |
| `next-auth` | `4.24.13` | Authenticated route/session model | Existing auth guard contract |
| `sonner` | `2.0.7` (repo/latest) | Success/error feedback to users | Existing UX pattern in dashboard/profile |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | `4.1.0` | Route/component test coverage for submit flow | Required for TEAM-01 wiring regression safety |
| `@testing-library/react` | `16.3.2` | Interaction testing for create form | For client submit/error-path tests |
| `@playwright/test` | `1.58.2` | Authenticated runtime E2E validation | For success criterion #4 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local client form + fetch | Next.js Server Action form | Inconsistent with current API-first mutation patterns used in this codebase |
| Reusing dashboard hook directly | New teams-create hook/component | Dashboard hook includes unrelated match logic; coupling risk |
| Silent inline errors only | Toast-driven feedback + inline validation | Existing UX patterns already rely on toast surface for API failures |

**Installation:**
```bash
# No new dependencies required for Phase 6.
```

**Version verification:** Executed on 2026-03-26:
```bash
npm view next version
npm view react version
npm view zod version
npm view sonner version
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/(authenticated)/times/page.tsx      # keep as server page; render create form client component in create tab
├── components/teams/
│   ├── team-create-form.tsx                # new: solo create submit + error/success UX
│   └── team-create-form.test.tsx           # new: client wiring tests
└── app/api/teams/route.ts                  # existing POST contract (no schema/status churn)
```

### Pattern 1: Server Page + Focused Client Form
**What:** Keep `/times` page server-rendered for list data, mount a `"use client"` form only for submit interactivity.
**When to use:** Tab contains API mutation and immediate feedback requirements.
**Example:**
```tsx
// Source: existing server-page pattern in src/app/(authenticated)/times/page.tsx
{tab === "create" ? (
  <TeamCreateForm />
) : (
  teams.map((team) => <TeamCard key={team.id} team={team} />)
)}
```

### Pattern 2: API-first Mutation with Explicit Error Branching
**What:** Submit via `fetch("/api/teams", { method: "POST", ... })`; decode JSON error and branch by status.
**When to use:** Any authenticated client mutation against existing API routes.
**Example:**
```ts
// Source pattern: src/components/dashboard/use-dashboard-data.ts + src/components/profile/profile-edit-dialog.tsx
const response = await fetch("/api/teams", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, type: "solo" }),
});

if (!response.ok) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  throw new Error(payload?.error ?? "Não foi possível criar o time.");
}
```

### Pattern 3: Refresh-on-success for list consistency
**What:** After 201, refresh list/view state (`router.refresh()` or explicit refetch of teams list).
**When to use:** Mutation affects same page list rendered by server data.
**Example:**
```ts
// Source reference: mutation + refetch approach in use-dashboard-data.ts
await createSoloTeam();
router.refresh(); // ensures /times "Meus Times" reflects newly created team
```

### Anti-Patterns to Avoid

- **Leaving create tab as non-functional placeholder:** fails TEAM-01 and SC-1..SC-4 directly.
- **Changing API response/status semantics in Phase 6:** introduces unnecessary client regressions.
- **Hardcoding team IDs or old `frontend/backend` assumptions:** conflicts with current dynamic-team domain.
- **Adding Prisma calls inside client components/tests:** breaks project testing rules and architecture boundaries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API contract for team creation | New endpoint or custom route | Existing `POST /api/teams` | Already validates auth/payload and returns typed response |
| Error feedback infra | Custom notification system | `sonner` toast pattern already used in app | Consistent UX and low risk |
| Validation engine | Ad-hoc string checks only | `zod` client schema aligned with server expectations | Prevents avoidable round-trips and drift |
| Full-page client data architecture | Rewrite `/times` as all-client page | Keep server page + targeted client form | Preserves current server-first architecture |

**Key insight:** Phase 6 should wire existing contracts, not invent new domain abstractions.

## Common Pitfalls

### Pitfall 1: Status-specific auth errors collapsed into generic failure
**What goes wrong:** Expired or missing auth appears as vague "create failed".
**Why it happens:** Client only checks `response.ok`.
**How to avoid:** Handle `401` and `503` explicitly; show clear message and optional login redirect behavior.
**Warning signs:** Users stuck on create tab with repeated generic errors.

### Pitfall 2: Success toast without state refresh
**What goes wrong:** User sees "time criado" but list still stale.
**Why it happens:** Missing `router.refresh()`/refetch after 201.
**How to avoid:** Refresh immediately on success and optionally navigate to `tab=teams`.
**Warning signs:** New team appears only after manual reload.

### Pitfall 3: Client form validation diverges from route schema
**What goes wrong:** Client accepts payload server rejects.
**Why it happens:** Separate inconsistent validation rules.
**How to avoid:** Mirror key server constraints (`name` required, max length, solo payload shape).
**Warning signs:** Frequent 400 responses from simple valid-looking submissions.

### Pitfall 4: Legacy rule/doc drift reintroduced in tests
**What goes wrong:** New E2E/unit tests rely on fixed `frontend/backend`.
**Why it happens:** Older artifacts still contain legacy assumptions.
**How to avoid:** Build tests around dynamic team names created during runtime.
**Warning signs:** Tests passing only with seeded fixed IDs, not with user-created teams.

## Code Examples

Verified patterns from current codebase:

### POST route auth + validation guard order
```ts
// Source: src/app/api/teams/route.ts
if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

const user = await getAuthenticatedUser();
if (!user) return getAuthRequiredResponse();

const payload = await request.json().catch(() => null);
const result = createTeamSchema.safeParse(payload);
if (!result.success) {
  return NextResponse.json({ error: result.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
}
```

### Promise-based toast feedback for async mutation
```ts
// Source: src/components/dashboard/use-dashboard-data.ts
const promise = executeMutation();
toast.promise(promise, {
  loading: "Criando time...",
  success: "Time criado com sucesso.",
  error: (err) => err instanceof Error ? err.message : "Não foi possível criar o time.",
});
await promise;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Placeholder text for create tab | Real API-wired submit flow | Phase 6 target | Enables TEAM-01 runtime completion |
| Legacy fixed-team assumptions in some docs/tests | Dynamic user-created teams in active codebase | Phases 1-2 | Tests and UI must avoid hardcoded IDs |
| Backend-heavy separation framing | Unified Next.js App Router API + RSC/client components | Current codebase state | Plan should focus on in-repo wiring, not split-stack architecture |

**Deprecated/outdated:**
- `.claude/rules/domain.md` and `.claude/rules/architecture.md` still mention fixed `frontend/backend` invariants; treat as stale for this phase per `AGENTS.md` source priority.

## Open Questions

1. **Should successful submit auto-switch to `tab=teams` or keep user on create tab with cleared form?**
   - What we know: Success criterion requires refresh and clear feedback, not a mandated tab behavior.
   - What's unclear: Preferred UX after success.
   - Recommendation: Choose one behavior in plan and enforce with explicit test assertion.

2. **Should create form in Phase 6 support duo immediately or solo-only scope?**
   - What we know: Phase goal/success criteria explicitly target solo flow; API already supports duo.
   - What's unclear: Product expectation for visible duo controls in this phase.
   - Recommendation: Keep UI scoped to solo for Phase 6 to avoid scope creep; defer duo UI wiring unless requirement changes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next runtime/tests | ✓ | `v24.14.0` | — |
| npm/npx | scripts/test execution | ✓ | `11.9.0` | — |
| Next CLI | local app runtime | ✓ | `16.1.6` | `npm run dev` wrapper |
| Vitest | unit/route/component validation | ✓ | `4.1.0` | — |
| Playwright CLI | E2E create-flow validation | ✓ | `1.58.2` | — |
| `DATABASE_URL` env | authenticated API runtime | ✗ | — | None for true authenticated create flow |
| `NEXTAUTH_SECRET` env | authenticated API runtime | ✗ | — | None for true authenticated create flow |
| Postgres client tooling (`psql`, `pg_isready`) | local DB diagnostics | ✗ | — | Dockerized DB workflow if configured |
| Docker | optional local infra fallback | ✓ | `29.2.1` | — |

**Missing dependencies with no fallback:**
- `DATABASE_URL` and `NEXTAUTH_SECRET` for running authenticated end-to-end create flow.

**Missing dependencies with fallback:**
- `psql`/`pg_isready` CLI tooling (can still proceed with app-level tests and/or dockerized DB).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.0` + Testing Library + Playwright `1.58.2` |
| Config file | [`vitest.config.ts`](/home/guiroos/Documentos/Projects/office-8-ball/vitest.config.ts), [`playwright.config.ts`](/home/guiroos/Documentos/Projects/office-8-ball/playwright.config.ts) |
| Quick run command | `npm run test -- src/app/api/teams/route.test.ts` |
| Full suite command | `npm run typecheck && npm run test && npm run e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEAM-01 | POST payload from create tab uses `{ name, type: "solo" }` and handles 201/4xx/401/503 paths | component | `npm run test -- src/components/teams/team-create-form.test.tsx` | ❌ Wave 0 |
| TEAM-01 | `POST /api/teams` validates payload and creates solo team | route | `npm run test -- src/app/api/teams/route.test.ts` | ✅ |
| TEAM-01 | Authenticated user can complete "Create solo team" flow in runtime | e2e | `npm run e2e -- --grep \"create solo team\"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test -- src/app/api/teams/route.test.ts src/components/teams/team-create-form.test.tsx`
- **Per wave merge:** `npm run typecheck && npm run test`
- **Phase gate:** `npm run typecheck && npm run test && npm run e2e -- --grep "create solo team"`

### Wave 0 Gaps

- [ ] `src/components/teams/team-create-form.test.tsx` — covers submit wiring + error handling branches for TEAM-01.
- [ ] `e2e/team-create-flow.spec.ts` (or extension of existing e2e spec) — covers authenticated runtime create solo flow.
- [ ] Stable E2E fixture path for dynamic team assertions (no fixed team IDs).
- [ ] Environment bootstrap for E2E (`DATABASE_URL`, `NEXTAUTH_SECRET`) documented/available before runtime verification.

## Sources

### Primary (HIGH confidence)

- Local source code:
  - [`src/app/(authenticated)/times/page.tsx`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/(authenticated)/times/page.tsx)
  - [`src/app/api/teams/route.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/api/teams/route.ts)
  - [`src/app/api/teams/route.test.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/api/teams/route.test.ts)
  - [`src/components/dashboard/use-dashboard-data.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/components/dashboard/use-dashboard-data.ts)
  - [`src/components/profile/profile-edit-dialog.tsx`](/home/guiroos/Documentos/Projects/office-8-ball/src/components/profile/profile-edit-dialog.tsx)
  - [`vitest.config.ts`](/home/guiroos/Documentos/Projects/office-8-ball/vitest.config.ts)
  - [`playwright.config.ts`](/home/guiroos/Documentos/Projects/office-8-ball/playwright.config.ts)
- Project planning/instructions:
  - [`.planning/ROADMAP.md`](/home/guiroos/Documentos/Projects/office-8-ball/.planning/ROADMAP.md)
  - [`.planning/REQUIREMENTS.md`](/home/guiroos/Documentos/Projects/office-8-ball/.planning/REQUIREMENTS.md)
  - [`.planning/PROJECT.md`](/home/guiroos/Documentos/Projects/office-8-ball/.planning/PROJECT.md)
  - [`AGENTS.md`](/home/guiroos/Documentos/Projects/office-8-ball/AGENTS.md)

### Secondary (MEDIUM confidence)

- npm registry checks via `npm view` for latest package versions (`next`, `react`, `zod`, `sonner`) on 2026-03-26.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - directly verified from `package.json` and `npm view`.
- Architecture: HIGH - based on current source-of-truth implementation and existing route/component patterns.
- Pitfalls: HIGH - derived from concrete current gaps (placeholder UI, missing create-flow tests, stale legacy assumptions).

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (30 days; stable stack and local-architecture focused)
