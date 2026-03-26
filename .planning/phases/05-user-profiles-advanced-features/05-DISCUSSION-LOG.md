# Phase 5: User Profiles & Advanced Features - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 05-user-profiles-advanced-features
**Areas discussed:** profile aggregation model, profile teams list behavior, ranking period filters, temporal boundary semantics, dedicated H2H route

---

## Profile Aggregation Model

| Option | Description | Selected |
|--------|-------------|----------|
| Derived stats from match history (Recommended) | Compute wins/losses/win rate/total from existing matches + memberships | ✓ |
| Persist aggregate counters | Store profile totals directly in DB and update on writes | |
| Hybrid derived + cached snapshots | Compute with partial caching for faster reads | |

**User's choice:** [auto] Derived stats from match history.
**Notes:** Keeps single source of truth and aligns with project constraint to avoid persisted aggregate counters.

---

## Profile Team List Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| List user teams with per-team W/L + win rate + total (Recommended) | Reuse ranking-style metrics grouped by the user's memberships | ✓ |
| Show only team names | Keep profile minimal with no per-team metrics | |
| Collapse teams into one global metric card | No per-team drilldown | |

**User's choice:** [auto] Show team list with per-team metrics.
**Notes:** Satisfies PROF-01 while preserving clarity.

---

## Ranking Period Filter Contract

| Option | Description | Selected |
|--------|-------------|----------|
| `all`, `month`, `week` (Recommended) | Add period filter alongside current type filter | ✓ |
| Only `all` + `month` | Reduced scope in v1 | |
| Custom date range selector | Flexible but higher complexity | |

**User's choice:** [auto] `all` / `month` / `week`.
**Notes:** Direct mapping to RANK-05 requirement.

---

## Time Boundary Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Server/app timezone boundaries (Recommended) | Use app runtime clock for week/month windows | ✓ |
| User-configurable timezone in profile | Per-user local boundary semantics | |
| UTC-only boundaries | Deterministic but less intuitive for office users | |

**User's choice:** [auto] Server/app timezone boundaries.
**Notes:** Avoids adding profile timezone config in this phase.

---

## Head-to-Head Dedicated Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Add `/head-to-head?teamA=&teamB=` route (Recommended) | Dedicated compare page, deep-link friendly | ✓ |
| Keep only embedded section in `/times/[id]` | No dedicated route in v1 | |
| Modal launched from team detail | Extra UI state complexity | |

**User's choice:** [auto] Dedicated route + keep existing embedded H2H section.
**Notes:** Dedicated route is complementary, not a replacement for team detail H2H.

---

## the agent's Discretion

- Final UI control style for period filter, following established design tokens.
- Empty/loading states in profile and H2H dedicated page.

## Deferred Ideas

- Custom date range filtering.
- Per-user timezone preference.
- Advanced player analytics timeline.
