# Office 8 Ball

Internal pool scoreboard for `Frontend (Gui + Jean)` vs `Backend (Adair + Richard)`.

## Stack
- Next.js App Router
- Vercel for hosting
- Neon Postgres for persistence
- In-memory fallback when `DATABASE_URL` is not configured

## Local Development
1. Copy `.env.example` to `.env.local`.
2. Add `DATABASE_URL` when you are ready to connect Neon.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

If `DATABASE_URL` is missing, the app still works locally with temporary in-memory data.

## API
- `GET /api/scoreboard`
- `GET /api/matches`
- `POST /api/matches`

Example body:

```json
{
  "winnerTeamId": "frontend"
}
```

## Database
The SQL bootstrap lives in [db/schema.sql](/home/guiroos/Documentos/Projects/office-8-ball/db/schema.sql).

The app also ensures the schema on demand when running with Neon configured.
