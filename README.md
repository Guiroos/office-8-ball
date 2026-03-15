# Office 8 Ball

Internal pool scoreboard for `Frontend (Gui + Jean)` vs `Backend (Adair + Richard)`.

## Current Status
- `v1` is implemented as a single-screen Next.js app.
- The main dashboard now uses `Tailwind CSS` + local `shadcn/ui`-style components.
- The theme system is shared across login and dashboard, with global foundation tokens for radius, shadow, and type.
- Persistence supports two modes:
  - `Prisma + Neon/Postgres` when `DATABASE_URL` is configured
  - in-memory fallback for local development when `DATABASE_URL` is missing
- Authentication uses `Auth.js` credentials plus Prisma-backed users when `DATABASE_URL` is configured
- Auth validation is shared between client and server through `zod` schemas
- Implemented APIs:
  - `GET /api/scoreboard`
  - `GET /api/matches`
  - `POST /api/matches`
  - `POST /api/auth/register`
- Current UI supports one-click winner registration and recent history display.
- `/login` now renders the branded auth entry screen:
  - desktop keeps a two-column split with image left and form right
  - mobile hides the image and keeps only the form column
  - login uses `email + password`
  - signup uses `username + email + password`
  - local validation blocks invalid submit before calling auth endpoints
  - field errors appear after blur or submit attempt and clear as values become valid
- The API already supports optional `note`.
- The current UI already renders persisted notes in recent history.
- The current winner-registration flow still does not expose note entry yet.
- Common local validation commands:
  - `npm run test`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- An automated test suite is now configured with `Vitest` + Testing Library.

## Stack
- Next.js App Router
- Tailwind CSS
- local shadcn/ui-style components
- Vercel for hosting
- Neon Postgres for persistence
- Prisma ORM for database access
- Zod for shared auth validation
- In-memory fallback when `DATABASE_URL` is not configured
- Vitest + Testing Library for unit and integration tests

## Local Development
1. Copy `.env.example` to `.env.local`.
2. Add `DATABASE_URL` when you are ready to connect Neon.
3. Run `npm run dev`.
4. Run `npm run test` to verify the local test suite.
5. Open `http://localhost:3000`.

Current route flow:
- `/` redirects by session state
- `/login` is the auth entry screen
- `/scoreboard` is the authenticated match and scoreboard flow

If `DATABASE_URL` is missing, auth stays disabled and login/signup remain unavailable.

When `DATABASE_URL` is configured, apply the Prisma migration before first use:

```bash
npm run prisma:deploy
npm run prisma:seed
```

Also set `NEXTAUTH_SECRET` in every environment before enabling real auth.
If `DATABASE_URL` exists without `NEXTAUTH_SECRET`, the app now treats auth as invalid configuration instead of falling back to an implicit secret.
Production should run only behind HTTPS so Auth.js can issue secure session cookies.

## API
- `GET /api/scoreboard`
- `GET /api/matches`
- `POST /api/matches`
- `POST /api/auth/register`

Example body:

```json
{
  "winnerTeamId": "frontend",
  "note": "optional"
}
```

## Testing
- `npm run test`
- `npm run test:watch`
- `npm run test:coverage`
- `npm run typecheck`

Current coverage focus:
- domain logic in memory mode
- API route contracts
- dashboard behavior with mocked `fetch`
- login and signup behavior with mocked auth calls
- theme provider, toggle, and bootstrap behavior
- shared auth validation schemas and field error mapping

Not covered yet:
- Prisma-backed integration tests
- browser E2E tests

## CI/CD And Repository Protection
- GitHub Actions validates pull requests with `CI`, `Dependency Review`, and `CodeQL`.
- Production deploy now happens only from Git tags `v*` through the `Deploy Production Tag` workflow.
- Dependabot is configured for weekly updates to `npm` dependencies and GitHub Actions.
- Vercel automatic Git deployments are disabled in `vercel.json`.
- Vercel remains the hosting platform, but production publication is controlled by GitHub Actions plus Vercel CLI.
- The protected integration branch is `master`.
- Recommended repository settings are to require PRs for `master`, require the `CI`, `Dependency Review`, and `CodeQL` checks, enable secret scanning and push protection, and keep Vercel Deployment Checks aligned with the required GitHub checks.

Operational details and follow-up recommendations live in `techspec/github-operations.md`.
Git workflow, branch naming, commits, and release conventions live in `techspec/git-conventions.md`.

## Database
The Prisma schema lives in `prisma/schema.prisma`.
The initial migration lives in `prisma/migrations/0001_init/migration.sql`.

## Documentation Notes
- `AGENTS.md` is the fast-start guide for AI agents.
- `techspec/techspec.md` is the central index for technical documentation.
- `techspec/architecture.md`, `techspec/scoreboard.md`, `techspec/auth.md`, `techspec/runtime-environments.md`, `techspec/api-contracts.md`, `techspec/testing-strategy.md`, `techspec/persistence-and-migrations.md`, `techspec/theme-system.md`, and `techspec/roadmap.md` split the living technical docs by domain.
