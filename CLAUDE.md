# CLAUDE.md

Office 8 Ball is an internal scoreboard app for office pool matches between two fixed teams (`frontend` and `backend`). Flow: login → `/dashboard` → register a match winner → scoreboard updates. See `.claude/rules/` for domain invariants, working rules, and safe-change checklist.

## Source of Truth

When sources disagree: `src/` and `prisma/` > `README.md` and `techspec/` > `PRD.md`.

- `techspec/` — technical docs and architecture decisions
- `techspec/github-operations.md` — CI and repository protection
- `techspec/git-conventions.md` — release flow and deploy prerequisites

## Commands

```bash
# Development
npm run dev           # Start dev server (http://localhost:3000)
npm run build         # Production build
npm run typecheck     # TypeScript strict check

# Testing
npm run test                              # Run all unit/component tests
npm run test:watch                        # Watch mode
npm run test -- src/lib/data.test.ts     # Run a single test file
npm run e2e                               # Playwright E2E tests
npm run e2e:ui                            # Playwright UI mode

# Quality
npm run lint

# Database (requires DATABASE_URL)
npm run prisma:migrate    # Run migrations in dev
npm run prisma:deploy     # Deploy migrations to production
npm run prisma:seed       # Seed teams into DB
npm run prisma:generate   # Regenerate Prisma client (runs on postinstall)
```

## Architecture

**Stack:** Next.js (App Router) · React 19 · Prisma + PostgreSQL · Auth.js v4 · Tailwind CSS · Zod · Vitest · Playwright

**Routes:**
- `/` — redirects by session state
- `/login` — login/signup (public)
- `/(authenticated)/dashboard` — main scoreboard (protected)
- `/(authenticated)/**` — placeholder pages (protected)
- `/api/scoreboard` — GET aggregated scoreboard (session required)
- `/api/matches` — GET/POST matches (session required)
- `/api/auth/register` — POST signup

**Persistence (`src/lib/data.ts`):**
- `DATABASE_URL` present → Prisma + Postgres
- `DATABASE_URL` absent → in-memory fallback (local dev only, no auth)
- Scoreboard is always derived from match history, never stored as counters

**Auth (`src/lib/auth.ts`, `auth-validation.ts`, `auth-rate-limit.ts`):**
- Credentials-only via Auth.js with JWT sessions
- Zod schemas in `auth-validation.ts` shared by client and server
- Rate limiting: 5 failures in 10 min → progressive blocks (15/30/60 min), keyed by `email + IP`
- Requires both `DATABASE_URL` and `NEXTAUTH_SECRET`

**Middleware (`middleware.ts`):** protects `/(authenticated)` routes; no-op if auth env vars missing.

## Environment Variables

```
DATABASE_URL=postgresql://...       # Required for auth and shared persistence
NEXTAUTH_SECRET=...                 # Required when DATABASE_URL is set
NEXTAUTH_URL=http://localhost:3000  # Optional in dev
```

## Testing

- Unit/integration: Vitest + Testing Library (jsdom)
- E2E: Playwright with a real temporary Postgres (configured in CI)
- Run a specific file: `npm run test -- <path>`
- Coverage: `npm run test:coverage`
