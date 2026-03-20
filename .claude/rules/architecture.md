# Architecture

## Constraints

These rules apply for v1 and must not be broken without an explicit product or architecture decision:

- Do not introduce a separate backend service
- Do not generalize to multi-team or multi-league
- Do not persist aggregated scoreboard counters — scoreboard is always derived from `matches`
- Do not treat the database `teams` table as the sole source of truth; teams are mirrored in `src/lib/constants.ts` and seeded into the DB
- Do not break the in-memory fallback without explicit approval
- Do not document the in-memory fallback as if it re-opens the authenticated flow; it is restricted to domain use and local development only
- Any change to team ids or team shape requires updating code, schema, and seed together

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

