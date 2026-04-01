# CLAUDE.md

Office 8 Ball is a Next.js 16 office billiards tracker. Users create teams (solo or duo), record match results, and track standings via a dynamic ranking. Flow: login → `/dashboard` → register a match winner → scoreboard updates. Teams are fully user-created — no hardcoded team IDs. See `.claude/rules/` for domain invariants, architecture constraints, testing patterns, and safe-change checklist.

## Tech Stack

- Next.js 16.1.6 (App Router) · React 19.2.3 · TypeScript 5
- Prisma 6.19.2 + PostgreSQL · better-auth 1.5.6 — credentials-only, username/password sessions
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
- `src/components/ui/` — shadcn primitives
- `src/components/primitives/` — domain reusables (StatTile, SectionHeader, IconCallout, FormField)
- `src/components/dashboard/` — main scoreboard feature
- `src/components/teams/` — team list, detail, creation dialog, member management
- `src/components/ranking/` — ranking view, podium, period/type tabs
- `src/components/profile/` — profile page and edit dialog
- `src/components/head-to-head/` — head-to-head view
- `src/components/authenticated/` — app shell and sidebar layout
- `src/app/(authenticated)/` — protected route group
- `techspec/` — architecture and operational docs
- `prisma/` — schema, migrations, seed

## Routes

**Pages:** `/login` · `/(authenticated)/dashboard` · `/times` · `/times/[id]` · `/ranking` · `/head-to-head` · `/profile` · `/settings`

**API:** `/api/auth/register` · `/api/matches` · `/api/scoreboard` · `/api/teams` · `/api/teams/[id]` · `/api/teams/[id]/members` · `/api/teams/[id]/archive` · `/api/profile` · `/api/users`

## Architecture Decisions

See `.claude/rules/` for full constraint set. Key conventions:

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
- Do not change API status codes without also updating client-side error handling.
- Update `.claude/rules/` or `techspec/` only when behavior actually changed — no preemptive doc edits.

## Testing

- Unit/integration: Vitest + Testing Library (jsdom); E2E: Playwright (real Postgres, CI only).
- Data layer tests: pure functions receive match arrays directly. For modules that check `hasDatabaseUrl()`, delete `process.env.DATABASE_URL` in `beforeEach`.
- Route tests: mock `@/lib/auth` and stub `getAuthenticatedUser` — never call real better-auth in unit tests.
- Never import Prisma in test files directly.

See `.claude/rules/testing.md` for the full isolation pattern.

## Environment Variables

```
DATABASE_URL=postgresql://...       # Required for auth and persistence
BETTER_AUTH_SECRET=...              # Required when DATABASE_URL is set
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=                # "development" | "preview" | "production"
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

**Delegate to sub-agents:** Broad codebase exploration, multi-file implementation, running builds/tests, processing large command output. Trivial single-file changes can be done directly.

**Sub-agent communication:** Every prompt ends with "Return a structured summary: [exact fields]". Never ask a sub-agent to "return everything". Target 10–20 lines of actionable info per result.
