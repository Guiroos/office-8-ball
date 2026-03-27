---
phase: 06-team-creation-flow-wiring
plan: 01
subsystem: ui
tags: [react, next.js, forms, fetch, zod, sonner, testing-library]

# Dependency graph
requires:
  - phase: 01-dynamic-team-management
    provides: POST /api/teams endpoint accepting { name, type, secondMemberUserId }
  - phase: 04-ranking-team-details
    provides: /times page with tab-based navigation and placeholder create tab
provides:
  - TeamCreateForm client component at src/components/teams/team-create-form.tsx
  - /times?tab=create renders real solo-team creation form (no placeholder)
  - 5 unit tests covering payload, success, and 400/401/503 error branches
affects:
  - 06-02 (match recording wiring - same page area, shares router pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client form with Zod validate-then-fetch pattern (trim+lowercase name transform before POST)"
    - "Status-code-specific error messages: 401 and 503 use fixed PT-BR strings; others read payload.error"
    - "TDD: RED commit (test) then GREEN commit (feat) then wire commit (feat) for each form feature"

key-files:
  created:
    - src/components/teams/team-create-form.tsx
    - src/components/teams/team-create-form.test.tsx
  modified:
    - src/app/(authenticated)/times/page.tsx

key-decisions:
  - "TeamCreateForm only sends solo payloads — no secondMemberUserId field in this plan (duo flow deferred)"
  - "Success callback does router.push('/times?tab=teams') + router.refresh() (no props/callbacks needed)"
  - "All error feedback goes through toast.error (sonner) — no inline error state shown to user after submit"

patterns-established:
  - "Fixed PT-BR messages for 401 ('Faça login novamente para criar times.') and 503 ('Serviço indisponível. Configure o banco para criar times.')"

requirements-completed: [TEAM-01]

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 06 Plan 01: Team Creation Flow Wiring Summary

**TeamCreateForm client component wired into /times?tab=create, sending POST /api/teams with solo payload, Zod validation, and status-specific PT-BR error messages**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T00:17:56Z
- **Completed:** 2026-03-27T00:19:56Z
- **Tasks:** 3 (TDD RED + GREEN + page wiring)
- **Files modified:** 3

## Accomplishments

- `TeamCreateForm` client component validates name (min 1, max 50, trim+lowercase) and POSTs `{ name, type: "solo" }` to `/api/teams`
- Success flow triggers `toast.success`, clears field, navigates to `/times?tab=teams`, and calls `router.refresh()`
- `/times?tab=create` replaced placeholder paragraph with `<TeamCreateForm />` — create tab is now fully functional
- 5 unit tests cover payload serialization, 201/400/401/503 branches using Testing Library + mock fetch

## Task Commits

Each task was committed atomically:

1. **Task 1: Criar testes de contrato (TDD RED)** - `89c79cb` (test)
2. **Task 2: Implementar TeamCreateForm (TDD GREEN)** - `4ef159f` (feat)
3. **Task 3: Substituir placeholder no /times (wiring)** - `a463f53` (feat)

## Files Created/Modified

- `src/components/teams/team-create-form.tsx` - Client form component with Zod validation and fetch-based POST to /api/teams
- `src/components/teams/team-create-form.test.tsx` - 5 tests covering payload, success callbacks, and error status branches
- `src/app/(authenticated)/times/page.tsx` - Added TeamCreateForm import; replaced placeholder with `<TeamCreateForm />`

## Decisions Made

- TeamCreateForm sends only solo payloads in this plan; duo form flow is out of scope for plan 01
- Error handling uses toast.error throughout (no inline field errors after submit, only pre-submit Zod validation shows inline)
- router.push + router.refresh after success ensures the teams tab reflects the newly created team immediately

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/times?tab=create` now sends real API requests; TEAM-01 runtime gap is closed
- Plan 06-02 can proceed to wire match recording to dynamic teams
- No blockers

---
*Phase: 06-team-creation-flow-wiring*
*Completed: 2026-03-27*
