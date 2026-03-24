# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Server-driven Next.js 16 (App Router) with client-side React hooks for dashboard state management.

**Key Characteristics:**
- Next.js 16 App Router with route groups for authentication
- Layered architecture: domain layer → API routes → client components
- Session-based auth (Auth.js v4 with JWT) with optional in-memory fallback
- Prisma ORM with PostgreSQL; dual-mode support (database or in-memory for testing)
- Client-side state via React hooks only (no Redux/Zustand)
- All data derivation on-demand — no persisted scoreboard counters

## Layers

**Presentation (UI):**
- Purpose: React components for rendering pages and features
- Location: `src/components/` (organized by feature and primitives)
- Contains: Page components, feature-specific components, UI primitives
- Depends on: Domain types, client-side data hooks, theme system
- Used by: Next.js pages in `src/app/`

**Domain & Business Logic:**
- Purpose: Constants, types, derived data calculations
- Location: `src/lib/constants.ts`, `src/lib/types.ts`, `src/lib/data.ts`
- Contains: Type definitions (TeamRecord, MatchRecord, etc.), data normalization, helper functions
- Depends on: Prisma client
- Used by: API routes, components via custom hooks

**API Layer:**
- Purpose: REST endpoints for authentication, teams, matches, profile
- Location: `src/app/api/*/route.ts` (organized by feature)
- Contains: Request validation (Zod), auth guards, domain function calls, response serialization
- Depends on: Domain functions, auth utilities, Prisma
- Used by: Client components and external integrations

**Authentication & Authorization:**
- Purpose: Credential validation, session management, rate limiting
- Location: `src/lib/auth.ts`, `src/lib/auth-validation.ts`, `src/lib/auth-rate-limit.ts`
- Contains: Auth configuration (NextAuthOptions), user session extraction, password validation, request-based rate limiting
- Depends on: bcryptjs, next-auth, Prisma
- Used by: Middleware, API routes, protected layouts

**Persistence:**
- Purpose: Database schema and client initialization
- Location: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Contains: Prisma Client singleton, database models (User, Team, TeamMember, Match, AuthRateLimit)
- Depends on: PostgreSQL database
- Used by: Domain functions and API routes

**Middleware & Routing:**
- Purpose: Request interception and protected route enforcement
- Location: `middleware.ts` (root)
- Contains: Auth guard middleware that redirects unauthenticated users to `/login`
- Depends on: next-auth/middleware
- Used by: Next.js router

## Data Flow

**Authentication Flow:**
1. User submits login form at `/login`
2. `POST /api/auth/signin` (Auth.js internal) validates credentials via CredentialsProvider
3. CredentialsProvider calls `validateLoginPayload()` and checks rate limit via `AuthRateLimit` table
4. On success, JWT session created; cookie set with `HttpOnly` and `Secure` flags
5. Subsequent requests carry session cookie; `getAuthenticatedUser()` extracts user from JWT token

**Team Creation Flow:**
1. User initiates team creation via UI
2. Client sends `POST /api/teams` with `{ name, secondMemberUserId }`
3. Route handler validates request, checks user exists, creates Team with two TeamMembers
4. Response includes normalized TeamRecord (ISO dates, structured members array)
5. Client-side hook updates local state and refreshes team list

**Match Registration Flow:**
1. User submits match result with `{ teamAId, teamBId, winnerTeamId, note }`
2. Client sends `POST /api/matches`
3. Route handler validates input (teams exist, are active, user is member, winner is valid team)
4. Match record inserted into database
5. Client refetches dashboard data: `GET /api/scoreboard` and `GET /api/matches`
6. Scoreboard state updated with new wins/streaks (computed from match history)

**Dashboard Load Flow:**
1. User navigates to `/dashboard` (protected by middleware)
2. Page component calls `useDashboardData()` hook
3. Hook fetches two endpoints in parallel:
   - `GET /api/scoreboard` → aggregated stats from all user's team matches
   - `GET /api/matches` → recent match history for current user's teams
4. On error, toast notification shown; loading state managed per request
5. On submit, same endpoints refetched to reflect new state

**State Management:**
- Dashboard state (scoreboard, matches) stored in React hook state via `useState`
- All derivations computed fresh from match history on each load
- No Redux/Zustand; no client-side normalized cache
- Scoreboard counters (wins, leadBy, streak) derived from match array, not persisted

## Key Abstractions

**TeamRecord:**
- Purpose: Normalized team with member roster and metadata
- Examples: `src/lib/types.ts` (type definition), `src/lib/teams.ts` (normalization function)
- Pattern: Prisma raw response normalized to ISO dates and snake_case → camelCase

**MatchRecord:**
- Purpose: Normalized match with winner/loser IDs and playedAt timestamp
- Examples: `src/lib/data.ts` (createMatch, listMatches)
- Pattern: Derived loser from teamA/teamB and winnerTeamId; dates converted to ISO

**Zod Schemas:**
- Purpose: Request validation and field-level error reporting
- Examples: `createMatchSchema`, `createTeamSchema` in route handlers
- Pattern: `safeParse()` used; errors returned as 400 with field errors in response

**Rate Limiting:**
- Purpose: Per-action (login/register) throttling based on username + IP
- Examples: `src/lib/auth-rate-limit.ts`
- Pattern: In-memory state stored in AuthRateLimit table; time-window based blocking

## Entry Points

**Web App:**
- Location: `src/app/page.tsx`
- Triggers: Direct visit to `/`
- Responsibilities: Extract authenticated user, redirect to `/dashboard` if logged in, else `/login`

**Dashboard Page:**
- Location: `src/app/(authenticated)/dashboard/page.tsx`
- Triggers: User navigates after login
- Responsibilities: Render scoreboard, teams, recent matches via `useDashboardData()` hook

**Protected Layout:**
- Location: `src/app/(authenticated)/layout.tsx`
- Triggers: Any route under `/(authenticated)/*`
- Responsibilities: Enforce authentication, render AppShell with sidebar and user menu

**API: Authentication:**
- Location: `src/app/api/auth/[...nextauth]/route.ts`
- Triggers: `POST /api/auth/signin`, `POST /api/auth/signout`, etc. (Auth.js internal)
- Responsibilities: Delegate to CredentialsProvider, manage JWT session

**API: Register:**
- Location: `src/app/api/auth/register/route.ts`
- Triggers: `POST /api/auth/register`
- Responsibilities: Validate payload, check rate limit, hash password, create user, return 201

**API: Teams:**
- Location: `src/app/api/teams/route.ts` (GET/POST), `src/app/api/teams/[id]/route.ts` (GET/PATCH/DELETE)
- Triggers: Team CRUD operations
- Responsibilities: List user teams, create team, fetch team details, archive team

**API: Matches:**
- Location: `src/app/api/matches/route.ts`
- Triggers: `GET /api/matches` (recent matches), `POST /api/matches` (register result)
- Responsibilities: Validate team membership, register match, return normalized records

**API: Scoreboard:**
- Location: `src/app/api/scoreboard/route.ts`
- Triggers: `GET /api/scoreboard`
- Responsibilities: Fetch all user's team matches, compute wins/streaks, return aggregated stats

## Error Handling

**Strategy:** Typed error responses with HTTP status codes and user-facing messages.

**Patterns:**
- **401 Unauthorized:** No authenticated session; return `getAuthRequiredResponse()` (error message, status 401)
- **400 Bad Request:** Validation failure; return Zod errors or business logic errors (invalid teams, duplicate names)
- **403 Forbidden:** User not member of team; return permission error
- **404 Not Found:** Resource (team, user) not found
- **409 Conflict:** Duplicate constraint (username, team name already taken); Prisma P2002 caught and mapped to 400 with user message
- **429 Too Many Requests:** Rate limit exceeded (login/register); return retryAfterSeconds
- **503 Service Unavailable:** Database not configured (DATABASE_URL missing); return auth unavailable error
- **500 Internal Server Error:** Unexpected errors propagated; not caught in routes

**Client-side handling:** All API responses typed with `ApiErrorResponse`; errors extracted and shown via `sonner` toast.

## Cross-Cutting Concerns

**Logging:** Not implemented. `console.*` calls not present in production code. Next.js dev logs Prisma warnings in development.

**Validation:**
- Request payloads validated with Zod before mutation
- Auth payload validated with `validateLoginPayload()` and `validateRegisterPayload()`
- Team IDs validated: teams must exist, be active, user must be member

**Authentication:**
- All protected routes call `getAuthenticatedUser()` at handler start
- Middleware enforces authentication for `/dashboard`, `/times`, `/ranking`, `/profile`, `/settings`
- Public routes: `/`, `/login`, `/api/auth/*`, `/api/auth/register`
- Session stored as JWT in HttpOnly cookie; strategy set in `getAuthOptions()`

**Authorization:**
- User can only see own teams and matches
- User must be team member to register a match for that team
- Team archived by creator or admin (not yet implemented)

---

*Architecture analysis: 2026-03-23*
