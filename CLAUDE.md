# CLAUDE.md

Office 8 Ball is a Next.js 16 office billiards tracker. Users create teams (solo or duo), record match results, and track standings via a dynamic ranking. Flow: login → `/dashboard` → register a match winner → scoreboard updates. Teams are fully user-created — no hardcoded team IDs. See `.claude/rules/` for domain invariants, architecture constraints, testing patterns, and safe-change checklist.

## Tech Stack

- Next.js 16.1.6 (App Router) · React 19.2.3 · TypeScript 5
- Prisma 6.19.2 + PostgreSQL · Auth.js v4 (next-auth 4.24.13) — credentials-only, JWT sessions
- Tailwind CSS 4.2.1 · shadcn/ui · class-variance-authority · Zod 4.3.6
- Vitest 4 · @testing-library/react 16 · Playwright

## Common Commands

```bash
# Development
npm run dev           # Start dev server (http://localhost:3000)
npm run build         # Production build
npm run typecheck     # TypeScript strict check

# Testing
npm run test                              # Run all unit/component tests
npm run test:watch                        # Watch mode
npm run test -- src/lib/data.test.ts     # Run a single test file

npm run e2e                               # Playwright E2E tests (real Postgres)
npm run e2e:ui

# Quality
npm run lint

# Database (requires DATABASE_URL)
npm run prisma:migrate    # Run migrations in dev
npm run prisma:deploy     # Deploy migrations to production
npm run prisma:seed       # Seed teams into DB

npm run prisma:generate   # Regenerate Prisma client (runs on postinstall)
```

## Directory Structure

- `src/lib/` — domain layer: `types.ts`, `data.ts`, `teams.ts`, `team-details.ts`, `stats.ts`, `ranking.ts`, `profile-stats.ts`, `head-to-head.ts`, `time-period.ts`; auth: `auth.ts`, `auth-validation.ts`, `auth-rate-limit.ts`; Prisma client: `prisma.ts`
- `src/components/ui/` — shadcn primitives (Button, Card, Input, Badge, etc.)
- `src/components/primitives/` — domain reusables (StatTile, SectionHeader, IconCallout, FormField)
- `src/components/dashboard/` — main scoreboard feature
- `src/components/teams/` — team list, team detail, creation dialog, member management
- `src/components/ranking/` — ranking view, podium, period/type tabs, standings rows
- `src/components/profile/` — profile page and edit dialog
- `src/components/head-to-head/` — head-to-head view
- `src/components/authenticated/` — app shell and sidebar layout
- `src/components/login/` — login/register screen
- `src/components/theme/` — theme provider, toggle, and core system
- `src/app/(authenticated)/` — protected route group
- `techspec/` — architecture and operational docs
- `prisma/` — schema, migrations, seed

## Routes

**Pages**
- `/` — redirects by session state
- `/login` — public; credentials-only login/signup
- `/scoreboard` — legacy redirect to `/dashboard`
- `/(authenticated)/dashboard` — main scoreboard (protected)
- `/(authenticated)/times` — team list + create team
- `/(authenticated)/times/[id]` — team detail (members, matches, H2H)
- `/(authenticated)/ranking` — full team rankings with period/type filters
- `/(authenticated)/head-to-head` — head-to-head comparison between two user teams
- `/(authenticated)/profile` — user profile and stats
- `/(authenticated)/settings` — app settings

**API**
- `/api/auth/register` — POST signup
- `/api/matches` — GET recent matches / POST register result
- `/api/scoreboard` — GET aggregated scoreboard (all matches, no limit)
- `/api/teams` — GET user teams / POST create team
- `/api/teams/[id]` — GET team detail / PATCH / DELETE (archive)
- `/api/teams/[id]/members` — POST invite member
- `/api/teams/[id]/members/[userId]` — DELETE remove member
- `/api/teams/[id]/archive` — POST archive team
- `/api/profile` — GET/PATCH user profile
- `/api/users` — GET user search (for member invite)

## Architecture Decisions

See `.claude/rules/architecture.md`, `domain.md`, and `auth.md` for the full constraint set. Key conventions not covered there:

- Import with `@/` alias — no relative `../` paths.
- Named exports everywhere except Next.js page/layout/route files.
- Dashboard state managed with React hooks only — no client-side state library.
- Use semantic design tokens — no arbitrary Tailwind values.

## Behavior Rules

- Never modify `prisma/schema.prisma` without explicit approval.
- Never install new packages without asking first.
- Never skip tests or bypass git hooks (`--no-verify`).
- Only read files directly relevant to the current task.
- `DATABASE_URL` is required for all runtime functionality. Routes return 503 when absent — do not add new routes that bypass this guard.
- Do not change API status codes (401, 409, 429, 500, 503) without also updating client-side error handling.
- Update `.claude/rules/` or `techspec/` only when behavior actually changed — no preemptive doc edits.

## Testing

- Unit/integration: Vitest + Testing Library (jsdom); E2E: Playwright (real Postgres, CI only).
- Data layer tests: most domain functions (`stats.ts`, `ranking.ts`, `head-to-head.ts`, `time-period.ts`) are pure — pass match arrays directly. For modules that check `hasDatabaseUrl()`, delete `process.env.DATABASE_URL` in `beforeEach`.
- Route tests: mock `@/lib/auth` and stub `getAuthenticatedUser` — never call real Auth.js in unit tests.
- Never import Prisma in test files directly.

See `.claude/rules/testing.md` for the full isolation pattern.

## Environment Variables

```
DATABASE_URL=postgresql://...       # Required for auth and persistence
BETTER_AUTH_SECRET=...              # Required when DATABASE_URL is set
BETTER_AUTH_URL=http://localhost:3000  # Base URL for better-auth
```

## Source of Truth

When sources disagree: `src/` and `prisma/` > `README.md` and `techspec/` > `PRD.md`.

- `techspec/github-operations.md` — CI and repository protection rules
- `techspec/git-conventions.md` — release flow and deploy prerequisites

## Warnings

- `getScoreboard()` must fetch ALL matches with no limit — adding a limit silently produces wrong `wins`, `leadBy`, and `currentStreak`.
- Prisma client is auto-generated on `postinstall` — run `npm run prisma:generate` manually after schema changes.

## Context Engineering (Main Agent Discipline)

For non-trivial tasks (multi-file changes, broad exploration, builds/tests), the main agent is an **orchestrator** — delegate implementation and exploration to sub-agents.

**Main agent role:** Coordinate files, spawn sub-agents, process summaries, communicate with the user.

**Delegate to sub-agents:** Broad codebase exploration, multi-file implementation, running builds/tests, processing large command output. Trivial single-file changes can be done directly.

### Sub-agent Communication Protocol

- Every prompt ends with: "Return a structured summary: [exact fields]"
- Never ask a sub-agent to "return everything"
- Target 10-20 lines of actionable info per result
- Chain sub-agents: pass only relevant fields between them

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Office Sinuca Tracker**

App de rastreamento de partidas de sinuca para o escritório. Colegas criam times (duplas ou solo), registram resultados de partidas e acompanham o ranking geral por vitórias/derrotas. A tela principal é a classificação — quem está no topo agora.

**Core Value:** O ranking de times sempre atualizado — qualquer colega abre o app e vê imediatamente quem está ganhando.

### Constraints

- **Tech stack:** Next.js + Prisma + PostgreSQL — não introduzir serviço backend separado
- **DATABASE_URL obrigatório:** Todas as rotas retornam 503 sem banco — nunca adicionar rota que ignore esse guard
- **Schema:** Nunca modificar `prisma/schema.prisma` sem aprovação explícita — mudanças requerem migration e seed atualizados juntos
- **Auth:** Credenciais apenas (username/senha) — sem OAuth para v1
- **Deploy:** Cloudflare Workers + GitHub Actions; migrations rodadas antes do build no CI
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5 - Application code, all `.ts` and `.tsx` files
- JavaScript ES2017 - Configuration files, migration seeds
- JSX/TSX - React component markup
- CSS - Tailwind-generated styles via PostCSS
- HTML - Server-rendered via Next.js
## Runtime
- Node.js (via Next.js/Cloudflare Workers) - All execution
- Browser (Chrome/Chromium) - E2E testing via Playwright
- npm - Dependency management
- Lockfile: `package-lock.json` (present, committed)
## Frameworks & Core Libraries
- Next.js 16.1.6 - Full-stack framework with App Router
- React 19.2.3 - Component library and hooks
- Tailwind CSS 4.2.1 - Utility-first styling
- shadcn/ui 4.0.8 - Headless component library (Radix UI wrappers)
- class-variance-authority 0.7.1 - Type-safe component variants
- clsx 2.1.1 - Conditional classname merging
- tailwind-merge 3.5.0 - Tailwind class conflict resolution
- next-themes 0.4.6 - Theme provider (light/dark/sepia via localStorage)
- Geist Font (next/font/google) - Default typeface
- Vitest 4.1.0 - Unit and component test runner
- @testing-library/react 16.3.2 - Component testing utilities
- @testing-library/jest-dom 6.9.1 - DOM matchers
- @testing-library/user-event 14.6.1 - User interaction simulation
- jsdom 28.1.0 - DOM implementation for test environment
- Playwright 1.58.2 - Headless browser automation
## Build & Development Tools
- Next.js dev server - Hot reload on file changes
- npm run dev - Localhost:3000
- Next.js build (`next build`) - Static and server-side rendering
- Turbopack - Bundler (default for next dev and next build)
- TypeScript 5 with strict mode
- ESLint 9 - JavaScript linting
- Prettier - Presumed for formatting (not explicitly configured; shadcn installs it)
- Prisma 6.19.2 - ORM and schema management
## Key Dependencies
- next-auth 4.24.13 - Session and credential-based authentication
- bcryptjs 3.0.3 - Password hashing (for credential validation)
- @prisma/client 6.19.2 - Database client for PostgreSQL
- @radix-ui/react-dialog 1.1.15 - Modal/dialog primitives
- @radix-ui/react-scroll-area 1.2.10 - Custom scrollbar
- @radix-ui/react-separator 1.1.8 - Visual divider
- @radix-ui/react-slot 1.2.4 - Slot composition pattern
- lucide-react 0.577.0 - Icon library (SVG icons as React components)
- @base-ui/react 1.3.0 - Base unstyled UI components
- Zod 4.3.6 - Schema validation and TypeScript inference
- sonner 2.0.7 - Toast notifications (presumed from package name)
- tw-animate-css 1.4.0 - Tailwind animation utilities
- dotenv 17.3.1 - Environment variable loading for Prisma config
## Configuration Files
- `tsconfig.json` - Strict mode, ES2017 target, Next.js plugin, path aliases
- `next.config.ts - Security headers (CSP, X-Frame-Options, HSTS in production), remote image patterns
- `prisma/schema.prisma` - PostgreSQL datasource, schema definitions, models (User, Team, TeamMember, Match, AuthRateLimit); migrations at `prisma/migrations`, seed at `prisma/seed.mjs`
- `vitest.config.ts` - jsdom, `@/` path alias, mock for `next/image`, coverage via v8
- `playwright.config.ts` - Chromium only, baseURL from `PLAYWRIGHT_BASE_URL`, test dir `e2e/`, HTML reporter
- `postcss.config.mjs` - Tailwind v4 PostCSS plugin + custom wildcard font-size removal for Turbopack
- `eslint.config.mjs` - ESLint 9 flat config with Next.js defaults
- `package.json` - Scripts for dev, build, test, lint, typecheck, e2e, prisma
## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (Neon Postgres recommended)
- `BETTER_AUTH_SECRET` - better-auth session signing secret (only required when DATABASE_URL is set)
- `BETTER_AUTH_URL` - better-auth base URL (defaults to `http://localhost:3000` in dev)
- `NEXT_PUBLIC_APP_ENV` - Shown in UI; values: "development", "preview", "production"
- `PLAYWRIGHT_BASE_URL` - Test server URL (defaults to `http://127.0.0.1:3000`)
- `CI` - Set by CI runner; triggers single-worker Playwright mode and retries
## Platform Requirements
- Node.js (version managed by project; run `node --version` to verify)
- PostgreSQL (or Neon Postgres account for remote DB)
- Chromium (installed via `npm run e2e:install` for Playwright)
- Cloudflare Workers (primary deployment platform)
- PostgreSQL database (Neon or compatible)
- Node.js runtime environment
- Modern browsers (Chrome/Edge/Firefox/Safari)
- E2E tests only run on Chromium (Desktop Chrome profile)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Language & Tooling
- **TypeScript** strict mode — `tsconfig.json` targets ES2017+, `moduleResolution: bundler`
- **ESLint** via `next/core-web-vitals` + `@typescript-eslint`; run with `npm run lint`
- **Prettier** for formatting (implicit via Next.js toolchain)
- All source files in `src/` use `"use client"` directive only when needed (RSC-first)
## Import Conventions
- **Always** use `@/` path alias — never relative `../` paths
- Named imports for everything except Next.js page/layout/route files
- Group order: external packages → `@/lib/*` → `@/components/*` → local
## Naming
| Artifact | Convention | Example |
|----------|------------|---------|
| Files | `kebab-case` | `dashboard-hero.tsx`, `use-dashboard-data.ts` |
| React components | `PascalCase` | `DashboardHero`, `StatTile` |
| Functions/variables | `camelCase` | `getAuthenticatedUser`, `currentUser` |
| Types/interfaces | `PascalCase` | `TeamRecord`, `MatchRecord`, `SessionUser` |
| Constants | `SCREAMING_SNAKE` | `TEAMS`, `AUTH_RATE_LIMIT_ERROR` |
| Route handlers | Named exports matching HTTP verbs | `export async function GET()` |
| Hooks | `use` prefix | `useDashboardData` |
## Component Patterns
### Styling Rules
- **Semantic design tokens only** — no arbitrary Tailwind values (`[#abc123]`, `[var(--token)]`)
- Shadow pattern: `shadow-sm shadow-{color}/{opacity}` (e.g., `shadow-sm shadow-gold/35`)
- Shadow states: `shadow-sm` rest → `shadow-md` hover → `shadow-xs` active
- Never use `style={{}}` when a token class exists
### Client vs Server Components
- Server components by default (no `"use client"`)
- Add `"use client"` only when using browser APIs, event handlers, or React hooks
- Data fetching hooks (`use-dashboard-data.ts`) are client-side
## API Route Patterns
### Input Validation
- Use Zod schemas for request body validation
- Return HTTP 400 with `{ error: string }` on validation failure
- Validate before any DB write
### HTTP Status Codes (do not change without updating client-side handlers)
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
## Error Handling
### Server Side
- Auth failures: use `getAuthRequiredResponse()` / `getAuthUnavailableResponse()` from `@/lib/auth`
- Validation failures: Zod `safeParse` + return 400 with first issue message
- Not found: return 404 with `{ error: "..." }`
- Business violations: return 422 with descriptive message
### Client Side
- API errors surface through each feature's data hook state (e.g. `use-dashboard-data.ts`, `use-teams-data.ts`)
- Toast notifications via `sonner` for user-facing feedback
## Language in Code
- Error messages and validation messages in **Brazilian Portuguese**
- Code identifiers, comments, and type names in **English**
- Git commits in English (conventional commits)
- PR bodies in Portuguese (sections: "O que muda" / "Como testar")
## Component Layer Rules
- `ui/` components: shadcn primitives only, no domain logic
- `primitives/` components: domain-aware reusables (StatTile, SectionHeader)
- Feature components import from `ui/` and `primitives/` — never cross-feature imports
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Next.js 16 App Router with route groups for authentication
- Layered architecture: domain layer → API routes → client components
- Session-based auth (Auth.js v4 with JWT); `DATABASE_URL` required at runtime
- Prisma ORM with PostgreSQL; routes return 503 when DB is absent
- Client-side state via React hooks only (no Redux/Zustand)
- All data derivation on-demand — no persisted scoreboard counters
## Layers
- Purpose: React components for rendering pages and features
- Location: `src/components/` (organized by feature and primitives)
- Contains: Page components, feature-specific components, UI primitives
- Depends on: Domain types, client-side data hooks, theme system
- Used by: Next.js pages in `src/app/`
- Purpose: Domain types, match/team CRUD, stats computation
- Location: `src/lib/types.ts`, `src/lib/data.ts`, `src/lib/teams.ts`, `src/lib/team-details.ts`, `src/lib/stats.ts`, `src/lib/ranking.ts`, `src/lib/profile-stats.ts`, `src/lib/head-to-head.ts`, `src/lib/time-period.ts`
- Contains: Type definitions (TeamRecord, MatchRecord, etc.), data normalization, pure stats functions
- Depends on: Prisma client
- Used by: API routes, components via custom hooks
- Purpose: REST endpoints for authentication, teams, matches, profile
- Location: `src/app/api/*/route.ts` (organized by feature)
- Contains: Request validation (Zod), auth guards, domain function calls, response serialization
- Depends on: Domain functions, auth utilities, Prisma
- Used by: Client components and external integrations
- Purpose: Credential validation, session management, rate limiting
- Location: `src/lib/auth.ts`, `src/lib/auth-validation.ts`, `src/lib/auth-rate-limit.ts`
- Contains: Auth configuration (NextAuthOptions), user session extraction, password validation, request-based rate limiting
- Depends on: bcryptjs, next-auth, Prisma
- Used by: Middleware, API routes, protected layouts
- Purpose: Database schema and client initialization
- Location: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Contains: Prisma Client singleton, database models (User, Team, TeamMember, Match, AuthRateLimit)
- Depends on: PostgreSQL database
- Used by: Domain functions and API routes
- Purpose: Request interception and protected route enforcement
- Location: `middleware.ts` (root)
- Contains: Auth guard middleware that redirects unauthenticated users to `/login`
- Depends on: next-auth/middleware
- Used by: Next.js router
## Data Flow
- Dashboard state (scoreboard, matches) stored in React hook state via `useState`
- All derivations computed fresh from match history on each load
- No Redux/Zustand; no client-side normalized cache
- Scoreboard counters (wins, leadBy, streak) derived from match array, not persisted
## Key Abstractions
- Purpose: Normalized team with member roster and metadata
- Examples: `src/lib/types.ts` (type definition), `src/lib/teams.ts` (normalization function)
- Pattern: Prisma raw response normalized to ISO dates and snake_case → camelCase
- Purpose: Normalized match with winner/loser IDs and playedAt timestamp
- Examples: `src/lib/data.ts` (createMatch, listMatches)
- Pattern: Derived loser from teamA/teamB and winnerTeamId; dates converted to ISO
- Purpose: Request validation and field-level error reporting
- Examples: `createMatchSchema`, `createTeamSchema` in route handlers
- Pattern: `safeParse()` used; errors returned as 400 with field errors in response
- Purpose: Per-action (login/register) throttling based on username + IP
- Examples: `src/lib/auth-rate-limit.ts`
- Pattern: In-memory state stored in AuthRateLimit table; time-window based blocking
## Entry Points
- Location: `src/app/page.tsx`
- Triggers: Direct visit to `/`
- Responsibilities: Extract authenticated user, redirect to `/dashboard` if logged in, else `/login`
- Location: `src/app/(authenticated)/dashboard/page.tsx`
- Triggers: User navigates after login
- Responsibilities: Render scoreboard, teams, recent matches via `useDashboardData()` hook
- Location: `src/app/(authenticated)/layout.tsx`
- Triggers: Any route under `/(authenticated)/*`
- Responsibilities: Enforce authentication, render AppShell with sidebar and user menu
- Location: `src/app/api/auth/[...nextauth]/route.ts`
- Triggers: `POST /api/auth/signin`, `POST /api/auth/signout`, etc. (Auth.js internal)
- Responsibilities: Delegate to CredentialsProvider, manage JWT session
- Location: `src/app/api/auth/register/route.ts`
- Triggers: `POST /api/auth/register`
- Responsibilities: Validate payload, check rate limit, hash password, create user, return 201
- Location: `src/app/api/teams/route.ts` (GET/POST), `src/app/api/teams/[id]/route.ts` (GET/PATCH/DELETE)
- Triggers: Team CRUD operations
- Responsibilities: List user teams, create team, fetch team details, archive team
- Location: `src/app/api/matches/route.ts`
- Triggers: `GET /api/matches` (recent matches), `POST /api/matches` (register result)
- Responsibilities: Validate team membership, register match, return normalized records
- Location: `src/app/api/scoreboard/route.ts`
- Triggers: `GET /api/scoreboard`
- Responsibilities: Fetch all user's team matches, compute wins/streaks, return aggregated stats
## Error Handling
- **401 Unauthorized:** No authenticated session; return `getAuthRequiredResponse()` (error message, status 401)
- **400 Bad Request:** Validation failure; return Zod errors or business logic errors (invalid teams, duplicate names)
- **403 Forbidden:** User not member of team; return permission error
- **404 Not Found:** Resource (team, user) not found
- **409 Conflict:** Duplicate constraint (username, team name already taken); Prisma P2002 caught and mapped to 400 with user message
- **429 Too Many Requests:** Rate limit exceeded (login/register); return retryAfterSeconds
- **503 Service Unavailable:** Database not configured (DATABASE_URL missing); return auth unavailable error
- **500 Internal Server Error:** Unexpected errors propagated; not caught in routes
## Cross-Cutting Concerns
- Request payloads validated with Zod before mutation
- Auth payload validated with `validateLoginPayload()` and `validateRegisterPayload()`
- Team IDs validated: teams must exist, be active, user must be member
- All protected routes call `getAuthenticatedUser()` at handler start
- Middleware enforces authentication for `/dashboard`, `/times`, `/ranking`, `/profile`, `/settings`, `/head-to-head`
- Public routes: `/`, `/login`, `/api/auth/*`, `/api/auth/register`
- Session stored as JWT in HttpOnly cookie; strategy set in `getAuthOptions()`
- User can only see own teams and matches
- User must be team member to register a match for that team
- Team archived by creator; `POST /api/teams/[id]/archive` is implemented
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
