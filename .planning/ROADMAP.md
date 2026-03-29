# Roadmap: Office Sinuca Tracker v1

**Created:** 2026-03-23
**Phases:** 9
**Granularity:** Standard
**Coverage:** 12/12 v1 requirements mapped

---

## Phases

- [x] **Phase 1: Dynamic Team Management** — Users can create teams (solo/duo types) and manage rosters; verifies dual-mode persistence (completed 2026-03-25)
- [x] **Phase 2: Scoreboard Reactivation & Match Recording** — Reactivate scoreboard API for dynamic teams; connect match recording to dynamic team selection (completed 2026-03-25)
- [x] **Phase 3: Stats Computation Module** — Pure functions for W/L aggregation, win rates, streaks, and head-to-head metrics (completed 2026-03-25)
- [x] **Phase 4: Ranking & Team Details** — Ranking page with live standings; team detail pages with stats and roster (completed 2026-03-25)
- [x] **Phase 5: User Profiles & Advanced Features** — User profile with aggregated stats; head-to-head history; time-based ranking filters (planned 2026-03-26) (completed 2026-03-26)
- [x] **Phase 6: Team Creation Flow Wiring** — Wire `/times?tab=create` solo team submit flow to `POST /api/teams` with runtime validation and success/error handling (planned 2026-03-26) (completed 2026-03-27)
- [x] **Phase 7: Team Details Access & Member Actions** — Enforce member-only team detail access and wire invite/remove UI actions to member endpoints (planned 2026-03-26) (completed 2026-03-27)
- [x] **Phase 8: Ranking/Team Verification Recovery** — Re-verify Phase 4 requirements and restore verification traceability for `RANK-01..04`; `TEAM-02` cross-referenced to Phase 7 as canonical proof (planned 2026-03-26) (completed 2026-03-27)
- [ ] **Phase 9: Auth Migration next-auth to better-auth** — Replace next-auth 4.24.13 with better-auth, preserving all auth behaviors: username/password login, database sessions, rate limiting, middleware-based route protection, DATABASE_URL guard (planned 2026-03-28)

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

**Plans:** 2/2 plans complete
- [x] 02-01-PLAN.md — Reactivate GET /api/scoreboard: add ScoreboardResponse types, implement getScoreboard() in data layer (no query limits), rewrite route handler, full test coverage
- [x] 02-02-PLAN.md — Refactor dashboard to use dynamic teams: remove TEAMS constant, add useTeamsData() hook, fix registerWin payload to send teamAId+teamBId+winnerTeamId

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

**Plans:** 1/1 plans complete
- [x] 03-01-PLAN.md — Implement stats.ts (computeTeamStats, computeHeadToHead, Zod schemas) and stats.test.ts (15+ edge case tests covering SC-1..SC-6)

---

### Phase 4: Ranking & Team Details

**Goal:** Ranking page displays live standings with all stats; team detail pages show per-team metrics and roster

**Depends on:** Phase 1, Phase 2, Phase 3

**Requirements:** TEAM-02, RANK-01, RANK-02, RANK-03, RANK-04

**Success Criteria** (what must be TRUE):
1. Ranking page displays all teams sorted by wins (descending); includes W/L, win rate %, current streak, total matches
2. Ranking updates within 1 second of match creation (cache revalidation works)
3. Team detail page shows: team name, roster, W/L stats, current streak, total matches, recent matches list
4. Team detail page accessible via `/times/:id` route
5. Users can compare two teams' records (H2H section on team detail page)
6. No hardcoded team constants in ranking or team detail components; all data from dynamic APIs

**Plans:** 3 plans
- [x] 04-01-PLAN.md — Data foundation: stable ranking sort + in-memory fallback tests + match POST revalidation for /ranking and /times subtree
- [x] 04-02-PLAN.md — Ranking UI: PodiumCard/StandingsRow/TypeTabs/RankingView + /ranking RSC + behavior tests (podium order, states, links)
- [x] 04-03-PLAN.md — Team details foundation: getTeamDetailData() server assembler + /times tabs/CTA + /times/[id] with server-side H2H summaries

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

**Plans:** 5/5 plans complete

Plans:
- [x] 05-01-PLAN.md — Domain contracts and aggregators for profile stats + time-period windows
- [x] 05-02-PLAN.md — Server-first `/profile` wiring and UI migration to aggregated payload
- [x] 05-03-PLAN.md — Ranking backend/route support for `period=all|month|week`
- [x] 05-04-PLAN.md — Ranking UI period filters with query-param preservation and tests
- [x] 05-05-PLAN.md — Dedicated `/head-to-head` route with fallback validation and URL sync

**UI hint:** yes

---

### Phase 6: Team Creation Flow Wiring

**Goal:** `/times?tab=create` performs real team creation for solo teams with consistent API/UI behavior

**Depends on:** Phase 1, Phase 2

**Requirements:** TEAM-01

**Success Criteria** (what must be TRUE):
1. Create tab submit triggers `POST /api/teams` with validated payload for solo team creation
2. Successful creation refreshes team lists/views and gives clear user feedback
3. API and client error paths are handled (including auth and validation failures) without placeholder dead-ends
4. Flow "Create solo team" passes end-to-end in authenticated runtime

**Plans:** 2/2 plans complete

Plans:
- [x] 06-01-PLAN.md — Wire `/times?tab=create` solo form to `POST /api/teams` with client validation, status-aware feedback, and list refresh
- [x] 06-02-PLAN.md — Add authenticated E2E coverage for create-solo flow and run phase gate verification commands

**UI hint:** yes

---

### Phase 7: Team Details Access & Member Actions

**Goal:** Team detail data is member-protected and team management actions are wired to runtime API calls

**Depends on:** Phase 1, Phase 4, Phase 6

**Requirements:** TEAM-02

**Success Criteria** (what must be TRUE):
1. Team detail loader enforces viewer membership/ownership checks before returning team payload
2. Non-member direct URL access to `/times/[id]` is denied safely and predictably
3. Team detail invite/remove actions call `POST/DELETE /api/teams/:id/members` and update UI state
4. Flow "Manage team members" passes end-to-end in authenticated runtime
5. Flow "Team details authorization" passes with explicit non-member access test coverage

**Plans:** 2/2 plans complete

Plans:
- [x] 07-01-PLAN.md — Replace the legacy public `/times/[id]` contract with member-only detail results and an explicit denied state
- [x] 07-02-PLAN.md — Wire invite/remove member actions on the detail page and prove the flow with route, component, and E2E coverage

**UI hint:** yes

---

### Phase 8: Ranking/Team Verification Recovery

**Goal:** Close orphaned requirement evidence by re-verifying Phase 4 outcomes and restoring requirements traceability integrity

**Depends on:** Phase 4, Phase 7

**Requirements:** RANK-01, RANK-02, RANK-03, RANK-04

**Success Criteria** (what must be TRUE):
1. Missing verification artifact for Phase 4 is recreated with requirement-level evidence for `RANK-01..04` plus an explicit `TEAM-02` traceability note pointing to Phase 7 as canonical proof
2. Ranking requirements (`RANK-01..04`) are revalidated against current runtime behavior and tests
3. Requirement traceability reflects verified, non-orphaned status after phase execution
4. Milestone audit no longer reports orphaned requirement gaps tied to Phase 4

**TEAM-02 traceability note:** `TEAM-02` is not a Phase 8 requirement. Its canonical evidence lives in `.planning/phases/07-team-details-access-member-actions/07-VERIFICATION.md`. Phase 7 is the authoritative proof that TEAM-02 is satisfied. Phase 8 cross-references Phase 7 as canonical proof rather than recreating competing evidence.

**Plans:** 2/2 plans complete
- [x] 08-01-PLAN.md — Recover `04-VERIFICATION.md` from current ranking evidence and log the focused reruns in Phase 4 control notes
- [x] 08-02-PLAN.md — Repair requirements, roadmap, audit, and state traceability after recovered Phase 4 evidence exists

---

### Phase 9: Auth Migration next-auth to better-auth

**Goal:** Replace next-auth 4.24.13 with better-auth, preserving all existing auth behaviors: username/password login, database sessions, rate limiting, middleware-based route protection, and the DATABASE_URL guard pattern

**Depends on:** Phase 8

**Requirements:** AUTH-MIGRATION-01, AUTH-MIGRATION-02, AUTH-MIGRATION-03, AUTH-MIGRATION-04, AUTH-MIGRATION-05, AUTH-MIGRATION-06, AUTH-MIGRATION-07, AUTH-MIGRATION-08

**Success Criteria** (what must be TRUE):
1. better-auth installed; next-auth fully removed from dependencies and source
2. Username/password login works with existing bcrypt-hashed passwords (no data migration)
3. Sessions stored in database (session table); session shape { id, username } preserved for all consumers
4. DATABASE_URL guard helpers preserved with identical signatures; routes return 503 without DB
5. Client-side auth via @/lib/auth-client; no next-auth/react imports remain
6. proxy.ts replaces middleware.ts with same route matcher config
7. npm run test passes; npm run typecheck passes; npm run build succeeds

**Plans:** 1/4 plans executed

Plans:
- [x] 09-01-PLAN.md — Wave 0: Update test mocks (auth.test.ts, login-screen.test.tsx, app-shell.test.tsx) to reference better-auth/auth-client before production code changes
- [x] 09-02-PLAN.md — Wave 1: Install better-auth, rewrite src/lib/auth.ts, add Session + Account Prisma models + migration
- [ ] 09-03-PLAN.md — Wave 2: Create src/lib/auth-client.ts, update login-screen.tsx and app-shell.tsx
- [ ] 09-04-PLAN.md — Wave 3: Create proxy.ts, create [...all] route handler, delete [...nextauth] + next-auth.d.ts + middleware.ts; full suite verification

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Dynamic Team Management | 2/2 | Complete   | 2026-03-25 |
| 2. Scoreboard Reactivation & Match Recording | 2/2 | Complete   | 2026-03-25 |
| 3. Stats Computation Module | 1/1 | Complete   | 2026-03-25 |
| 4. Ranking & Team Details | 3/3 | Complete   | 2026-03-25 |
| 5. User Profiles & Advanced Features | 5/5 | Complete   | 2026-03-26 |
| 6. Team Creation Flow Wiring | 2/2 | Complete   | 2026-03-27 |
| 7. Team Details Access & Member Actions | 2/2 | Complete   | 2026-03-27 |
| 8. Ranking/Team Verification Recovery | 2/2 | Complete   | 2026-03-27 |
| 9. Auth Migration next-auth to better-auth | 1/4 | In Progress|  |

---

## Requirement Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEAM-01 | Phase 6 | Complete |
| TEAM-02 | Phase 7 | Complete |
| DASH-01 | Phase 2 | Complete |
| DASH-02 | Phase 2 | Complete |
| RANK-01 | Phase 8 | Complete |
| RANK-02 | Phase 8 | Complete |
| RANK-03 | Phase 8 | Complete |
| RANK-04 | Phase 8 | Complete |
| RANK-05 | Phase 5 | Complete |
| PROF-01 | Phase 5 | Complete |
| PROF-02 | Phase 5 | Complete |
| PROF-03 | Phase 5 | Complete |
| AUTH-MIGRATION-01 | Phase 9 | Planned |
| AUTH-MIGRATION-02 | Phase 9 | Planned |
| AUTH-MIGRATION-03 | Phase 9 | Planned |
| AUTH-MIGRATION-04 | Phase 9 | Planned |
| AUTH-MIGRATION-05 | Phase 9 | Planned |
| AUTH-MIGRATION-06 | Phase 9 | Planned |
| AUTH-MIGRATION-07 | Phase 9 | Planned |
| AUTH-MIGRATION-08 | Phase 9 | Planned |

**Coverage:** 12/12 v1 requirements mapped ✓ (+ 8 auth migration requirements)

---

*Roadmap created: 2026-03-23*
*Phase 1 executed: 2026-03-25*
*Phase 2 planned: 2026-03-25*
*Phase 3 planned: 2026-03-25*
*Phase 4 planned: 2026-03-25*
*Phase 4 executed: 2026-03-25*
*Phase 5 planned: 2026-03-26*
*Gap closure phases added: 2026-03-26 (Phases 6-8)*
*Phase 8 planned: 2026-03-26*
*Phase 9 planned: 2026-03-28*
