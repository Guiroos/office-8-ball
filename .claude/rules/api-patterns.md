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

- Validate request payloads before any mutation: Zod schemas for input shape (auth, team creation); DB lookup via `getTeamById()` for team existence; `isTeamMember()` check for membership. Return HTTP 400 on validation failure, 403 on membership failure, 404 when team not found. Never hardcode team IDs — teams are fully dynamic.
