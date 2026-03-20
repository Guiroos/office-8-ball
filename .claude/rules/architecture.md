---
# No path scope — these constraints apply to the entire codebase.
---

# Architecture

## Constraints

These rules apply for v1 and must not be broken without an explicit product or architecture decision:

- Do not introduce a separate backend service. **Why:** Adds operational complexity and a network boundary for no user benefit at this scale.
- Do not generalize to multi-team or multi-league. **Why:** The two-team model is load-bearing — constants, seed, and UI all assume exactly two teams.
- Do not persist aggregated scoreboard counters — scoreboard is always derived from `matches`. **Why:** Stored counters can diverge from match history; derivation is the single source of truth.
- Do not treat the database `teams` table as the sole source of truth; teams are mirrored in `src/lib/constants.ts` and seeded into the DB. **Why:** In-memory mode has no DB; constants must always be authoritative.
- Do not break the in-memory fallback without explicit approval. **Why:** It is the local dev path and the test harness for all unit/route tests.
- Do not document the in-memory fallback as if it re-opens the authenticated flow; it is restricted to domain use and local development only.
- Any change to team ids or team shape requires updating code, schema, and seed together. **Why:** Divergence between constants and seed causes silent failures in both modes.

## CI / Deploy Changes

When touching GitHub Actions, release flow, or Vercel config, read `techspec/github-operations.md` and `techspec/git-conventions.md` before editing. Constraint: keep Vercel as deployment platform; GitHub is for validation only.

## Layer Map

| Layer | Location |
|-------|----------|
| UI — login | `src/components/login/*` |
| UI — dashboard | `src/components/dashboard/*` |
| UI — authenticated shell | `src/components/authenticated/*` |
| UI — theme | `src/components/theme/*` |
| UI — primitives | `src/components/ui/*` |
| UI — domain primitives | `src/components/primitives/*` |
| Domain & rules | `src/lib/constants.ts`, `src/lib/types.ts`, `src/lib/data.ts` |
| Auth | `src/lib/auth.ts`, `src/lib/auth-validation.ts`, `src/lib/auth-rate-limit.ts` |
| Middleware | `middleware.ts` |
| Persistence | `prisma/schema.prisma`, `prisma/seed.mjs`, `src/lib/prisma.ts` |
