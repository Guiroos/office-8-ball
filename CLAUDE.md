# CLAUDE.md

Office 8 Ball is a Next.js 16 scoreboard app for two fixed office teams (`frontend` and `backend`). Flow: login → `/dashboard` → register a match winner → scoreboard updates. See `.claude/rules/` for domain invariants, architecture constraints, testing patterns, and safe-change checklist.

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

- `src/lib/` — domain (constants, types, data), auth, Prisma client
- `src/components/ui/` — shadcn primitives (Button, Card, Input, Badge, etc.)
- `src/components/primitives/` — domain reusables (StatTile, SectionHeader, IconCallout)
- `src/components/dashboard/` — main scoreboard feature
- `src/components/authenticated/` — app shell and sidebar layout
- `src/components/login/` — login/register screen
- `src/components/theme/` — theme provider, toggle, and core system
- `src/app/(authenticated)/` — protected route group
- `techspec/` — architecture and operational docs
- `prisma/` — schema, migrations, seed

## Routes

- `/` — redirects by session state
- `/login` — public; credentials-only login/signup
- `/(authenticated)/dashboard` — main scoreboard (protected)
- `/scoreboard` — legacy redirect to dashboard
- `/api/scoreboard` — GET aggregated scoreboard (session required)
- `/api/matches` — GET/POST matches (session required)
- `/api/auth/register` — POST signup

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
- When changing `src/lib/data.ts`, verify behavior both with and without `DATABASE_URL`.
- Do not change API status codes (401, 409, 429, 500, 503) without also updating client-side error handling.
- Update `.claude/rules/` or `techspec/` only when behavior actually changed — no preemptive doc edits.

## Testing

- Unit/integration: Vitest + Testing Library (jsdom); E2E: Playwright (real Postgres, CI only).
- Data layer tests: use `vi.resetModules()` + dynamic imports to isolate `memoryState` between tests.
- Route tests: mock `@/lib/auth` and stub `getAuthenticatedUser` — never call real Auth.js in unit tests.
- Never import Prisma in test files — all tests run against in-memory mode.

See `.claude/rules/testing.md` for the full isolation pattern.

## Environment Variables

```
DATABASE_URL=postgresql://...       # Required for auth and persistence
NEXTAUTH_SECRET=...                 # Required when DATABASE_URL is set
NEXTAUTH_URL=http://localhost:3000  # Optional in dev
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

