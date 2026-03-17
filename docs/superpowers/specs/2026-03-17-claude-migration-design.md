# Design: Migrate from AGENTS.md (Codex) to Claude Code

**Date:** 2026-03-17
**Status:** Approved

## Goal

Replace Codex-oriented `AGENTS.md` as the primary agent instruction source with a Claude Code–native setup: a lean `CLAUDE.md` backed by auto-loaded `.claude/rules/` files.

## Motivation

- `AGENTS.md` was the authoritative guide for Codex. The project now uses Claude Code exclusively.
- The current `CLAUDE.md` delegates to `AGENTS.md`, making Claude a second-class consumer.
- A rules-based split keeps the root file under 80 lines while preserving domain context that agents need.

## File Structure

```
CLAUDE.md                        # Core context (~70 lines), loaded every session
AGENTS.md                        # Deleted
.claude/
  settings.json                  # No change
  settings.local.json            # No change
  rules/
    domain.md                    # Domain invariants + working rules + runtime behavior
    safe-change.md               # Safe-change checklist + task routing + known gaps
```

## Content Map

### CLAUDE.md

Only what is useful in every session:

- **What this is** — one-paragraph product description
- **Commands** — dev, test, quality, database scripts
- **Architecture** — stack, route structure summary, persistence abstraction, auth, middleware
- **Environment Variables** — required and optional
- **Testing** — test tooling and how to run

### .claude/rules/domain.md

Domain context that should always be available when Claude touches business logic:

- **Domain Invariants** — two valid team ids, scoreboard always derived from matches, leaderTeamId/leadBy/currentStreak semantics
- **Working Rules** — prefer small changes, match UX intent, precision on persistence, keep docs honest
- **Runtime Behavior** — persistence mode switching, match creation rules, UI data flow

### .claude/rules/safe-change.md

Validation and routing reference, always loaded:

- **Safe Change Checklist** — 7 questions to verify before finishing
- **Task Routing Guide** — which files to read per area (scoreboard, dashboard, login, persistence, GitHub)
- **Known Gaps** — missing features agents should not accidentally implement

## Approach Rationale

- **Rules files over a giant CLAUDE.md** — `.claude/rules/*.md` are auto-loaded with the same priority as CLAUDE.md but kept in focused files, easier to update individually.
- **No new custom skills** — the project is small enough that skills add more overhead than value for this routing guide. If the project grows significantly, task routing could move to a skill.
- **No hooks changes** — existing hooks in `settings.local.json` already cover notification and status line. No new automation is needed for this migration.

## Out of Scope

- Changes to application code
- Changes to `settings.json` or `settings.local.json`
- New skills or slash commands
- Documentation in `techspec/` or `README.md`
