# Phase 7: Team Details Access & Member Actions - Research

**Researched:** 2026-03-26
**Domain:** Team detail authorization hardening plus member-management UI wiring
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `/times/[id]` must show an explicit access-denied state when an authenticated non-member opens a team detail URL directly.
- **D-02:** The denied state should explain the situation and point back to `/times`; do not silently redirect and do not hide the case behind a generic UI 404.
- **D-03:** Protection must follow the existing membership-first contract already used by team APIs.
- **D-04:** `Convidar Membro` stays inside the team detail page and opens a simple username-based dialog.
- **D-05:** Invite flow uses `GET /api/users?username=...` to validate the target before `POST /api/teams/:id/members`.
- **D-06:** No separate management screen in this phase.
- **D-07:** Member list exposes inline `Remover` for removable members.
- **D-08:** Removal requires confirmation before calling `DELETE /api/teams/:id/members/:userId`.
- **D-09:** Existing domain rules remain unchanged: any current member may remove others; creator cannot be removed; `duo` teams cannot fall below 2 members.
- **D-10:** Add/remove flows use toast feedback and refresh the current detail state in place.
- **D-11:** Prefer `router.refresh()`/server refresh after success; avoid full redirects and aggressive optimistic UI.

### the agent's Discretion

- Exact PT-BR copy for denied state, invite validation, and removal confirmation.
- Whether the denied state uses `RouteStateScreen`, `IconCallout`, or a composition around those primitives.
- Exact component split for the member-management client island.

### Deferred Ideas

- No broader team-admin console.
- No role/permission redesign.
- No schema change for invitations, pending invites, or audit logs.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEAM-02 | Usuário pode ver página de detalhes do time (membros, stats e histórico de partidas) | Detail page already exists, but Phase 7 must make access member-only, keep authorized detail behavior intact, and add runtime member-management actions plus coverage for denied access and manage-members flow |

</phase_requirements>

## Summary

Phase 7 is a focused recovery/wiring phase, not a domain rewrite. The core backend contracts already exist: `GET /api/teams/[id]` is membership-first and returns `403` to non-members, `POST /api/teams/[id]/members` adds a member for an existing team member, `DELETE /api/teams/[id]/members/[userId]` removes a member under Phase 1 domain rules, and `GET /api/users` supports username lookup. The missing work is on the team-detail runtime path.

Today, [`src/lib/team-details.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/lib/team-details.ts) still returns detail data for any authenticated viewer as long as the team exists and is active, and [`src/app/(authenticated)/times/[id]/page.tsx`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/(authenticated)/times/[id]/page.tsx) converts any null detail into `notFound()`. That directly conflicts with the new phase boundary: non-members need an explicit denied experience instead of full detail access or a hidden 404. The UI side is similarly incomplete: [`src/components/teams/team-detail-view.tsx`](/home/guiroos/Documentos/Projects/office-8-ball/src/components/teams/team-detail-view.tsx) still renders a stub `Convidar Membro` button and [`src/components/teams/member-list.tsx`](/home/guiroos/Documentos/Projects/office-8-ball/src/components/teams/member-list.tsx) is passive.

The safest planning split is:

1. **Authorization/data contract plan**: make the team-detail loader membership-aware, preserve existing detail payload for members, and render a dedicated denied state for non-members without changing protected API statuses.
2. **Member-actions/runtime plan**: add a small client management surface on the detail page that looks up users by username, posts member add/remove mutations, uses toast + refresh, and proves the flows with component/route/E2E coverage.

**Primary recommendation:** Treat authorization and member-action wiring as two plans in two waves. The first plan should redefine the team-detail page contract around an explicit authorized/denied result and back it with focused tests. The second plan should layer invite/remove interactions on top of that stable contract and finish with authenticated E2E coverage.

## Project Constraints (from project instructions)

- Do not edit `prisma/schema.prisma` without explicit approval.
- Do not install new packages without approval.
- Keep both persistence modes intact; DB-backed mode and in-memory-without-`DATABASE_URL` mode must still behave correctly.
- Do not change protected API statuses `401`, `409`, `429`, `500`, or `503`.
- `/dashboard` remains the primary authenticated landing route; `/scoreboard` stays a redirect.
- Team/ranking stats remain derived from match history; no persisted aggregate counters.
- Use `@/` imports.
- Use named exports except for Next.js-required defaults on page/layout files.
- Prefer server components by default; add `"use client"` only for the member-action controls that need browser events/state.
- Route tests must mock `@/lib/auth`; unit/route tests must not import Prisma directly.

## Architecture Patterns

### Recommended Project Structure

```text
src/
├── app/(authenticated)/times/[id]/page.tsx
├── app/api/teams/[id]/members/route.ts
├── app/api/teams/[id]/members/[userId]/route.ts
├── app/api/users/route.ts
├── components/
│   ├── route-state-screen.tsx
│   └── teams/
│       ├── team-detail-view.tsx
│       ├── member-list.tsx
│       ├── team-member-manager.tsx          # likely new client island
│       ├── invite-member-dialog.tsx         # optional extraction
│       └── remove-member-button.tsx         # optional extraction
└── lib/
    ├── team-details.ts
    └── teams.ts
```

### Pattern 1: Server-first page with explicit result contract

**What:** Keep `/times/[id]` as an RSC entry and have the loader return a discriminated result such as `authorized`, `denied`, or `missing`.

**Why it fits Phase 7:** The page needs to distinguish three cases cleanly:
- missing/archived team -> `notFound()`
- authenticated non-member -> explicit denied state
- member -> normal detail UI

**Recommended shape:**

```ts
type TeamDetailPageResult =
  | { kind: "not-found" }
  | { kind: "forbidden"; teamId: string }
  | ({ kind: "detail" } & TeamDetailData);
```

This keeps the page logic explicit and avoids overloading `null` for both "missing" and "forbidden".

### Pattern 2: Reuse membership-first guard in the data layer

**What:** Use `isTeamMember(teamId, viewerId)` inside the team-detail loader before assembling the payload.

**Why it fits Phase 7:** The API already follows this pattern in [`src/app/api/teams/[id]/route.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/api/teams/[id]/route.ts). Matching it in the page/data layer prevents the UI from bypassing the active authorization policy.

**Important detail:** Do not convert the page-level denied case into an API status change. Page behavior and API behavior can differ in presentation while sharing the same membership rule.

### Pattern 3: Small client island for member actions

**What:** Keep the page and data assembler server-side, then mount a single `"use client"` manager component for invite/remove interactions.

**Why it fits Phase 7:** Invite/remove flows need input state, confirmation state, network calls, toast feedback, and `router.refresh()`, but the rest of the team detail page is already a good server-rendered fit.

**Recommended behavior:**

```ts
const userRes = await fetch(`/api/users?username=${encodeURIComponent(username)}`);
const addRes = await fetch(`/api/teams/${teamId}/members`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId }),
});

const removeRes = await fetch(`/api/teams/${teamId}/members/${userId}`, {
  method: "DELETE",
});

toast.success("Membro adicionado com sucesso.");
router.refresh();
```

### Pattern 4: Inline action policy derived from current payload

**What:** Compute whether a member row is removable from current team data instead of inventing a new permission model.

**Rules already established in code:**
- creator cannot be removed
- current member can remove other members
- `duo` teams cannot drop below 2 members
- `solo` teams cannot drop below 1 member

**Planning implication:** The detail payload likely needs viewer/team metadata that the UI can use to decide whether to render `Remover` and what copy to show.

## Current Code State

### Existing contracts that should be reused

- [`src/app/api/teams/[id]/route.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/api/teams/[id]/route.ts) already enforces membership-first access with `403` for non-members.
- [`src/app/api/teams/[id]/members/route.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/api/teams/[id]/members/route.ts) already validates authenticated membership and `userId` payload for member add.
- [`src/app/api/teams/[id]/members/[userId]/route.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/api/teams/[id]/members/[userId]/route.ts) already validates authenticated membership for member removal.
- [`src/app/api/users/route.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/app/api/users/route.ts) already supports authenticated username lookup.
- [`src/lib/teams.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/lib/teams.ts) already contains `isTeamMember`, `findUserByUsername`, `addTeamMember`, and `removeTeamMember`.
- [`src/components/teams/team-create-form.tsx`](/home/guiroos/Documentos/Projects/office-8-ball/src/components/teams/team-create-form.tsx) is the nearest existing pattern for client mutation + toast + `router.refresh()`.
- [`src/components/route-state-screen.tsx`](/home/guiroos/Documentos/Projects/office-8-ball/src/components/route-state-screen.tsx) already provides a richer explicit route-state surface than a plain paragraph.

### Gaps this phase must close

- `getTeamDetailData()` currently skips membership checks and exposes full detail payload for non-members.
- `/times/[id]` currently maps all nulls to `notFound()`, so it cannot present an explicit denied state.
- `TeamDetailView` does not yet wire invite/remove actions.
- `MemberList` lacks removable-row affordances and confirmation handling.
- Existing tests in [`src/lib/team-details.test.ts`](/home/guiroos/Documentos/Projects/office-8-ball/src/lib/team-details.test.ts) assert the old unrestricted behavior and will need deliberate replacement/update.
- No E2E spec currently proves "non-member denied" or "manage team members".

## Testing Strategy

### Plan 1 coverage focus

- Update/add unit tests around `src/lib/team-details.ts` to prove:
  - missing/archived team handling still returns not-found
  - non-member viewer resolves to forbidden/denied result
  - member viewer still receives detail payload
- Add page/component coverage around the denied-state rendering so the route behavior is explicit and stable.
- Keep route tests for `GET /api/teams/[id]` intact unless contract wording or message copy needs extension.

### Plan 2 coverage focus

- Route tests for `POST /api/teams/[id]/members` and `DELETE /api/teams/[id]/members/[userId]` should be expanded if current coverage is missing happy-path and denial-path assertions required by the UI wiring.
- Component tests should validate:
  - username dialog validation and lookup behavior
  - success/error toast branches
  - inline remove confirmation path
  - `router.refresh()` on successful add/remove
- Playwright should cover:
  - member can manage members from `/times/[id]`
  - non-member direct visit to `/times/[id]` shows explicit denied UI

## Common Pitfalls

### Pitfall 1: Reintroducing the Phase 4 public-detail policy

**What goes wrong:** Planner/executor preserves the old unrestricted `getTeamDetailData()` behavior because that is what current tests expect.

**How to avoid:** Make the first plan explicitly update both the loader contract and the outdated tests together.

### Pitfall 2: Hiding forbidden access behind `notFound()`

**What goes wrong:** The page remains technically protected but violates the user's explicit UI decision.

**How to avoid:** Split `forbidden` from `not-found` in the page contract and render a dedicated denied state with a path back to `/times`.

### Pitfall 3: Over-scoping member actions into a permissions redesign

**What goes wrong:** Execution starts inventing owner-only permissions, invite entities, or pending membership state.

**How to avoid:** Reuse existing Phase 1 domain rules exactly; this phase is wiring and UX, not a policy redesign.

### Pitfall 4: Full-page client conversion

**What goes wrong:** Executor turns `/times/[id]` into a large client component just to support dialogs and fetch calls.

**How to avoid:** Keep RSC data loading and mount a narrow client island only around the member-management controls.

### Pitfall 5: Tests that depend on fixed legacy teams

**What goes wrong:** E2E coverage falls back to `frontend/backend` assumptions and stops testing real team detail/member behavior.

**How to avoid:** Create users/teams dynamically inside the spec and drive flows through current `/times` pages.

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|-------------|-----------|-------|
| Node.js / npm | planner + test commands | ✓ | standard repo tooling present |
| Vitest | unit/route/component coverage | ✓ | existing repo standard |
| Playwright | authenticated E2E proof | ✓ | existing repo standard |
| `DATABASE_URL` | real member-management runtime | likely required | authenticated member APIs require DB-backed mode |
| `NEXTAUTH_SECRET` | authenticated E2E runtime | likely required | needed for Auth.js session flow |

**Planning implication:** The plans should include focused unit/route/component coverage regardless of local env, and treat authenticated E2E as required evidence with explicit environment caveat if secrets are absent at execution time.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest + testing-library + playwright |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `npm run test -- src/lib/team-details.test.ts` |
| Full suite command | `npm run test` |
| Estimated runtime | ~120 seconds |

### Required Verification Layers

1. **Unit/data-layer** for the team-detail authorization contract.
2. **Route tests** for member add/remove and username lookup behavior as needed.
3. **Client/component tests** for dialog, confirmation, status handling, and refresh behavior.
4. **Authenticated E2E** for manage-members flow and denied direct URL access.

### Wave 0 expectations

- `src/app/(authenticated)/times/[id]/page.test.tsx` or equivalent route-level rendering proof for denied state if absent.
- `src/components/teams/team-member-manager.test.tsx` or equivalent component coverage for add/remove flows.
- `e2e/team-member-actions.spec.ts` or equivalent authenticated spec covering both success and denied access scenarios.

## Planning Recommendations

- Use **2 plans**.
- Put the **authorization/data contract** in **wave 1**.
- Put the **member actions + E2E** in **wave 2**, depending on wave 1.
- Ensure `TEAM-02` appears in both plans' requirement coverage if objectives are split, or at minimum in every plan that materially advances it.

## Output for Planner

- Favor explicit file ownership and concrete actions over broad "wire the UI" language.
- Make the denied-state behavior and the old test replacement a first-class task, not a footnote.
- Require exact API endpoints, exact route/component files, and exact verification commands in each task.

