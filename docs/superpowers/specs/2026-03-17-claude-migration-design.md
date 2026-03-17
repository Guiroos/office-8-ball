# Design: Migrate from AGENTS.md (Codex) to Claude Code

**Date:** 2026-03-17
**Status:** Approved

## Goal

Replace Codex-oriented `AGENTS.md` as the primary agent instruction source with a Claude Code–native setup: a lean `CLAUDE.md` at the repo root backed by auto-loaded `.claude/rules/` files.

## Motivation

- `AGENTS.md` was the authoritative guide for Codex. The project now uses Claude Code exclusively.
- The current `CLAUDE.md` (root) delegates to `AGENTS.md`, making Claude a second-class consumer.
- A rules-based split keeps the root file under 80 lines while preserving domain context that agents need.

## File Structure

```
CLAUDE.md                        # New root file — core context (~70 lines), loaded every session
AGENTS.md                        # Deleted
.claude/
  CLAUDE.md                      # Deleted — was a duplicate of the old root CLAUDE.md
  settings.json                  # No change
  settings.local.json            # No change
  rules/
    domain.md                    # Domain invariants + working rules + runtime behavior
    safe-change.md               # Safe-change checklist + task routing + validation commands + known gaps
```

**CLAUDE.md location:** The authoritative file is `CLAUDE.md` at the repo root. The existing `.claude/CLAUDE.md` (which only delegated to `AGENTS.md`) is deleted. Going forward, only the root `CLAUDE.md` is maintained.

## Content Map

### CLAUDE.md (root, ~70 lines)

Only what is useful in every session:

- **What this is** — one-paragraph product description
- **Source of truth priority** — code in `src/` and `prisma/` > `README.md` and `techspec/` > `PRD.md`; note that `techspec/` is the home for technical docs, `techspec/github-operations.md` for CI/repo ops, `techspec/git-conventions.md` for release/deploy
- **Commands** — dev, test, quality, database scripts
- **Architecture** — stack, route structure summary, persistence abstraction, auth, middleware
- **Environment Variables** — required and optional
- **Testing** — test tooling and how to run

### .claude/rules/domain.md

Domain context always available when Claude touches business logic:

- **Domain Invariants** — only `frontend` and `backend` are valid team ids; scoreboard always derived from match history; `leaderTeamId` is null on ties; `leadBy` is absolute win difference; `currentStreak` is newest consecutive wins by latest winner
- **Team behavior file list** — when touching team behavior, review all of: `src/lib/constants.ts`, `src/lib/types.ts`, `src/lib/data.ts`, `src/app/api/matches/route.ts`, `prisma/seed.mjs`, `prisma/schema.prisma`
- **Working Rules** — prefer small changes; match UX intent (scoreboard fast, copy playful, auth credentials-only, green billiards theme); precision on persistence (verify both modes when changing `data.ts`); keep docs honest (update `AGENTS.md` → update `.claude/rules/` files and `techspec/` for architecture changes, `README.md` for setup/runtime changes)
- **Runtime Behavior** — persistence mode switching (`DATABASE_URL` present = Prisma, absent = in-memory); match creation validation rules; UI data flow (fetch scoreboard + matches, re-fetch after win, no optimistic updates)

### .claude/rules/safe-change.md

Validation and routing reference, always loaded:

- **Safe Change Checklist** — 7 questions to verify before finishing (both persistence modes, scoreboard derived, team ids, routing, API shape, auth model, docs)
- **Task Routing Guide** — which files to read per area: GitHub/CI ops, scoreboard/match-history, dashboard UI, login/auth, persistence/schema
- **Validation Expectations** — common commands (`npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`, `npm run e2e`) plus targeted per-file test commands (e.g. `npm run test -- src/lib/data.test.ts`)
- **Known Gaps** — no password recovery, no email verification, no profile/nickname UI, no Prisma-backed integration tests, no E2E for auth rate limit

## Approach Rationale

- **Rules files over a giant CLAUDE.md** — `.claude/rules/*.md` are auto-loaded with the same priority as CLAUDE.md but kept in focused files, easier to update individually.
- **No new custom skills** — the project is small enough that skills add more overhead than value for this routing guide. If the project grows significantly, task routing could move to a skill.
- **No hooks changes** — existing hooks in `settings.local.json` already cover notification and status line. No new automation is needed for this migration.

## Out of Scope

- Changes to application code
- Changes to `settings.json` or `settings.local.json`
- New skills or slash commands
- Documentation in `techspec/` or `README.md`
