# AGENTS.md

## Purpose

This repository contains `Office 8 Ball`, an internal scoreboard web app for office pool matches.

The current v1 domain is intentionally narrow:
- exactly two fixed teams exist: `frontend` and `backend`
- the app records match winners
- the scoreboard is always derived from match history
- authentication does not exist yet

Use this file as the fast-start guide for AI agents working in this repo.

## Product Context

- Frontend team: `Gui + Jean`
- Backend team: `Adair + Richard`
- Tone: playful internal rivalry, but the app behavior should stay simple and reliable
- Main user flow: open the page, click one button to register the winner, see the scoreboard and recent history update

## Source Of Truth

When sources disagree, use this priority:

1. Code in `src/` and `prisma/`
2. `README.md` and `DEV.md`
3. `PRD.md`
4. `ROADMAP.md`

Reason:
- `ROADMAP.md` still describes Prisma adoption as a future phase, but Prisma is already present in the codebase.
- `DEV.md` has some stale absolute file paths from an older machine, but the implementation notes are still useful.

## Current Architecture

The project is a single `Next.js` App Router application.

High-level structure:
- `src/app/page.tsx`: home page entrypoint
- `src/components/dashboard.tsx`: main client UI
- `src/app/api/scoreboard/route.ts`: scoreboard API
- `src/app/api/matches/route.ts`: matches read/create API
- `src/lib/data.ts`: main business logic and persistence switching
- `src/lib/constants.ts`: fixed team metadata and win messages
- `src/lib/types.ts`: shared domain and API types
- `src/lib/prisma.ts`: shared Prisma client
- `prisma/schema.prisma`: database schema
- `prisma/seed.mjs`: seed for fixed teams

## Data Model

Current database entities:

- `teams`
  - `id`
  - `name`
  - `display_name`
- `matches`
  - `id`
  - `winner_team_id`
  - `played_at`
  - `note`

Important constraints:
- v1 assumes only two team ids are valid: `frontend` and `backend`
- team definitions are mirrored in code, not dynamically loaded from the database
- the DB is used for persistence, but the domain shape is still hard-coded in `src/lib/constants.ts`

## Runtime Behavior

### Persistence Mode

The app supports two modes:

- With `DATABASE_URL`: uses Prisma + Postgres
- Without `DATABASE_URL`: uses in-memory fallback

The in-memory fallback is only for local development. Data disappears on server restart.

### Scoreboard Rules

Do not introduce stored counters unless explicitly requested. Current behavior depends on deriving the scoreboard from match history:

- wins per team are counted from `matches`
- leader is whichever team has more wins
- `leadBy` is the absolute difference between the two teams
- streak is computed from the newest consecutive wins by the latest winner

These rules currently live in `src/lib/data.ts`.

### Match Creation

`POST /api/matches` accepts:
- `winnerTeamId`
- `note` optional

Validation rules:
- `winnerTeamId` must be `frontend` or `backend`
- `note` must be a string with at most 140 characters

Important:
- the API supports `note`
- the current dashboard UI does not expose note entry yet
- the UI only posts `{ winnerTeamId }`

## Frontend Notes

Current UI characteristics:
- single-screen dashboard
- client component with fetch-based loading
- no optimistic scoreboard update before persistence succeeds
- uses CSS Modules, not Tailwind
- uses playful Portuguese copy in the interface

The main screen loads:
- `/api/scoreboard`
- `/api/matches`

After registering a win, the dashboard re-fetches both endpoints.

## Database Notes

Prisma is already integrated.

Useful files:
- `prisma/schema.prisma`
- `prisma/migrations/0001_init/migration.sql`
- `prisma/seed.mjs`
- `prisma.config.ts`

Implementation detail:
- `src/lib/data.ts` also upserts the fixed teams through `ensureSeedData()` before Prisma reads/writes
- this means the app can self-heal missing `teams` rows as long as the schema exists

## Environment

Expected env vars:
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_ENV`

Examples:
- `.env.example`
- `.env.preview.example`
- `.env.production.example`

UI environment badge:
- `production` shows `Modo escritorio`
- anything else shows `Modo dev`

## Commands

Common commands:

```bash
npm run dev
npm run test
npm run test:watch
npm run test:coverage
npm run lint
npx tsc --noEmit
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

Notes:
- `postinstall` runs `prisma generate`
- `npm run build` has been validated successfully in the current project state

## Working Rules For Agents

### Prefer Small, Consistent Changes

This app is intentionally simple. Avoid introducing:
- generic abstractions for future multi-team support
- auth scaffolding
- admin concepts
- caching layers
- client state libraries

Unless the user explicitly asks for expansion, keep the v1 shape intact.

### Preserve Domain Invariants

If changing team-related behavior, review all of:
- `src/lib/constants.ts`
- `src/lib/types.ts`
- `src/lib/data.ts`
- `src/app/api/matches/route.ts`
- `prisma/seed.mjs`
- `prisma/schema.prisma`
- documentation files if the change is user-visible

Do not partially generalize the app. It is currently built around fixed teams everywhere.

### Be Careful With Persistence Assumptions

When debugging or testing:
- local success without `DATABASE_URL` does not prove shared persistence works
- browser refreshes after a process restart will lose in-memory data
- production-like verification requires a real `DATABASE_URL`

### Respect The Existing Tone

Product copy is intentionally playful. Keep new text:
- short
- readable
- internal-team friendly
- less important than clarity of actions and states

### Handle Documentation Carefully

The repo already has useful documentation, but some of it is partially stale.

If you update docs:
- do not assume roadmap phases are still current without checking implementation
- prefer relative or correct absolute paths
- keep README focused on setup and usage
- keep DEV focused on technical decisions and implementation notes

## Suggested Onboarding Flow For Future Agents

When starting work, read in this order:

1. `AGENTS.md`
2. `README.md`
3. `DEV.md`
4. `src/lib/data.ts`
5. the specific feature files being changed

If the task is product-directional, also read:
- `PRD.md`
- `ROADMAP.md`

## Known Gaps

As of the current code state:
- there is an initial automated test suite with `Vitest` + Testing Library
- the current test suite does not yet cover Prisma-backed integration or browser E2E flows
- the UI does not allow entering match notes yet
- auth is planned but not implemented
- Tailwind/shadcn migration is planned but not implemented

## Safe Change Checklist

Before finishing a change, check:

1. Does the app still support both persistence modes?
2. Is the scoreboard still derived from match history?
3. Are `frontend` and `backend` still the only accepted team ids unless the task explicitly changes that?
4. Did API response shapes remain compatible?
5. Did you avoid relying on docs when the code says otherwise?
