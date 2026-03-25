# Roadmap: Office Sinuca Tracker v1

**Created:** 2026-03-23
**Phases:** 5
**Granularity:** Standard
**Coverage:** 12/12 v1 requirements mapped

---

## Phases

- [x] **Phase 1: Dynamic Team Management** — Users can create teams (solo/duo types) and manage rosters; verifies dual-mode persistence (completed 2026-03-25)
- [ ] **Phase 2: Scoreboard Reactivation & Match Recording** — Reactivate scoreboard API for dynamic teams; connect match recording to dynamic team selection
- [ ] **Phase 3: Stats Computation Module** — Pure functions for W/L aggregation, win rates, streaks, and head-to-head metrics
- [ ] **Phase 4: Ranking & Team Details** — Ranking page with live standings; team detail pages with stats and roster
- [ ] **Phase 5: User Profiles & Advanced Features** — User profile with aggregated stats; head-to-head history; time-based ranking filters

---

## Phase Details

### Phase 1: Dynamic Team Management

**Goal:** Users can create teams (solo or duo), manage rosters, and API responses match in-memory constants

**Depends on:** Nothing (first phase)

**Requirements:** TEAM-01

**Success Criteria** (what must be TRUE):
1. User can create a team with type `solo` or `duo` and a unique name
2. User can view a list of their teams with member roster
3. User can add existing users to a team as members
4. User can remove members from a team they own
5. Dual-mode persistence verified: same teams exist in in-memory constants and PostgreSQL database
6. All team CRUD operations work without DATABASE_URL (in-memory mode)

**Plans:**
2/2 plans complete
- [x] 01-PLAN-1 — Add TeamType enum and type field to schema, domain layer, and POST /api/teams
- [x] 01-PLAN-2 — Implement POST/DELETE member management endpoints with constraints

---

### Phase 2: Scoreboard Reactivation & Match Recording

**Goal:** Scoreboard API returns dynamic team rankings; match recording uses dynamic team selection

**Depends on:** Phase 1

**Requirements:** DASH-01, DASH-02

**Success Criteria** (what must be TRUE):
1. Dashboard fetches teams from `/api/teams` dynamically (no hardcoded `frontend`/`backend` constants)
2. `/api/scoreboard` returns all user's teams with combined match history (reimplemented for dynamic teams)
3. Users can register match results and select from their dynamic teams as winner
4. Match recorded by User A on Team X appears in scoreboard for all users viewing Team X
5. Scoreboard query has no limits (fetches ALL matches; prevents silent data corruption)
6. API performance < 500ms for office scale (100+ matches per team)

**Plans:** 2 plans
- [ ] 02-01-PLAN.md — Reactivate GET /api/scoreboard: add ScoreboardResponse types, implement getScoreboard() in data layer (no query limits), rewrite route handler, full test coverage
- [ ] 02-02-PLAN.md — Refactor dashboard to use dynamic teams: remove TEAMS constant, add useTeamsData() hook, fix registerWin payload to send teamAId+teamBId+winnerTeamId

**UI hint:** yes

---

### Phase 3: Stats Computation Module

**Goal:** Isolated, testable functions for deriving W/L, win rates, streaks, and head-to-head metrics from match history

**Depends on:** Phase 1, Phase 2

**Requirements:** (none directly — enables Phase 4)

**Success Criteria** (what must be TRUE):
1. `computeTeamStats()` correctly calculates wins, losses, win rate, current streak, longest streak per team
2. Edge cases handled correctly: 0 matches (0% win rate), 1 match (100%), 100+ matches (accurate aggregation)
3. Streak detection correctly identifies winning and losing streaks from match sequence
4. `computeHeadToHead()` isolates matches between two teams; result is subset of all matches
5. All stats functions are pure (no side effects); fully testable without database
6. All output types validate against Zod schemas (winRate in [0,100], streak >= 0, etc.)

**Plans:** TBD

---

### Phase 4: Ranking & Team Details

**Goal:** Ranking page displays live standings with all stats; team detail pages show per-team metrics and roster

**Depends on:** Phase 1, Phase 2, Phase 3

**Requirements:** TEAM-02, RANK-01, RANK-02, RANK-03, RANK-04

**Success Criteria** (what must be TRUE):
1. Ranking page displays all teams sorted by wins (descending); includes W/L, win rate %, current streak, total matches
2. Ranking updates within 1 second of match creation (cache revalidation works)
3. Team detail page shows: team name, roster, W/L stats, current streak, total matches, recent matches list
4. Team detail page accessible via `/team/:id` or equivalent route
5. Users can compare two teams' records (visual comparison on team detail page or H2H metrics visible)
6. No hardcoded team constants in ranking or team detail components; all data from dynamic APIs

**Plans:** TBD

**UI hint:** yes

---

### Phase 5: User Profiles & Advanced Features

**Goal:** Users see personal stats across all their teams; ranking supports time-based views

**Depends on:** Phase 1, Phase 2, Phase 3, Phase 4

**Requirements:** PROF-01, PROF-02, PROF-03, RANK-05

**Success Criteria** (what must be TRUE):
1. User profile page displays user's aggregated stats: total wins, total losses, overall win rate across all teams
2. Profile shows total matches played (sum of all team matches user participated in)
3. Profile lists all teams the user belongs to with per-team stats
4. Ranking page supports time-based filters: All-Time, This Month, This Week (date-filtered match queries)
5. Head-to-head history accessible from team detail pages or via `/head-to-head?teamA=x&teamB=y` route
6. All stats derivable without schema changes (filters applied in application layer)

**Plans:** TBD

**UI hint:** yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Dynamic Team Management | 2/2 | Complete   | 2026-03-25 |
| 2. Scoreboard Reactivation & Match Recording | 0/2 | Planning   | - |
| 3. Stats Computation Module | 0/? | Not started | - |
| 4. Ranking & Team Details | 0/? | Not started | - |
| 5. User Profiles & Advanced Features | 0/? | Not started | - |

---

## Requirement Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEAM-01 | Phase 1 | Complete |
| TEAM-02 | Phase 4 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| RANK-01 | Phase 4 | Pending |
| RANK-02 | Phase 4 | Pending |
| RANK-03 | Phase 4 | Pending |
| RANK-04 | Phase 4 | Pending |
| RANK-05 | Phase 5 | Pending |
| PROF-01 | Phase 5 | Pending |
| PROF-02 | Phase 5 | Pending |
| PROF-03 | Phase 5 | Pending |

**Coverage:** 12/12 v1 requirements mapped ✓

---

*Roadmap created: 2026-03-23*
*Phase 1 executed: 2026-03-25*
*Phase 2 planned: 2026-03-25*
