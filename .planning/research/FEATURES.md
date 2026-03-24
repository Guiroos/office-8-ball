# Feature Research: Office Billiards Tracker

**Domain:** Office sports/billiards league tracker with team rankings and statistics

**Researched:** 2026-03-23

**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Live Scoreboard/Leaderboard** | Every office sports app starts here — users open the app expecting to see who's winning right now | MEDIUM | Must show team ranking by W/L, sorted descending by wins. Auto-updates when new matches posted. This is the hero feature. |
| **Match Result Recording** | Core interaction loop: play game → register score → see ranking update. Without this, data is stale | LOW | Simple form: select winner, optionally select loser, optional note. Must be fast (< 3 clicks from login) |
| **Team Management (Create/View)** | Users need to create teams they belong to and see their team's record | MEDIUM | Support both `solo` (1v1) and `duo` (2v2+) team types. Each user can create/join multiple teams. Show W/L, win%, current streak per team. |
| **Basic Statistics Display** | Users want to know: W/L record, win%, current streak, total matches played | LOW | These stats derive from match history, not stored separately. Current minimum: wins, losses, win rate %, current streak. |
| **Match History** | Users expect to see past results — who won which games, when | LOW | Simple list or table: date, winner, loser, optional note. Needed for transparency and dispute resolution. |
| **Persistent Authentication** | Users expect to stay logged in across sessions; losing login is bad UX | LOW | JWT sessions via Auth.js v4 (already implemented). Session persistence is table stakes. |
| **Mobile-Accessible UI** | Offices have mobile + desktop users; app must work on both | MEDIUM | Responsive design (Tailwind CSS is foundation). Not a separate mobile app yet, but web must work on phones. |
| **Real-Time Ranking Updates** | When someone records a match, leaderboard changes instantly for other users | MEDIUM | No WebSockets needed at office scale, but dashboard should refetch on mount and allow manual refresh. Polling or React Query acceptable. |

---

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Head-to-Head Matchup History** | "How do we compare?" — Users want to see historical record vs specific teams. Builds narrative (rivalry, dominance, revenge angle). | MEDIUM | Given teams A and B, show: total H2H record (e.g., "Frontend 7-3 Backend"), last 5 matchups, win streak in H2H. Foundation: filter matches by both team_a_id AND team_b_id. |
| **Multi-Team Type Support (Solo + Duo)** | Most office trackers only support teams. Allowing both solo (1v1) and duo (2v2) ranked play expands use cases — billiards works both ways. | MEDIUM | Schema already supports `Team.type: "solo" \| "duo"`. UI must handle both: solo teams are 1-player, duo teams are 2+ players. Leaderboard aggregates both types together. |
| **Customizable Team Names & Branding** | Teams feel owned when they can name themselves and optionally add color/emoji/logo. Drives engagement. | LOW | Allow team name (unique per org if multi-org later; unique globally for now). Optional: team description, emoji, or color tag for visual distinction. |
| **Streak Tracking (Win/Loss Streaks)** | Emphasizes momentum and drama ("On a 5-game winning streak!"). Simple but addictive. | LOW | Track current streak direction (win or loss), count, highlight visually on leaderboard. Calculated from match history. |
| **Individual Player Profiles** | Users want to see their own stats and optionally browse teammates' individual performance. Personalization drives retention. | MEDIUM | Profile shows: user email, teams they belong to, personal stats (total matches, win% across all teams), joined date. Optional: bio, avatar (already in schema). |
| **Weekly/Monthly Leaderboard Views** | All-time leaderboards are stable and stale; weekly views show "who's hot right now." Drives repeated engagement. | MEDIUM | Add time-filter toggles: All-Time, This Month, This Week. Recalculates W/L and streaks for the period. Requires tracking `played_at` timestamp (already in schema). |
| **Win Rate Percentage** | Simple but impactful: "70% win rate" is more meaningful than "7 wins." Helps compare teams with different match counts. | LOW | Calculate: (wins / total_matches) * 100. Display on leaderboard and team detail pages. |
| **Team Roster View** | Users want to see who plays together. Builds team identity. | LOW | For duo teams, list member names. For solo teams, show the single player. Simple display in team detail page. |
| **Match Notes/Comments** | "Revenge match after last week's loss" or "Beat them at their best." Context drives engagement. | LOW | Optional 140-char note on match record. Optional: show on match history and leaderboard (as tooltip or detail). Already in schema (`noteText`). |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **ELO / Dynamic Rating System** | "More competitive than W/L, like chess." Seems sophisticated. | Adds complexity (math, tuning parameters, rating decay) without value at office scale. W/L is transparent and fair. ELO confuses casual users. | Stick with W/L for v1. If demand emerges (after 1000s of matches), revisit. For now, simpler is better. |
| **Real-Time WebSocket Updates** | "Leaderboard updates as you watch!" Seems cool. | Requires infrastructure (Socket.io, Redis, pub/sub), complex debugging, doesn't add value at office scale (max 100 concurrent users). | HTTP polling or manual refresh. Dashboard refetches on mount and allows user-triggered refresh button. Good enough. |
| **Notifications / Push Alerts** | "Get notified when team is mentioned!" | Noise and distraction; office sports is async. Pushes create friction. Users check leaderboard on their own schedule. | Skip for v1. If users ask, add optional in-app activity feed (no push). |
| **Mobile App (Native)** | "Easy to access from pocket." | High dev cost (iOS + Android), maintenance burden. Responsive web works fine on phones. | Build responsive web-first. If usage data shows mobile is critical, revisit. Current focus: web. |
| **Tournaments / Brackets** | "Office championship feels official!" | Adds UI/UX complexity (scheduling, eliminations, fairness). Continuous league is simpler and keeps everyone engaged longer. | Out of scope per PROJECT.md. Keep focus on continuous ranking, not ephemeral tournaments. |
| **Global / Multi-Organization Leaderboards** | "Compare our office to other offices!" | Breaks schema assumptions (team names must be unique; constants assume 2 teams). Adds tenant isolation complexity. | Keep single-org for v1. If expanding to multi-org, requires schema redesign. |
| **Admin Panel / Moderation Tools** | "Delete false records, manage teams." | Adds complexity; context is trust (colleagues, not strangers). If needed, manual DB edits are acceptable at office scale. | Skip for v1. Trust model assumes honest players. If fraud emerges, handle case-by-case. |
| **Player Handicaps / Skill Levels** | "Fair matching for beginners vs pros." | Adds complexity (defining tiers, enforcing fairness, maintenance). Casual play doesn't need it. | Skip for v1. Natural selection happens: better teams rank higher. Beginners can form their own teams. |
| **AI Predictions / "Likely Winner"** | "Machine learning magic!" | Meaningless at low data volume (hundreds of matches). Not trusted by users. Adds infrastructure. | Skip entirely. Focus on facts (history, stats). |

---

## Feature Dependencies

```
Authentication & Persistence (Foundation)
    └──requires──> Team Management
                       └──requires──> Match Recording
                                         └──requires──> Leaderboard Calculation
                                                           ├──enhances──> Win Rate % (stats)
                                                           ├──enhances──> Streak Tracking (stats)
                                                           └──enhances──> Match History (audit trail)

Leaderboard Calculation
    ├──enables──> Head-to-Head View (filtered leaderboard)
    ├──enables──> Time-Based Views (weekly/monthly filters)
    ├──enables──> Team Detail Page (team + roster + H2H)
    └──enables──> Individual Profiles (personal stats)

Team Management
    ├──supports──> Solo Team Type (1v1)
    ├──supports──> Duo Team Type (2v2+)
    └──conflict with──> Multi-Org Support (if added, requires schema redesign)

Match Recording
    └──requires──> User Authentication (must know who's recording)
```

### Dependency Notes

- **Authentication & Team Management require Persistence:** Without a database, you can't create teams or track users. Both modes (DB + in-memory) must support this.
- **Match Recording requires Team Management:** Users can only record a match if teams exist and they belong to one.
- **Leaderboard requires Match History:** Scoreboard is derived from all matches; can't skip any or it's silently wrong.
- **Head-to-Head requires Leaderboard:** H2H is a filtered view of the leaderboard (two teams only).
- **Time-Based Views require `played_at` timestamp:** Weekly/monthly views need reliable date data. Already in schema.
- **Solo vs Duo types can coexist:** Same Team model, different `type` field. No conflict; both rank in same leaderboard.
- **Multi-Org would conflict with current schema:** Team names are assumed unique globally; team IDs are hardcoded in constants. Generalizing breaks assumptions. Defer to v2 if needed.

---

## MVP Definition

### Launch With (v1)

**Minimum viable product — what's needed to validate the concept.**

- [x] **Authentication (Login/Signup)** — Users log in with email/password; session persists. (Already implemented)
- [x] **Dynamic Team Management** — Users create teams (solo or duo type); list and archive teams. (Partially implemented)
- [ ] **Match Recording** — Registered user records match result (select winner/loser, optional note). Must be simple.
- [ ] **Leaderboard (Ranking Page)** — Primary feature: all teams sorted by wins, showing W/L, win%, streak, match count.
- [ ] **Team Detail Page** — View individual team: roster, stats, recent matches, H2H records vs rivals.
- [ ] **Dashboard Integrations** — Dashboard fetches teams dynamically (not hardcoded `frontend`/`backend`). Scoreboard API reimplemented for dynamic teams.

**Why essential:** These form the core loop: log in → see ranking → record match → ranking updates. Without any one, product is incomplete.

### Add After Validation (v1.x)

**Features to add once core is working and users engage.**

- [ ] **Weekly/Monthly Leaderboard Views** — Users ask: "Who's hot this month?" Add time filters once all-time view is stable.
- [ ] **Head-to-Head History** — "How do we compare?" Once teams stabilize, show H2H records between rivals.
- [ ] **Individual Player Profiles** — Personal stats, team memberships, joined date. Once teams mature.
- [ ] **Match Notes Visibility** — Display optional notes on match records (already stored). Low-hanging fruit for context.
- [ ] **Team Customization** — Allow teams to set emoji/description/color for visual branding. Drives ownership.

**Triggers for adding:** Users ask for them, or usage data shows they'd add value.

### Future Consideration (v2+)

**Features to defer until product-market fit is established.**

- [ ] **Tournaments / Brackets** — Out of scope per PROJECT.md. Explicit non-goal for v1.
- [ ] **Multi-Organization / Multi-League** — Would require schema redesign. Defer until scale demands it.
- [ ] **ELO / Advanced Rating** — Keep W/L simple for v1. Only revisit if users demand fairness matching.
- [ ] **Mobile Native App** — Responsive web works for now. Only build iOS/Android if mobile is critical to usage.
- [ ] **Notifications / Alerts** — Office context doesn't need push. In-app activity feed (optional) comes first if needed.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Notes |
|---------|------------|---------------------|----------|-------|
| **Dynamic Leaderboard** | HIGH | MEDIUM | P1 | Core product; all other features feed into this. |
| **Match Recording** | HIGH | LOW | P1 | Simple form, but essential interaction loop. |
| **Dynamic Team Management** | HIGH | MEDIUM | P1 | Partially done; must finish for teams to work. |
| **Team Detail Page** | HIGH | MEDIUM | P1 | Shows team stats and roster; users expect this. |
| **Win Rate %** | MEDIUM | LOW | P1 | Simple calculation; expected on leaderboard. |
| **Streak Tracking** | MEDIUM | LOW | P1 | Adds narrative; simple to implement. |
| **Match History** | MEDIUM | LOW | P1 | Audit trail and transparency; simple list view. |
| **Individual Profiles** | MEDIUM | MEDIUM | P2 | Useful but not blocking launch. Add after teams stable. |
| **Time-Based Leaderboards** | MEDIUM | MEDIUM | P2 | Nice-to-have; adds engagement. Defer to v1.x. |
| **Head-to-Head** | MEDIUM | MEDIUM | P2 | Differentiator; build after core is solid. |
| **Team Customization** | LOW | LOW | P2 | Polish; builds team identity. Not critical. |
| **Match Notes** | LOW | LOW | P2 | Already stored; low-cost to expose. |
| **Mobile Native** | LOW | HIGH | P3 | Responsive web sufficient for now. |
| **ELO Rating** | LOW | HIGH | P3 | Complexity without value at office scale. Defer. |
| **Tournaments** | LOW | HIGH | P3 | Out of scope; explicit non-goal. |

**Priority key:**
- **P1:** Must have for launch. Core features that validate the concept.
- **P2:** Should have; add in v1.x as time allows. Differentiators and polish.
- **P3:** Nice to have; future consideration. Complexity without clear value.

---

## Competitor Feature Analysis

Based on research of office sports trackers, billiards software, and general leaderboard patterns:

| Feature | League Management Software (e.g., PlayPass, RackEmApp) | Office Tracker Apps (e.g., Leaderboard for Slack) | Our Approach (Office Sinuca) |
|---------|---------|---------|---------|
| **Leaderboard** | Yes; team standings by wins | Yes; live scoring | Yes; core feature, dynamic teams |
| **Match Recording** | Yes; full match details, scheduling | Yes; simple score entry | Yes; simple form (winner/loser/note) |
| **Team Management** | Yes; registrations, fees, rosters | Limited; participants | Yes; duo + solo team types |
| **Scheduling** | Yes; round-robin, tournaments | Limited | No; office billiards is ad-hoc |
| **Statistics** | Extensive; per-player stats, handicaps | Basic; total wins/losses | Medium; team stats + H2H |
| **Payments** | Yes; integration required | No | No; internal office use |
| **Admin Panel** | Yes; extensive controls | Limited | No; trust model |
| **Mobile** | Often mobile-first | Often mobile-first | Web-responsive; mobile-friendly |
| **Real-Time Updates** | Partial; refresh needed | Yes; WebSocket or polling | Yes; polling acceptable |
| **Time Periods** | Season-based | All-time + custom | All-time + weekly/monthly |

**Our Approach:**
- Simpler than full league software (no payments, scheduling, handicaps).
- Richer than basic Slack trackers (supports team types, team detail pages, H2H).
- Focused on continuous ranking (not tournaments).
- Office-context: trust assumed, no admin complexity.

---

## Feature Rollout Timeline

**Phase 1 (Current — Complete Core):**
- Finish dynamic team management (GET `/api/teams/:id`, etc.)
- Implement leaderboard ranking page
- Implement team detail page
- Reactivate `/api/scoreboard` for dynamic teams
- Match recording integration with dynamic teams

**Phase 2 (After Core is Stable):**
- Time-based leaderboard views (weekly, monthly)
- Head-to-head history
- Individual player profiles
- Team customization (emoji, description)

**Phase 3 (Long-term Polish):**
- Advanced statistics (charts, trends)
- Activity feed / notifications (optional)
- Mobile native app (if demand justifies)

---

## Sources

### League Management & Billiards Software
- [PlayPass: Pool Billiards Club & League Management Software](https://playpass.com/sports-software/pool-management)
- [RackEmApp: League and Competition Management Software](https://www.rackemapp.com/)
- [Sport Scheduler Pro: Pool League Management](https://sportschedulerpro.com/pool-league-management-software)
- [CompuSport: Tournament and League Management](https://compusport.ca/)

### Office Sports Tracker Apps
- [Leaderboard: Slack app for office games](https://leaderboardapp.com/)
- [Capterra: Best Sports League Software 2026](https://www.capterra.com/sports-league-software/)
- [SoftwareAdvice: Best Sports League Management](https://www.softwareadvice.com/sports-league-management/)

### Leaderboard Design Patterns & UX
- [UI Patterns: Leaderboard Design](https://ui-patterns.com/patterns/leaderboard)
- [IxDF: Leaderboards in Interaction Design](https://www.interaction-design.org/literature/article/increase-competitiveness-in-users-with-leader-boards)
- [UXDesign: Building Better Leaderboards](https://uxdesign.cc/building-better-leaderboards-a5013d19cbd7)
- [Best Practices for Designing Leaderboards](https://www.sportfitnessapps.com/blog/best-practices-for-designing-leaderboards)

### Statistics & Ranking Systems
- [Stathead: Team and Player Streak Finder](https://stathead.com/)
- [TeamRankings.com: Sports Predictions and Rankings](https://www.teamrankings.com/)
- [SportMember: Stat Tracker for Teams](https://www.sportmember.com/en/stat-tracker)
- [Head-to-Head Comparison Tools](https://www.sports-reference.com/)

### Dashboard Design Best Practices
- [Pencil & Paper: Dashboard UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [UXPin: Dashboard Design Principles for 2025](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Justinmind: Dashboard Design Best Practices](https://www.justinmind.com/ui-design/dashboard-design-best-practices-ux)

---

*Feature research for: Office Billiards/Sinuca Tracker (team-based leaderboard)*

*Researched: 2026-03-23*
