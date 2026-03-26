# Phase 5: User Profiles & Advanced Features - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 05-user-profiles-advanced-features
**Areas discussed:** Profile data architecture, Profile aggregation semantics, Ranking period semantics, Dedicated H2H route contract

---

## Profile data architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Server-assembled profile payload | RSC/domain assembler consolidates user + aggregates + teams | ✓ |
| API-assembled on `/api/profile` | Enrich API response with gameplay aggregates | |
| Client-assembled from multiple endpoints | Aggregate in browser from profile/matches/teams | |

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `/api/profile` narrow | Editable profile only, no gameplay aggregates | ✓ |
| Return gameplay aggregates on `/api/profile` | Unified API response for page data | |

| Option | Description | Selected |
|--------|-------------|----------|
| Server-first route states | RSC rendering with route-level empty/error | ✓ |
| Client-side loading flow | Fetch on mount with loading skeleton | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated domain module | New `profile-stats`-style module | ✓ |
| Reuse `team-details.ts` | Add profile aggregation there | |
| Inline in page | Aggregate directly inside `/profile/page.tsx` | |

**User's choices:** 1, 1, 1, 1
**Notes:** Explicit preference for server-side consolidation and cleaner separation of account API vs gameplay stats.

---

## Profile aggregation semantics

| Option | Description | Selected |
|--------|-------------|----------|
| At least one team membership | Match counts if user belongs to either side | ✓ |
| Winner team only | Count only wins-side participation | |
| Both teams | Count only if user belongs to both teams | |

| Option | Description | Selected |
|--------|-------------|----------|
| Current-membership snapshot | No historical membership windows | ✓ |
| Membership window accurate in time | Requires historical membership tracking | |

| Option | Description | Selected |
|--------|-------------|----------|
| Include archived-team matches | Archive affects visibility, not history | ✓ |
| Exclude archived-team matches | Ignore archived-team participation | |

| Option | Description | Selected |
|--------|-------------|----------|
| Count once per match record | Prevent double-count in edge case | ✓ |
| Count twice | Once per side/team | |

**User's choices:** 1, 1, 1, 1
**Notes:** Clear preference for v1-simple semantics without introducing historical membership infrastructure.

---

## Ranking period semantics

| Option | Description | Selected |
|--------|-------------|----------|
| ISO week | Monday-Sunday boundaries | ✓ |
| Rolling 7 days | Relative to now | |
| Sunday-start week | Calendar week with Sunday anchor | |

| Option | Description | Selected |
|--------|-------------|----------|
| Calendar month | Month boundaries by calendar | ✓ |
| Rolling 30 days | Relative to now | |

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve `type` + `period` together | Keep both filters in URL interactions | ✓ |
| Reset opposite filter | Changing one resets the other | |

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit empty state | Keep selected period/type, show no-data state | ✓ |
| Fallback to all-time | Auto-switch with notice | |

**User's choices:** 1, 1, 1, 1
**Notes:** User explicitly set timezone anchor to Brazil UTC-3 (`America/Sao_Paulo`) for week/month semantics.

---

## Dedicated H2H route contract

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-select valid default pair | Missing params recover to first valid pair | ✓ |
| Manual empty selectors | Require user selection first | |
| Redirect away | Send user to `/times` | |

| Option | Description | Selected |
|--------|-------------|----------|
| In-page validation + fallback | Invalid params show message and recover | ✓ |
| Hard 404 | Not found response | |
| Redirect to clean route | Strip params and retry | |

| Option | Description | Selected |
|--------|-------------|----------|
| Two explicit selectors | Team A + Team B with same-team prevention | ✓ |
| Single selector + auto rival | Derived opponent | |
| Reuse local rival selector | Match `/times/[id]` section UX | |

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate URL sync | Update `teamA`/`teamB` on change without full reload | ✓ |
| Local state + Apply | Commit params only after explicit action | |

**User's choices:** 1, 1, 1, 1
**Notes:** Deep-link/share behavior is a must-have for dedicated H2H route.

## the agent's Discretion

- Visual micro-decisions for control styling (within current design system).
- Final PT-BR copy for empty/validation helper text.

## Deferred Ideas

- Custom date ranges in ranking.
- User-configurable timezone.
- Advanced player analytics timeline.
