---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
last_updated: "2026-03-25T22:50:00.386Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 3
  completed_plans: 5
---

# STATE.md — Office Sinuca Tracker v1 Roadmap

**Project:** Office Sinuca Tracker — dynamic team leaderboard for office billiards tracking
**Status:** Phase complete — ready for verification
**Last updated:** 2026-03-25

---

## Project Reference

**Core Value:** O ranking de times sempre atualizado — qualquer colega abre o app e vê imediatamente quem está ganhando.

**Current Focus:** Phase 03 — stats-computation-module

**Scope Boundaries:**

- v1: Dynamic teams, match recording, ranking page, user profiles
- v1.x (deferred): Advanced filtering, deep customization, competitive features
- v2+: Mobile app, ELO system, tournaments, real-time notifications

---

## Current Position

Phase: 03 (stats-computation-module) — COMPLETE
Plan: 1 of 1 (all plans done)

## Roadmap Summary

**Total phases:** 5
**Requirement coverage:** 12/12 (100%)
**Estimated scope:** ~40-60 implementation plans across 5 phases

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Dynamic Team CRUD + dual-mode verification | TEAM-01 | ✓ Complete |
| 2 | Scoreboard API reactivation + match recording | DASH-01, DASH-02 | ✓ Complete |
| 3 | Stats computation module (W/L, streaks, H2H) | — | ✓ Complete |
| 4 | Ranking page + team detail pages | TEAM-02, RANK-01..04 | Not started |
| 5 | User profiles + time filters + H2H views | PROF-01..03, RANK-05 | Not started |

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
    - Rationale: Type safety via z.infer keeps types and validation schemas in sync automatically; types.ts provides single import path for consumers
    - Implication: Phase 4 can import TeamStats from either @/lib/stats or @/lib/types

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
*Last session: 2026-03-25 — Completed 03-01-PLAN.md (stats computation module: computeTeamStats, computeHeadToHead, 21 unit tests)*
