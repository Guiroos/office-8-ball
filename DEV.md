# DEV Notes - Office 8 Ball

## Objective
This file records the technical decisions and implementation changes taken while bootstrapping the project.

It complements the product-oriented `PRD.md` with engineering context.

## Current Implementation Snapshot

- The app is implemented as a single `Next.js` application with `App Router`.
- `Prisma` is already the active data access layer.
- The dashboard now uses `Tailwind CSS` with local `shadcn/ui`-style components.
- Authentication is still intentionally absent.
- The API supports optional `note` on match creation, but the dashboard UI still submits only `winnerTeamId`.
- Automated tests now use `Vitest` + Testing Library.

## Change Log From Earlier Iterations

- The project moved from direct SQL access to `Prisma`.
- The repository now includes `schema.prisma`, migrations, Prisma seed, and a shared Prisma client.
- The app kept the local in-memory fallback even after introducing Prisma, so developers can still run the app without Neon.
- The roadmap item "introduce Prisma" is no longer future work; it is part of the current implementation.

## Key Decisions

### Project Structure
- The project was created as a single `Next.js` application.
- `App Router` was chosen to keep UI and API in one deployable unit.
- This avoids maintaining a separate backend service.

### Hosting Model
- `Vercel` is the intended hosting platform.
- Frontend and API routes are deployed together.
- This keeps the operational model simple for an internal tool.

### Database Choice
- `Neon Postgres` was chosen as the primary database.
- Reasoning:
  - the domain is naturally relational
  - match history and scoreboard aggregation are simple SQL workloads
  - it integrates well with the Vercel deployment model
- `MongoDB Atlas` was deliberately not chosen because document storage adds little value for this use case.
- `Supabase` was considered valid, but `Neon` was preferred for a smaller, more minimal setup.

### Fallback for Local Development
- The app works without `DATABASE_URL`.
- When no database URL is configured, it uses an in-memory fallback.
- This allows immediate local development before provisioning Neon.
- Important limitation:
  - in-memory data is temporary and resets when the server restarts

### Data Access Approach
- `Prisma` was introduced as the database access layer.
- The project no longer uses direct SQL queries in the application layer.
- Reasoning:
  - centralizes schema and migrations
  - reduces maintenance cost for future model changes
  - prepares the project for upcoming auth and multi-league features

## Implemented Architecture

### Frontend
- Single main screen implemented in `src/components/dashboard.tsx`.
- Main route is `src/app/page.tsx`.
- Global styling lives in `src/app/globals.css`.
- Shared UI primitives now live under `src/components/ui/`.
- Layout metadata was updated in `src/app/layout.tsx`.

### Backend/API
- `GET /api/scoreboard`
  - implemented in `src/app/api/scoreboard/route.ts`
  - returns aggregated scoreboard data
- `GET /api/matches`
  - implemented in `src/app/api/matches/route.ts`
  - returns recent matches ordered by date descending
- `POST /api/matches`
  - implemented in `src/app/api/matches/route.ts`
  - validates `winnerTeamId`
  - accepts optional `note`
  - creates a new match record

### Shared Domain Layer
- Team definitions and win messages live in `src/lib/constants.ts`.
- Shared types live in `src/lib/types.ts`.
- Data access, scoreboard aggregation and fallback behavior live in `src/lib/data.ts`.
- Prisma client setup lives in `src/lib/prisma.ts`.
- Prisma schema and migrations live under `prisma/schema.prisma` and `prisma/migrations`.

## Current Data Model

### `teams`
- `id`
- `name`
- `display_name`

### `matches`
- `id`
- `winner_team_id`
- `played_at`
- `note`

The database schema is now managed through Prisma in `prisma/schema.prisma`.

## Behavioral Decisions
- The score is derived from the match history, not stored separately.
- The leader is derived from total wins.
- The streak is derived from the most recent consecutive wins by the same team.
- Teams are fixed in v1:
  - `frontend`
  - `backend`
- Authentication was intentionally omitted from v1.

## UI Decisions
- The app uses a single-screen experience for speed of use between matches.
- The visual direction intentionally avoids default starter styling.
- The interface emphasizes:
  - current score
  - one-click winner registration
  - recent history
  - quick “status” and rivalry messaging
- Comedic copy is lightweight and embedded as rotating win messages.

## Validation and Error Handling
- `winnerTeamId` must be `frontend` or `backend`.
- `note`, when present, must be a string with at most 140 characters.
- Failed writes return a clear API error.
- The UI does not fake a successful score update if saving fails.

## Environment and Config
- Example environment file added in `.env.example`.
- Preview example file added in `.env.preview.example`.
- Production example file added in `.env.production.example`.
- Supported values:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_APP_ENV`

### What to Set in Each Environment

#### Local development
- File:
  - copy `.env.example` to `.env.local`
- Values:
  - `DATABASE_URL=`
    - leave empty if you want in-memory mode
    - or paste the Neon connection string if you want real persistence locally
  - `NEXT_PUBLIC_APP_ENV=development`

#### Preview / sandbox
- File reference:
  - `.env.preview.example`
- Values to configure in Vercel Preview environment:
  - `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require`
    - recommended: use a separate Neon database or branch for preview
  - `NEXT_PUBLIC_APP_ENV=preview`

#### Production
- File reference:
  - `.env.production.example`
- Values to configure in Vercel Production environment:
  - `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require`
    - recommended: use the main production Neon database
  - `NEXT_PUBLIC_APP_ENV=production`

### Data You Need to Provide
- `USER`
  - the database user from Neon
- `PASSWORD`
  - the database password from Neon
- `HOST`
  - the Neon hostname
- `DB_NAME`
  - the target database name

### Environment Strategy
- Local development:
  - can run with no database at all
- Preview / sandbox:
  - should use an isolated Neon database or branch to avoid polluting production scores
- Production:
  - should use the stable shared Neon database used by the office

## Important Implementation Notes
- Google Fonts were intentionally removed from the implementation.
- Reasoning:
  - the build environment could not fetch remote font assets reliably
  - local/system font stacks keep the build deterministic
- The visual refresh used local `shadcn/ui`-style components instead of depending on generated defaults as final design.
- Reasoning:
  - keeps control of the component code inside the repo
  - avoids turning the dashboard into a generic SaaS admin screen
- `useEffectEvent` was initially considered but removed.
- Reasoning:
  - it added avoidable lint friction for this simple data-loading flow
  - a plain async fetch path is clearer for the current component

## Verification Performed
- `npm run test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Current local results:
- `npm run test` passed
- `npm run lint` passed
- `npx tsc --noEmit` passed
- `npm run build` passed

Database-specific commands still depend on a configured `DATABASE_URL`:
- `npm run prisma:generate`
- `npm run prisma:deploy`
- `npm run prisma:seed`

## Testing Status
- The repository now has a lightweight automated test suite.
- Stack:
  - `Vitest`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `jsdom`
- Commands:
  - `npm run test`
  - `npm run test:watch`
  - `npm run test:coverage`
- Current scope:
  - domain logic in memory mode
  - API route behavior
  - dashboard UI behavior with mocked `fetch`
- Not covered yet:
  - Prisma-backed integration tests
  - end-to-end browser flows

## Next Steps to Make the App Fully Work

This section is intentionally operational, not a statement that the app is unimplemented. The current app already works locally and the remaining steps below are about validation, shared persistence, deployment, and polish.

### 1. Run the app locally right now
- Copy `.env.example` to `.env.local`
- Keep `DATABASE_URL` empty for the first run if needed
- Run `npm run dev`
- Open `http://localhost:3000`
- Validate that:
  - the page loads
  - clicking `Vitoria Frontend` updates the score
  - clicking `Vitoria Backend` updates the score
  - the recent history list updates

### 2. Provision the Neon database
- Create a free Neon project
- Copy the Postgres connection string
- Put that value into `DATABASE_URL` in `.env.local`
- Run `npm run prisma:deploy`
- Run `npm run prisma:seed`
- Restart the local app
- Validate that match data now persists across server restarts

### 3. Verify the shared persistence flow
- Register a few matches locally with Neon configured
- Refresh the page and confirm the data remains
- Open the app in another browser or private window
- Confirm the same score and history are visible

### 4. Prepare deployment in Vercel
- Push the repository to GitHub
- Import the project into Vercel
- Add the Preview values from `.env.preview.example` to the Vercel Preview environment
- Add the Production values from `.env.production.example` to the Vercel Production environment
- Deploy the project

### 5. Validate production behavior
- Open the Vercel URL
- Register wins for both teams
- Confirm:
  - scoreboard updates correctly
  - history is shared
  - data remains after refresh
  - API routes respond correctly in production

### 6. Finish the first useful polish items
- Add a small input for optional match notes in the UI
- Add a persistence mode indicator in the UI only if it improves debugging without harming the simple UX
- Add a safe reset mechanism only if there is a real need for it

Already implemented since earlier notes:
- the dashboard already has an empty-state message for first-time use

### Recommended Order
- First make it work locally without Neon
- Then connect Neon and validate persistence
- Then deploy to Vercel
- Then add polish features
