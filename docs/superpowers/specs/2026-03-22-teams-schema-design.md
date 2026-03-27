# Spec: Teams Schema — Dynamic User-Created Teams

**Date:** 2026-03-22
**Scope:** Backend only (schema + API layer). Frontend is a separate phase.
**Approach:** Clean slate — existing `matches` and `teams` tables are dropped and recreated via migration. No retroactive data migration.

---

## Context

The current model has two fixed teams (`frontend` and `backend`) hardcoded in `constants.ts` and seeded into the database. Users have no relation to teams. This spec replaces that model with dynamic, user-created teams.

---

## Goals

- Allow any user to create a named team of exactly 2 players
- A user can belong to multiple teams simultaneously
- Matches register both sides (team A and team B) plus the winner, linking all 4 players to the match
- Teams can be archived (soft delete) by either member; archived teams cannot play new matches
- Historical match data is preserved when a team is archived

---

## Out of Scope (this phase)

- Frontend UI for team creation, management, or match registration
- Invite system (internal notifications or external invite links)
- 1v1 (singles) match format — noted as a future extension, schema accommodates it
- Retroactive migration of existing match records
- `/api/scoreboard` redesign — suspended for this phase (see Scoreboard Note)
- In-memory fallback for team and match operations (requires `DATABASE_URL`)
- Unarchiving teams — archiving is irreversible in this phase
- `WIN_MESSAGES` constant removal from the frontend — handled in the frontend phase; this phase removes it from `constants.ts` only

---

## Schema

### Enum

```prisma
enum TeamStatus {
  active
  archived
}
```

Enum values are lowercase — consistent with the Prisma + PostgreSQL convention used in this project.

### Team

```prisma
model Team {
  id        String     @id @default(cuid()) @db.Text
  name      String     @unique @db.Text
  status    TeamStatus @default(active)
  createdBy String     @map("created_by") @db.Text
  createdAt DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  creator    User         @relation("TeamCreator", fields: [createdBy], references: [id])
  members    TeamMember[] @relation("TeamMembers")
  matchesAsA Match[]      @relation("MatchTeamA")
  matchesAsB Match[]      @relation("MatchTeamB")
  matchWins  Match[]      @relation("MatchWinner")

  @@map("teams")
}
```

### TeamMember

```prisma
model TeamMember {
  teamId   String   @map("team_id") @db.Text
  userId   String   @map("user_id") @db.Text
  joinedAt DateTime @default(now()) @map("joined_at") @db.Timestamptz(6)

  // "TeamMembers" covers list-members-of-team; "UserTeams" covers list-teams-of-user
  team     Team     @relation("TeamMembers", fields: [teamId], references: [id])
  user     User     @relation("UserTeams", fields: [userId], references: [id])

  @@id([teamId, userId])
  @@index([teamId])
  @@index([userId])
  @@map("team_members")
}
```

Note: `@@id([teamId, userId])` prevents duplicate membership. The standalone `@@index([teamId])` covers "list members of a team" queries; `@@index([userId])` covers "list all teams a user belongs to."

### Match (updated)

```prisma
model Match {
  id           String   @id @default(cuid()) @db.Text
  teamAId      String   @map("team_a_id") @db.Text
  teamBId      String   @map("team_b_id") @db.Text
  winnerTeamId String   @map("winner_team_id") @db.Text
  playedAt     DateTime @default(now()) @map("played_at") @db.Timestamptz(6)
  note         String?  @db.Text

  teamA        Team     @relation("MatchTeamA", fields: [teamAId], references: [id])
  teamB        Team     @relation("MatchTeamB", fields: [teamBId], references: [id])
  winnerTeam   Team     @relation("MatchWinner", fields: [winnerTeamId], references: [id])

  @@index([teamAId])
  @@index([teamBId])
  @@index([winnerTeamId])
  @@map("matches")
}
```

**DB-level CHECK constraints (via raw migration SQL):** PostgreSQL supports `CHECK (winner_team_id IN (team_a_id, team_b_id))` and `CHECK (team_a_id <> team_b_id)`. Prisma does not emit these automatically; they must be appended to the migration `.sql` file after `prisma migrate dev --create-only`. Implementation must add both.

### User (complete updated model)

```prisma
model User {
  id           String   @id @default(cuid()) @db.Text
  username     String   @unique @db.Text
  passwordHash String   @map("password_hash") @db.Text
  email        String?  @unique @db.Text
  displayName  String?  @map("display_name") @db.Text
  avatarUrl    String?  @map("avatar_url") @db.Text
  bio          String?  @db.Text
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  teamsCreated Team[]       @relation("TeamCreator")
  teams        TeamMember[] @relation("UserTeams")

  @@map("users")
}
```

---

## Business Rules

### Enforcement layers

Rules marked **[DB]** are enforced by DB constraints (FK, unique, CHECK). Rules marked **[API]** are enforced by route handlers + Zod only — raw DB access bypasses them. Acceptable for a private internal app.

### Team creation

- **[DB]** `name` is globally unique (`@unique`); DB rejects duplicates with Prisma error `P2002` → route maps this to `400 Bad Request` (name taken)
- **[API]** `name` is normalized before insert: trimmed + lowercased — "Alpha" and "alpha" resolve to the same name; the unique constraint handles any race condition via `P2002`
- **[API]** `name` max 50 characters — `400 Bad Request` if exceeded
- **[API]** Team creation always auto-inserts the creator as the first member
- **[API]** `duo` teams may be created with only the creator and completed later via the invite-member flow
- **[API]** If `secondMemberUserId` is provided for a `duo`, it must refer to an existing user — API pre-validates existence and returns `404 Not Found` before insert; do not rely on FK violation for this error
- **[API]** If `secondMemberUserId` is provided for a `duo`, it cannot point to the creator (`createdBy !== secondMemberUserId`) — `400 Bad Request`
- **[API]** No limit on how many teams a user can belong to
- **[API]** `createdBy` is attribution only — confers no extra permissions; both members have equal rights
- Default status: `active`; IDs generated via `cuid()`
- **[API]** The schema itself does not prevent additional `TeamMember` rows

### Team archiving

- **[API]** Either member can archive the team — `createdBy` confers no special archiving right (both accepted membership, both can dissolve)
- **[API]** Authorization check runs **first**, before idempotency: if the requester is not a member, return `403 Forbidden` regardless of team status
- **[API]** If the requester is a member and the team is already archived, return `200 OK` with current state (idempotent)
- **[API]** Archiving is **irreversible** in this phase — no unarchive endpoint
- **[DB]** Match history of archived teams is preserved (FK references remain valid)
- **[API]** Archived teams cannot register new matches — checked at match creation time

### Match registration

- **[DB + migration CHECK]** `teamAId !== teamBId`
- **[DB + migration CHECK]** `winnerTeamId IN (teamAId, teamBId)`
- **[API]** Both teams must have `status: active` — `422 Unprocessable Entity` otherwise
- **[API]** The user registering the match must be a member of at least one of the two teams — `403 Forbidden` otherwise
- **[API]** `note` is optional; maximum 140 characters enforced by Zod — `400 Bad Request` if exceeded
- `note` max-length is API-layer only (no DB column constraint)

### Derived value (never stored)

```ts
loserTeamId = match.teamAId === match.winnerTeamId ? match.teamBId : match.teamAId
```

Computed in route handlers and included in API responses. Never persisted.

---

## In-Memory Fallback

The existing in-memory fallback in `src/lib/data.ts` is built around `TEAMS` and the static `TeamId` type. With dynamic teams:

- **Team and match operations require `DATABASE_URL`** — no in-memory equivalent
- The fallback mode remains valid for auth and profile features (no team dependency)
- Revisit when scoreboard is redesigned

---

## Scoreboard Note

`GET /api/scoreboard` derives its output from `Match.winnerTeamId` and the static `TEAMS` constant. With N dynamic teams, the scoreboard must be redesigned (per-team stats, global leaderboard). Deferred to a future phase. During this phase, the endpoint returns `503 Service Unavailable`.

---

## What Changes vs Current Model

| Element | Before | After |
|---|---|---|
| `Team` | Static, seeded, 2 fixed records | Dynamic, user-created |
| `Match.winnerTeamId` | FK to fixed team | FK to dynamic team |
| `Match` FKs | 1 team FK | 3 team FKs (`teamAId`, `teamBId`, `winnerTeamId`) |
| `User` | No team relation | Creator of N teams; member of N teams via `TeamMember` |
| `constants.ts` TEAMS | Source of truth | Removed (this phase) |
| `constants.ts` WIN_MESSAGES | Active | Removed from constants (this phase); frontend cleanup deferred |
| `TeamId` type | `"frontend" \| "backend"` | Generic `string` (cuid) |
| Seed | Seeds frontend/backend teams | No team seed |
| `/api/scoreboard` | Active | Suspended — returns `503` |
| In-memory fallback (teams/matches) | Covers static teams | Requires `DATABASE_URL` |

---

## API Surface (backend phase)

### New endpoints

#### `POST /api/teams`
Create a team.
- **Body:** `{ name: string, type: "solo" | "duo", secondMemberUserId?: string }`
- **Success:** `201 Created` — `{ team: { id, name, status, createdBy, createdAt, updatedAt, members: [{ userId, joinedAt }] } }`
- **Errors:** `400` (validation / self-team / name taken via P2002), `401`, `404` (secondMemberUserId not found when provided)

#### `GET /api/teams`
List teams the authenticated user belongs to.
- **Query:** `?includeArchived=true` to include archived teams (default: active only)
- **Scope:** Only teams the current user is a member of
- **Success:** `200 OK` — `{ teams: [{ id, name, status, createdBy, createdAt, updatedAt, members: [{ userId, joinedAt }] }] }`

#### `GET /api/teams/:id`
Get team details. Restricted to team members.
- **Authorization:** `req.user.id` must be a member of the team — `403 Forbidden` for non-members (prevents enumeration)
- **Success:** `200 OK` — `{ team: { id, name, status, createdBy, createdAt, updatedAt, members: [{ userId, joinedAt }] } }`
- **Errors:** `401`, `403` (not a member), `404` (team not found)
- Member objects include `userId` only — clients resolve usernames via `GET /api/users?username=...`

#### `PATCH /api/teams/:id/archive`
Archive a team (irreversible).
- **Authorization order:** (1) check membership first — `403` if not a member; (2) if member and already archived, return `200` idempotently
- **Success:** `200 OK` — `{ team: { id, name, status, updatedAt } }`
- **Errors:** `401`, `403` (not a member), `404` (team not found)

#### `GET /api/users?username=...`
Resolve a username to a userId. Required for team creation to supply `secondMemberUserId`.
- **Authorization:** Any authenticated user can look up any other user by username
- **Response:** `200 OK` — `{ user: { id, username, displayName, avatarUrl } }` (no sensitive fields: no email, passwordHash, bio)
- **Errors:** `401`, `404`
- Note: this is a temporary placement in the user domain; a proper user search API may supersede it in a future phase

### Updated endpoints

#### `POST /api/matches`
- **Body:** `{ teamAId: string, teamBId: string, winnerTeamId: string, note?: string }`
- **Success:** `201 Created` — `{ match: { id, teamAId, teamBId, winnerTeamId, loserTeamId, playedAt, note } }` (`loserTeamId` is derived in the handler)
- **Errors:** `400` (validation), `401`, `403` (not a member of either team), `422` (team archived or teams identical)

#### `GET /api/matches`
- **Scope:** All matches where any of the authenticated user's teams participated (not global)
- **Sort:** `playedAt` descending
- **Success:** `200 OK` — `{ matches: [{ id, teamAId, teamBId, winnerTeamId, loserTeamId, playedAt, note }] }`
- `loserTeamId` is derived in the handler, never stored

### Suspended endpoints

| Method | Route | Reason |
|---|---|---|
| `GET` | `/api/scoreboard` | Redesign deferred — returns `503` |

All routes require an authenticated session.

---

## Future Extensions (not in scope now)

- **Scoreboard redesign:** Per-team and per-player win stats, global leaderboard
- **1v1 format:** Schema accommodates it — enforce member count at application layer
- **Invite system:** Pending membership state in `TeamMember` (e.g., `status: pending | accepted`)
- **`/times` page:** Functional team listing UI — depends on this backend being stable
- **Unarchiving teams:** Reversible archiving with audit trail
- **In-memory fallback for teams:** Revisit when scoreboard is redesigned
- **User search API:** Replace `GET /api/users?username=...` with a proper user discovery endpoint
- **DB CHECK constraints via migration:** `winner_team_id IN (team_a_id, team_b_id)` and `team_a_id <> team_b_id` — add to raw migration SQL
