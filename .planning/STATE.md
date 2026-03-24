# STATE.md — Office Sinuca Tracker v1 Roadmap

**Project:** Office Sinuca Tracker — dynamic team leaderboard for office billiards tracking
**Status:** Roadmap created, awaiting planning phase execution
**Last updated:** 2026-03-23

---

## Project Reference

**Core Value:** O ranking de times sempre atualizado — qualquer colega abre o app e vê imediatamente quem está ganhando.

**Current Focus:** v1 launch — dynamic team management, live scoreboard, ranked standings

**Scope Boundaries:**
- v1: Dynamic teams, match recording, ranking page, user profiles
- v1.x (deferred): Advanced filtering, deep customization, competitive features
- v2+: Mobile app, ELO system, tournaments, real-time notifications

---

## Current Position

**Milestone:** Office Sinuca Tracker v1
**Phase:** Roadmap phase (planning complete; awaiting plan creation)
**Plan:** None (awaiting `/gsd:plan-phase 1`)
**Progress:** 0/5 phases started

```
[ROADMAP] → [PLANNING PHASE 1] → [EXECUTING PHASE 1] → [PLANNING PHASE 2] → ...
    ✓ Done          ← You are here
```

---

## Roadmap Summary

**Total phases:** 5
**Requirement coverage:** 12/12 (100%)
**Estimated scope:** ~40-60 implementation plans across 5 phases

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Dynamic Team CRUD + dual-mode verification | TEAM-01 | Not started |
| 2 | Scoreboard API reactivation + match recording | DASH-01, DASH-02 | Not started |
| 3 | Stats computation module (W/L, streaks, H2H) | — | Not started |
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
*Ready for: `/gsd:plan-phase 1`*
