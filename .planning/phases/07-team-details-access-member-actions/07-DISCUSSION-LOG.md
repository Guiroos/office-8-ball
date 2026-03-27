# Phase 7: Team Details Access & Member Actions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 07-team-details-access-member-actions
**Areas discussed:** Access-denied behavior, Invite flow, Remove-member interaction, Runtime update feedback

---

## Access-denied behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit deny state | Explicit access-denied page/state with a clear message and a path back to `/times` | ✓ |
| Generic unavailable state | Generic unavailable/not-found style state that hides whether the team exists | |
| Redirect to `/times` | Redirect straight back to `/times` with a toast | |

**User's choice:** Explicit deny state
**Notes:** UI should be explicit and predictable for non-members, while backend authorization keeps the existing membership-first protection.

---

## Invite flow

| Option | Description | Selected |
|--------|-------------|----------|
| Username dialog | Simple username-based dialog: type `@username` or username, validate via `/api/users`, then add | ✓ |
| Inline invite form | Inline invite form embedded in the members section | |
| Separate manage screen | Two-step flow on a separate manage screen | |

**User's choice:** Username dialog
**Notes:** Keep invite flow lightweight and inside the team detail page.

---

## Remove-member interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Inline remove + confirmation | Inline `Remover` action on each removable member, with confirmation before delete | ✓ |
| Secondary menu | Secondary menu per member, then confirmation | |
| Separate edit mode | Separate edit mode for roster changes | |

**User's choice:** Inline remove + confirmation
**Notes:** Roster remains the primary management surface; confirmation is required before delete.

---

## Runtime update feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Toast + refresh in place | Toast feedback + refresh the current team detail state in place | ✓ |
| Full redirect/reload | Full redirect/reload after every change | |
| Optimistic first | Fully optimistic UI first, reconcile later on failure | |

**User's choice:** Toast + refresh in place
**Notes:** Follow the existing client-side form pattern used elsewhere in the app.

---

## the agent's Discretion

- Final PT-BR copy for deny state, confirmation dialog, and validation messages.
- Exact component composition for deny state and member-action controls.

## Deferred Ideas

- None.
