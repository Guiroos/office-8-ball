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

## HTTP Status Codes

Do not change these without also updating client-side error handling:

| Status | Meaning |
|--------|---------|
| 200 | Successful GET |
| 201 | Successful POST (creation) |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Forbidden (not a team member) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Business rule violation |
| 429 | Rate limited |
| 500 | Internal server error |
| 503 | Auth/DB unavailable |
