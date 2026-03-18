---
paths:
  - "src/app/api/**/*.ts"
---

# API Patterns

## Auth Guard

- Call `getAuthenticatedUser()` first in every protected route handler; return `getAuthRequiredResponse()` (401) when null. The register endpoint is the sole exception -- it guards with `isAuthAvailable()` instead.

## Response Typing

- Type every `NextResponse.json<T>()` call with an explicit generic from `src/lib/types.ts`. Shape mismatches break the client-side casts in `use-dashboard-data.ts`.

## Input Validation

- Validate request payloads before any mutation: `isValidTeamId()` for match endpoints, Zod schemas from `auth-validation.ts` for auth endpoints. Return HTTP 400 with `{ error: string }`. Never validate team IDs via database lookup -- `TEAMS` is the source of truth.
