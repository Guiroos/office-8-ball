---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: "Phase 08 shipped — PR #78"
last_updated: "2026-03-27T03:30:44.849Z"
progress:
  total_phases: 8
  completed_phases: 8
  total_plans: 19
  completed_plans: 19
---

# STATE.md — Office Sinuca Tracker v1 Roadmap

**Project:** Office Sinuca Tracker — dynamic team leaderboard for office billiards tracking
**Status:** Phase 08 shipped — PR #78
**Last updated:** 2026-03-27 — Phase 08 shipped (PR #78) — v1.0 milestone complete

---

## Project Reference

**Core Value:** O ranking de times sempre atualizado — qualquer colega abre o app e vê imediatamente quem está ganhando.

**Current Focus:** Phase 08 — ranking-team-verification-recovery (Complete — traceability recovery closed Phase 4 audit blocker)

**Scope Boundaries:**

- v1: Dynamic teams, match recording, ranking page, user profiles
- v1.x (deferred): Advanced filtering, deep customization, competitive features
- v2+: Mobile app, ELO system, tournaments, real-time notifications

---

## Current Position

Phase: 08 — COMPLETE (all phases done, v1.0 milestone shipped)
Plan: All plans complete (19/19)

## Roadmap Summary

**Total phases:** 8
**Requirement coverage:** 12/12 (100%)
**Plans executed:** 19/19

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Dynamic Team CRUD + dual-mode verification | TEAM-01 | ✓ Complete |
| 2 | Scoreboard API reactivation + match recording | DASH-01, DASH-02 | ✓ Complete |
| 3 | Stats computation module (W/L, streaks, H2H) | — | ✓ Complete |
| 4 | Ranking page + team detail pages | TEAM-02, RANK-01..04 | ✓ Complete |
| 5 | User profiles + time filters + H2H views | PROF-01..03, RANK-05 | Planned |

---

## Performance Metrics

**Code Health:**

- Lines of code (base): ~8,000 (Next.js app) — TBD after Phase 1
- Test coverage (target): 80%+ for stats module, 60%+ for routes
- Build time (target): < 30 seconds (Next.js 16)
- Dev server startup (target): < 5 seconds

**Runtime Performance:**

- Scoreboard API: < 500ms for office scale (100+ matches/team)
- Ranking page load: < 1 second cold; < 100ms cached
- Match recording: < 2 seconds (includes validation + API call)

**User Experience:**

- Match → ranking update: < 1 second (cache revalidation)
- Team creation → visibility in dashboard: Immediate
- No hardcoded team constants visible in UI

---

## Accumulated Context

**Decisions Made:**

1. **Stats computation in application layer** (not database)
   - Rationale: Keeps data derivation consistent; single source of truth (match history)
   - Implication: All stats functions pure and testable; reusable across routes

2. **Dual-mode persistence** (in-memory + Prisma)
   - Rationale: Supports local dev and unit tests without DATABASE_URL
   - Implication: Phase 1 must verify constants and DB always in sync

3. **No new dependencies**
   - Rationale: Existing stack (Prisma, Next.js, Tailwind, shadcn) sufficient
   - Implication: All aggregation via Prisma + application logic

4. **Team-centric ranking** (not player-centric initially)
   - Rationale: Office context is team-based league; individual profiles come later
   - Implication: Phase 4 ranking focuses on team standings; Phase 5 adds player profiles

5. **TeamType enum follows TeamStatus enum pattern** (Plan 01-01)
   - Rationale: Consistent enum pattern in schema; type safety at DB level
   - Implication: solo = 1 member (creator only); duo = 2 members (creator + secondMemberUserId)

6. **Seed script requires no team changes** (Plan 01-01)
   - Rationale: Teams are created at runtime by users; no hardcoded seed teams
   - Implication: No seed migration needed for type field

7. **Member management endpoints return 503 without DATABASE_URL** (Plan 01-02)
   - Rationale: No in-memory fallback for team member operations (per D-10)
   - Implication: POST/DELETE /api/teams/:id/members require DATABASE_URL to function

8. **Async params pattern for all dynamic route handlers** (Plan 01-02)
   - Rationale: Next.js 15+ requires params as Promise; existing codebase uses this pattern
   - Implication: All `[id]/route.ts` files use `{ params }: { params: Promise<{...}> }` with `await params`

9. **getScoreboard() returns raw ScoreboardData; route wraps in { scoreboard }** (Plan 02-01)
   - Rationale: Keeps data layer clean and testable independently of API shape
   - Implication: Route layer is responsible for wrapping domain data in API response envelope

10. **No .take() on scoreboard query — enforced by test** (Plan 02-01)
    - Rationale: Any query limit silently produces wrong wins/losses/streak counts at scale
    - Implication: Test inspects mock call args to verify no take() is present

11. **leaderTeamId is null on exact tie — no tiebreakers in v1** (Plan 02-01)
    - Rationale: Simplest correct behavior; tiebreakers add complexity without office-scale value
    - Implication: UI must handle null leaderTeamId (show "Tied" state)

12. **Team color variant is positional (index), not identity-based** (Plan 02-02)
    - Rationale: Decouples UI color scheme from database team IDs; first team = alpha, second = beta
    - Implication: Dashboard renders any two teams with consistent alpha/beta visual distinction

13. **useTeamsData() follows same error-toast pattern as useDashboardData()** (Plan 02-02)
    - Rationale: Consistent UX for loading errors; sonner toast.error used throughout the hook layer
    - Implication: All data hook errors surface as toasts — no silent failures

14. **Iterate match array oldest-to-newest for streak detection** (Plan 03-01)
    - Rationale: Forward iteration (most-recent-first) would track the oldest streak as "current"; reversed ensures currentStreak reflects the most recent continuous run
    - Implication: detectStreaks processes teamMatches in reverse; currentStreak is the final runType/runCount at loop end

15. **Stats types co-located with Zod schemas in stats.ts; re-exported from types.ts** (Plan 03-01)

16. **BRT window uses fixed UTC-3 offset (no DST) in time-period.ts** (Plan 05-01)
    - Rationale: America/Sao_Paulo observes no DST in 2026; fixed offset avoids Intl dependency and keeps function pure and deterministic
    - Implication: If DST rules change, update BRT_OFFSET_MS; injectable `now` param makes this testable

17. **computeProfilePageData returns placeholder identity fields; page assembler overrides** (Plan 05-01)

18. **Period filter in listAllTeamsWithStats uses playedAt: { gte, lt } spread; period=all produces empty spread for backward compatibility** (Plan 05-03)
    - Rationale: Keeps match query unchanged for all-time view; no conditional query path needed
    - Implication: RankingView receives activePeriod as optional prop, prefixed _ until period tabs UI is wired

19. **RankingView accepts optional activePeriod prop but does not render it yet** (Plan 05-03) — now fully consumed by PeriodTabs in Plan 05-04
    - Rationale: Data pipeline complete; UI wiring deferred to a later plan targeting period tabs
    - Implication: activePeriod prop now consumed; PeriodTabs renders all/month/week tabs with URLSearchParams cross-filter preservation
    - Rationale: Keeps domain function pure and testable without user DB lookup; server assembler (D-01) merges user record
    - Implication: Callers must override username/displayName/avatarUrl/bio/createdAt from the user record
    - Rationale: Type safety via z.infer keeps types and validation schemas in sync automatically; types.ts provides single import path for consumers
    - Implication: Phase 4 can import TeamStats from either @/lib/stats or @/lib/types

21. **URLSearchParams used in TypeTabs and PeriodTabs to build cross-preserving filter hrefs** (Plan 05-04)
    - Rationale: Default values (all/all) omitted from URL to keep links clean and readable
    - Implication: /ranking with no params = all types, all-time; each tab set receives the other filter's current value

20. **resolveHeadToHeadData is a pure function; page assembler fetches data and passes arrays** (Plan 05-05)
    - Rationale: Keeps domain logic testable without DB; consistent with stats.ts and profile-stats.ts patterns
    - Implication: Page handles listUserTeams + listMatches, then passes arrays to resolveHeadToHeadData

22. **getTeamDetailData returns TeamDetailResult discriminated union (not-found | forbidden | detail)** (Plan 07-01)
    - Rationale: null was overloaded for both "team missing" and "non-member"; discriminated union makes all three outcomes explicit and type-safe
    - Implication: Page must branch on .kind; forbidden case renders TeamDetailAccessDenied instead of calling notFound()

23. **isTeamMember gate runs before heavy queries in getTeamDetailData** (Plan 07-01)
    - Rationale: Mirrors existing API route pattern; prevents data leakage to non-members; avoids unnecessary DB work
    - Implication: ranking, matches, users queries only execute when viewer is a confirmed member

24. **Button "destructive" variant absent in design system — ghost + semantic tokens used for Confirmar button** (Plan 07-02)
    - Rationale: Adding new variant to button requires design review; semantic tokens (border-destructive text-destructive) achieve the same visual intent within existing token system
    - Implication: MemberList Confirmar button uses ghost variant with className override; no Button component changes needed

25. **viewerId flows page → TeamDetailView → MemberList — keeps client components sessionless** (Plan 07-02)
    - Rationale: page.tsx is server component and single auth authority; client components receive only what they need
    - Implication: InviteMemberDialog and MemberList have no session dependency; testable in isolation with mock props

**Pitfalls to Avoid:**

- **Pitfall 1: Silent scoreboard corruption via query limits** → Enforce "no limits on scoreboard" rule in Phase 2; test with 100+ matches
- **Pitfall 2: Hardcoded UI disconnected from dynamic APIs** → Phase 1 removes hardcoded constants immediately after API exists
- **Pitfall 3: Derived stats cached without revalidation** → Phase 4 implements `revalidateTag('scoreboard')` immediately after match creation; E2E tested
- **Pitfall 4: Inconsistent team data between constants and DB** → Phase 1 dual-mode tests verify sync; schema changes require constant + seed updates together
- **Pitfall 7: Win rate & streak calculations off-by-one** → Phase 3 includes edge case tests (0 matches, 1 match, NaN handling)

**Technical Debt Captured:**

- None at roadmap stage; will accumulate during phase execution

---

## Session Continuity

**When resuming work:**

1. Check current phase progress via `.planning/ROADMAP.md` progress table
2. Read current phase's plan file (e.g., `.planning/PLANS/phase-1.md`)
3. Consult `.planning/research/SUMMARY.md` for architecture patterns
4. Reference `.claude/rules/` for code standards and safety checklist

**Key files to keep in sync:**

- `.planning/ROADMAP.md` — Phase definitions; update progress table after each plan completes
- `.planning/STATE.md` — This file; update "Current Position", metrics, and context accumulation
- `.planning/REQUIREMENTS.md` — Traceability table; update when requirements reassigned

**Escalation triggers:**

- If a phase uncovers requirement that doesn't fit: surface in planning, update REQUIREMENTS.md
- If technical blocker found: document in STATE.md "Accumulated Context" and surface to user
- If performance doesn't meet targets: revisit Phase 3 or 2 implementation; may need schema indexes or query optimization

---

*STATE.md created: 2026-03-23*
*Last session: 2026-03-26 — Completed 05-02-PLAN.md (profile server-side wiring: async RSC assembler + ProfilePage props migration, 2 tasks, 4 files, 11 tests)*
*Last session: 2026-03-26 — Completed 05-03-PLAN.md (ranking period filter: period=all|month|week in listAllTeamsWithStats and /ranking page, 3 new tests)*
*Last session: 2026-03-26 — Completed 05-05-PLAN.md (head-to-head route: resolveHeadToHeadData assembler D-15..D-17, /head-to-head page, HeadToHeadView URL-synced selectors, 11 tests)*
*Last session: 2026-03-26 — Completed 05-04-PLAN.md (ranking period tabs: PeriodTabs component, TypeTabs cross-filter preservation, period-aware empty state, 7 new tests, RANK-05 complete)*
*Last session: 2026-03-27 — Completed 08-01-PLAN.md (Phase 4 verification recovery: 04-VERIFICATION.md recreated with RANK-01..04 requirement-level evidence and TEAM-02 traceability note; 04-CODEX-CHECKS.md updated with Phase 8 recovery reruns; 20/20 tests pass, typecheck pass)*
*Last session: 2026-03-27 — Completed 08-02-PLAN.md (traceability repair: ROADMAP.md traceability table corrected, milestone audit refreshed to passed, Phase 8 traceability recovery closes Phase 4 audit blocker; RANK-01..04 no longer orphaned; TEAM-02 canonical evidence confirmed at Phase 7)*
*Last session: 2026-03-27 — Completed 06-01-PLAN.md (team creation flow wiring: TeamCreateForm solo component, /times?tab=create wired, 5 tests, TEAM-01 runtime gap closed)*
*Last session: 2026-03-27 — Completed 06-02-PLAN.md (team-creation-flow-wiring E2E spec: create solo team flow Playwright test passes against real runtime, 2 tasks, 1 file, TEAM-01 gate closed)*
*Last session: 2026-03-26 — Completed 07-01-PLAN.md (team-detail membership gate: TeamDetailResult discriminated union, isTeamMember gate before heavy queries, TeamDetailAccessDenied component, 11 tests, TEAM-02 access hardening)*
*Last session: 2026-03-26 — Completed 07-02-PLAN.md (team member actions: InviteMemberDialog username lookup + POST, MemberList inline Confirmar/Cancelar + DELETE, 19 new component+route tests, E2E spec, TEAM-02 fully validated)*
