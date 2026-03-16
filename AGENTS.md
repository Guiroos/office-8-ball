# AGENTS.md

## Purpose

This repository contains `Office 8 Ball`, an internal scoreboard app for office pool matches.

Use this file as the default operating guide for AI agents working in this repo. Keep changes small, consistent with the current architecture, and grounded in the code.

## Quick Mental Model

- The app is a single `Next.js` App Router project.
- `frontend` and `backend` are the only valid teams in v1.
- The scoreboard is always derived from match history.
- Authentication now exists through `Auth.js` credentials backed by Prisma users.
- Login and signup now use Prisma-backed rate limiting by normalized `email + IP`.
- Auth field validation is shared with `zod` schemas used by both frontend and backend.
- The real functional flow today is the authenticated scoreboard at `/scoreboard`.
- `/login` is the real login/signup entry screen.
- `/login` uses a branded full-page layout with a desktop-first two-column composition.
- Visual theme tokens live in `src/app/globals.css`, including the shared foundation scale for radius, shadow, and type across login and dashboard.
- `/` redirects by session state.

## Product Context

- Frontend team: `Gui + Jean`
- Backend team: `Adair + Richard`
- Tone: playful internal rivalry, but behavior should stay simple and reliable
- Main working user flow today: enter through `/login`, open `/scoreboard`, register the winner, see scoreboard and recent history refresh

## Source Of Truth

When sources disagree, use this priority:

1. Code in `src/` and `prisma/`
2. `README.md` and `techspec/`
3. `PRD.md`

Practical note:
- `techspec/` is now the main home for technical documentation and next-step analysis.
- GitHub operational hardening, CI and repository protection now live in `techspec/github-operations.md`.
- Git conventions, release-by-tag flow, and deploy prerequisites now live in `techspec/git-conventions.md`.

## Current Architecture

### Routes

- `middleware.ts`: route-level auth protection for `/scoreboard`
- `src/app/page.tsx`: redirects by session state
- `src/app/login/page.tsx`: login/signup page
- `src/app/not-found.tsx`: branded 404 screen for invalid routes
- `src/app/error.tsx`: branded route error recovery screen
- `src/app/scoreboard/page.tsx`: main scoreboard page
- `src/app/api/scoreboard/route.ts`: scoreboard read API
- `src/app/api/matches/route.ts`: matches read/create API
- `src/app/api/auth/register/route.ts`: user signup API
- `src/app/api/auth/[...nextauth]/route.ts`: Auth.js session route

### UI

- `src/components/dashboard/index.tsx`: main scoreboard screen
- `src/components/dashboard/use-dashboard-data.ts`: fetch/load/register-win flow
- `src/components/dashboard/*`: scoreboard subcomponents
- `src/components/login/login-screen.tsx`: branded login/signup UI connected to real auth
- `src/components/theme/*`: app-wide theme provider, toggle, shared theme helpers, and theme tests
- `src/components/ui/*`: local UI primitives plus shared composition components

### Domain And Persistence

- `src/lib/constants.ts`: fixed team metadata and win messages
- `src/lib/types.ts`: shared domain and API types
- `src/lib/auth.ts`: Auth.js config and session helpers
- `src/lib/auth-rate-limit.ts`: auth rate limit helpers and IP/email keying
- `src/lib/auth-validation.ts`: shared auth schemas, normalization, and field error mapping
- `src/lib/data.ts`: business rules, persistence switching, scoreboard derivation, seed self-healing
- `src/lib/prisma.ts`: shared Prisma client
- `prisma/schema.prisma`: database schema
- `prisma/seed.mjs`: fixed team seed

## Domain Invariants

Preserve these unless the user explicitly asks to change the product model:

- Only two team ids are valid: `frontend` and `backend`
- Team definitions are hard-coded in `src/lib/constants.ts`
- Scoreboard values are derived from `matches`, never stored as counters
- `leaderTeamId` is `null` on ties
- `leadBy` is the absolute win difference
- `currentStreak` is based on newest consecutive wins by the latest winner
- API contracts remain compatible with current UI fetches unless the task explicitly changes both sides

If you touch team behavior, review all of:

- `src/lib/constants.ts`
- `src/lib/types.ts`
- `src/lib/data.ts`
- `src/app/api/matches/route.ts`
- `prisma/seed.mjs`
- `prisma/schema.prisma`

## Runtime Behavior

### Persistence Modes

- With `DATABASE_URL`: uses Prisma + Postgres
- Without `DATABASE_URL`: uses in-memory fallback

Important:
- In-memory mode is for local development only
- In-memory data disappears on server restart
- Local success without `DATABASE_URL` does not prove shared persistence works
- Login/signup require `DATABASE_URL` because users persist only in Postgres
- Login/signup rate limiting also persists only when `DATABASE_URL` is available
- If `DATABASE_URL` exists without `NEXTAUTH_SECRET`, treat auth as invalid configuration rather than a disabled feature

### Match Creation

`POST /api/matches` accepts:

- `winnerTeamId`
- `note` optional

Validation rules:

- `winnerTeamId` must be `frontend` or `backend`
- `note` must be a string with at most 140 characters

Important:

- The API supports `note`
- The recent matches UI already renders persisted `note`
- The scoreboard UI can send `{ winnerTeamId, note }`
- `src/lib/data.ts` trims `note` and normalizes empty values to `null`

### UI Data Flow

- The scoreboard UI fetches `/api/scoreboard` and `/api/matches`
- After registering a win, the UI re-fetches both endpoints
- The UI intentionally does not apply optimistic scoreboard updates before persistence succeeds
- With `DATABASE_URL`, `middleware.ts` protects `/scoreboard` and the page/API layers also validate session
- Without `DATABASE_URL`, auth stays disabled and the local scoreboard flow can still run only for development fallback
- The login screen handles both `entrar` and `criar conta`
- The login screen keeps submit actions enabled while auth is available, validates locally on blur or submit, and only calls auth endpoints when the current mode is valid
- Field errors appear after blur or submit attempt; API conflicts still return remote field errors
- Repeated auth failures trigger temporary progressive blocks keyed by normalized `email + IP`
- On desktop, the login keeps the image on the left and the form on the right
- On mobile, the image is hidden and the form remains in a single column
- Invalid routes render a branded `404` recovery screen
- Route rendering failures render a branded retry screen with `reset()`

## Working Rules For Agents

### Prefer Small, Concrete Changes

Avoid introducing these unless explicitly requested:

- abstractions for future multi-team support
- auth scaffolding behind fake placeholders
- admin concepts
- caching layers
- client state libraries
- stored aggregate counters

This is a narrow v1 app. Keep it narrow.

### Match The Existing UX Intent

- Scoreboard UX should stay fast and obvious
- Copy should stay short, readable, and playful
- Auth UX should stay simple: credentials only, no fake providers
- Keep the current green billiards-table direction unless the task explicitly asks for a different visual language
- If you change routing, confirm that `/scoreboard` remains accessible unless the user asks for a product change

### Be Precise About Persistence

If you change `src/lib/data.ts`, verify both:

- behavior with no `DATABASE_URL`
- behavior assumptions when Prisma is active

Do not assume the database is the source of team truth. In v1, teams are mirrored in code and seeded into the DB.

### Keep Docs Honest

If your change alters real behavior, update docs that would mislead future agents:

- `AGENTS.md` for agent workflow and architecture
- `README.md` for setup and runtime usage
- the relevant file in `techspec/` for technical decisions, architecture, or roadmap changes

Prefer short corrections over broad doc rewrites.

## Task Routing Guide

Use this as the default review map before editing:

### GitHub Actions or repository operations changes

Read:

1. `techspec/github-operations.md`
2. `README.md`
3. `package.json`
4. `.github/workflows/*`

Constraint:
- keep Vercel as the deployment platform; use GitHub for validation and repository protection
- if the task changes release or deploy behavior, also review `techspec/git-conventions.md` and `vercel.json`

### Scoreboard or match-history changes

Read:

1. `src/lib/data.ts`
2. `src/lib/types.ts`
3. `src/app/api/matches/route.ts`
4. `src/app/api/scoreboard/route.ts`
5. relevant dashboard components/tests

### Dashboard UI changes

Read:

1. `src/components/dashboard/index.tsx`
2. `src/components/dashboard/use-dashboard-data.ts`
3. relevant subcomponents in `src/components/dashboard/`
4. `src/components/dashboard.test.tsx`
5. `src/components/ui/composition.test.tsx` when shared composition primitives are involved

### Login/auth changes

Read:

1. `src/app/page.tsx`
2. `src/app/login/page.tsx`
3. `src/components/login/login-screen.tsx`
4. `src/components/login/login-screen.test.tsx`
5. `src/lib/auth-validation.ts` when validation rules are involved

Constraint:
- keep auth simple unless the user explicitly asks to extend it

### Persistence or schema changes

Read:

1. `prisma/schema.prisma`
2. `prisma/seed.mjs`
3. `src/lib/data.ts`
4. relevant API route tests

Constraint:
- do not break the in-memory fallback unless the user explicitly approves that product change

## Validation Expectations

Run the smallest useful validation set for the area you changed.

Common commands:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

Useful targeted checks:

```bash
npm run test -- src/lib/data.test.ts
npm run test -- src/app/api/matches/route.test.ts
npm run test -- src/app/api/scoreboard/route.test.ts
npm run test -- src/components/dashboard.test.tsx
npm run test -- src/components/login/login-screen.test.tsx
npm run test -- src/components/ui/composition.test.tsx
npm run test -- src/lib/auth-validation.test.ts
```

Database commands:

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

Notes:

- `postinstall` runs `prisma generate`
- database commands require a real `DATABASE_URL`
- if you change API shape, also verify the calling UI
- if you change routing, verify `/`, `/login`, and `/scoreboard`

## Known Gaps

- No password recovery yet
- No email verification yet
- No profile/nickname UI yet
- No Prisma-backed integration tests yet
- No browser E2E coverage yet

## Safe Change Checklist

Before finishing, check:

1. Does the app still support both persistence modes?
2. Is the scoreboard still derived from match history?
3. Are `frontend` and `backend` still the only accepted team ids unless the task explicitly changed that?
4. Did `/scoreboard` remain the real functional flow?
5. Did API response shapes stay compatible with the current UI?
6. Did login, signup, and protected routes stay consistent with the current auth model?
7. Did you update docs only where behavior actually changed?
