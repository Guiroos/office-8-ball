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

## Stack
- Next.js App Router
- Vercel for hosting
- Neon Postgres for persistence
- Prisma ORM for database access
- In-memory fallback when `DATABASE_URL` is not configured

## Local Development
1. Copy `.env.example` to `.env.local`.
2. Add `DATABASE_URL` when you are ready to connect Neon.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

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

## Database
The Prisma schema lives in [prisma/schema.prisma](/Users/guiroos/Documents/projects/office-8-ball/prisma/schema.prisma).
The initial migration lives in [prisma/migrations/0001_init/migration.sql](/Users/guiroos/Documents/projects/office-8-ball/prisma/migrations/0001_init/migration.sql).

## Documentation Notes
- [AGENTS.md](/Users/guiroos/Documents/projects/office-8-ball/AGENTS.md) is the fast-start guide for AI agents.
- [DEV.md](/Users/guiroos/Documents/projects/office-8-ball/DEV.md) records technical decisions and changes that happened during implementation.
- [ROADMAP.md](/Users/guiroos/Documents/projects/office-8-ball/ROADMAP.md) tracks planned phases and now marks what is already done.
