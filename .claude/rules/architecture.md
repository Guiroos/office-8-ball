---
# No path scope — these constraints apply to the entire codebase.
---

# Architecture

## Constraints

These rules apply for v1 and must not be broken without an explicit product or architecture decision:

- Do not introduce a separate backend service. **Why:** Adds operational complexity and a network boundary for no user benefit at this scale.
- Do not persist aggregated scoreboard counters — scoreboard is always derived from `matches`. **Why:** Stored counters can diverge from match history; derivation is the single source of truth.
- Teams are fully dynamic and user-created — no hardcoded team IDs exist. `src/lib/constants.ts` is intentionally empty; `src/lib/teams.ts` is the domain layer for team operations.
- Any schema change to the `Team` or `TeamMember` models requires updating `src/lib/teams.ts`, the relevant API routes, and `prisma/seed.mjs` together. **Why:** Divergence between domain layer and schema causes silent failures.
- `DATABASE_URL` is required for all runtime functionality. Routes return 503 via `getAuthUnavailableResponse()` when the database is absent. Unit tests mock auth and let the data layer return empty responses — there is no in-memory data fallback.

## CI / Deploy Changes

When touching GitHub Actions, release flow, or Vercel config, read `techspec/github-operations.md` and `techspec/git-conventions.md` before editing. Constraint: keep Vercel as deployment platform; GitHub is for validation only.

## Layer Map

| Layer | Location |
|-------|----------|
| UI — login | `src/components/login/*` |
| UI — dashboard | `src/components/dashboard/*` |
| UI — teams | `src/components/teams/*` |
| UI — ranking | `src/components/ranking/*` |
| UI — profile | `src/components/profile/*` |
| UI — head-to-head | `src/components/head-to-head/*` |
| UI — authenticated shell | `src/components/authenticated/*` |
| UI — theme | `src/components/theme/*` |
| UI — primitives | `src/components/ui/*` |
| UI — domain primitives | `src/components/primitives/*` |
| Domain — core | `src/lib/types.ts`, `src/lib/data.ts` |
| Domain — teams | `src/lib/teams.ts`, `src/lib/team-details.ts` |
| Domain — stats | `src/lib/stats.ts`, `src/lib/ranking.ts`, `src/lib/profile-stats.ts`, `src/lib/head-to-head.ts` |
| Domain — utils | `src/lib/time-period.ts` |
| Auth | `src/lib/auth.ts`, `src/lib/auth-validation.ts`, `src/lib/auth-rate-limit.ts` |
| Middleware | `middleware.ts` |
| Persistence | `prisma/schema.prisma`, `prisma/seed.mjs`, `src/lib/prisma.ts` |
