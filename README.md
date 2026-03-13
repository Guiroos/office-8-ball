# Office 8 Ball

Internal pool scoreboard for `Frontend (Gui + Jean)` vs `Backend (Adair + Richard)`.

## Current Status
- `v1` is implemented as a single-screen Next.js app.
- Persistence supports two modes:
  - `Prisma + Neon/Postgres` when `DATABASE_URL` is configured
  - in-memory fallback for local development when `DATABASE_URL` is missing
- Implemented APIs:
  - `GET /api/scoreboard`
  - `GET /api/matches`
  - `POST /api/matches`
- Current UI supports one-click winner registration and recent history display.
- The API already supports optional `note`, but the current UI does not expose note entry yet.
- Local validation currently passes:
  - `npm run test`
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- An automated test suite is now configured with `Vitest` + Testing Library.

## Stack
- Next.js App Router
- Vercel for hosting
- Neon Postgres for persistence
- Prisma ORM for database access
- In-memory fallback when `DATABASE_URL` is not configured
- Vitest + Testing Library for unit and integration tests

## Local Development
1. Copy `.env.example` to `.env.local`.
2. Add `DATABASE_URL` when you are ready to connect Neon.
3. Run `npm run dev`.
4. Run `npm run test` to verify the local test suite.
5. Open `http://localhost:3000`.

If `DATABASE_URL` is missing, the app still works locally with temporary in-memory data.

When `DATABASE_URL` is configured, apply the Prisma migration before first use:

```bash
npm run prisma:deploy
npm run prisma:seed
```

## API
- `GET /api/scoreboard`
- `GET /api/matches`
- `POST /api/matches`

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

Current coverage focus:
- domain logic in memory mode
- API route contracts
- dashboard behavior with mocked `fetch`

Not covered yet:
- Prisma-backed integration tests
- browser E2E tests

## Database
The Prisma schema lives in `prisma/schema.prisma`.
The initial migration lives in `prisma/migrations/0001_init/migration.sql`.

## Documentation Notes
- `AGENTS.md` is the fast-start guide for AI agents.
- `DEV.md` records technical decisions and changes that happened during implementation.
- `ROADMAP.md` tracks planned phases and marks what is already done versus still future work.
