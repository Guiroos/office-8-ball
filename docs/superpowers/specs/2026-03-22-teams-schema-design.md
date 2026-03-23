# Spec: Teams Schema — Dynamic User-Created Teams

**Date:** 2026-03-22
**Scope:** Backend only (schema + API layer). Frontend is a separate phase.
**Approach:** Clean slate — no retroactive migration of existing match history.

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

---

## Schema

### Enum

```prisma
enum TeamStatus {
  active
  archived
}
```

### Team

```prisma
model Team {
  id        String     @id @db.Text
  name      String     @unique @db.Text
  status    TeamStatus @default(active)
  createdBy String     @map("created_by") @db.Text
  createdAt DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  creator    User         @relation("TeamCreator", fields: [createdBy], references: [id])
  members    TeamMember[]
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

  team     Team     @relation(fields: [teamId], references: [id])
  user     User     @relation(fields: [userId], references: [id])

  @@id([teamId, userId])
  @@index([userId])
  @@map("team_members")
}
```

### Match (updated)

```prisma
model Match {
  id           String   @id @db.Text
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

### User (additions)

```prisma
// Add to existing User model:
teamsCreated TeamMember[] @relation("TeamCreator")
teams        TeamMember[]
```

---

## Business Rules

### Team creation

- Exactly 2 members: creator (auto-inserted as member) + one other user specified at creation time
- A user cannot create a team with themselves (`createdBy !== secondMemberId`)
- No limit on how many teams a user can belong to
- `name` is globally unique across all teams
- `createdBy` is attribution only — confers no extra permissions
- Default status: `active`

### Team archiving

- Either member can archive the team (`status → archived`)
- Archived teams cannot be used in new matches
- Match history of archived teams is preserved

### Match registration

- Requires two distinct teams: `teamAId !== teamBId`
- Both teams must have `status: active`
- `winnerTeamId` must equal `teamAId` or `teamBId`
- The user registering the match must be a member of at least one of the two teams

### Derived value (never stored)

- Loser team is always calculated: `loserTeamId = teamAId === winnerTeamId ? teamBId : teamAId`

---

## What Changes vs Current Model

| Element | Before | After |
|---|---|---|
| `Team` | Static, seeded, 2 fixed records | Dynamic, user-created |
| `Match.winnerTeamId` | FK to fixed team | FK to dynamic team |
| `Match` FKs | 1 team FK | 3 team FKs (`teamAId`, `teamBId`, `winnerTeamId`) |
| `User` | No team relation | Member of N teams via `TeamMember` |
| `constants.ts` TEAMS | Source of truth | Removed |
| `TeamId` type | `"frontend" \| "backend"` | Generic `string` (UUID) |
| Seed | Seeds frontend/backend teams | No team seed (teams created by users) |

---

## API Surface (backend phase)

Endpoints to implement:

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/teams` | Create a team (name + second member userId) |
| `GET` | `/api/teams` | List teams the authenticated user belongs to |
| `GET` | `/api/teams/:id` | Get team details + members |
| `PATCH` | `/api/teams/:id/archive` | Archive a team (member only) |
| `POST` | `/api/matches` | Register a match (updated: teamAId, teamBId, winnerTeamId) |

All routes require an authenticated session.

---

## Future Extensions (not in scope now)

- **1v1 format:** Schema already accommodates it — `TeamMember` supports 1 or 2 members; enforce size at application layer
- **Invite system:** Pending membership state in `TeamMember` (e.g., `status: pending | accepted`)
- **`/times` page:** Functional team listing UI, depends on this backend being stable
