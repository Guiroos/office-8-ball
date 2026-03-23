# Teams Schema — Dynamic User-Created Teams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two fixed static teams (frontend/backend) with dynamic user-created teams of two players, backed by a new Prisma schema and a complete set of backend API routes.

**Architecture:** A new `TeamMember` join table connects `User` to `Team` (many-to-many). `Match` gains `teamAId` and `teamBId` in addition to `winnerTeamId`. All team operations require `DATABASE_URL` — no in-memory fallback for the team domain. The scoreboard endpoint is suspended (returns 503) until a redesign covers dynamic teams.

**Tech Stack:** Next.js 16 App Router · Prisma 6 · PostgreSQL · TypeScript · Zod 4 · Vitest 4

**Spec:** `docs/superpowers/specs/2026-03-22-teams-schema-design.md`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `prisma/schema.prisma` | Add `TeamStatus` enum, `TeamMember` model; update `Team`, `Match`, `User` |
| Modify | `prisma/seed.mjs` | Remove static team seed |
| Modify | `src/lib/constants.ts` | Remove `TEAMS`, `WIN_MESSAGES` |
| Modify | `src/lib/types.ts` | Remove `TeamId`, update `MatchRecord`, add `TeamRecord`, `TeamMemberRecord`, new response types |
| Modify | `src/lib/data.ts` | Rewrite: remove static team logic, new `listMatches(userId)` and `createMatch()` signatures |
| Create | `src/lib/data.test.ts` | Unit tests for `listMatches` and `createMatch` |
| Create | `src/lib/teams.ts` | Team data layer: `createTeam`, `listUserTeams`, `getTeamById`, `archiveTeam`, `isTeamMember`, `findUserById`, `findUserByUsername` |
| Modify | `src/app/api/scoreboard/route.ts` | Return `503 Service Unavailable` |
| Modify | `src/app/api/scoreboard/route.test.ts` | Update to expect 503 |
| Create | `src/app/api/teams/route.ts` | `POST /api/teams`, `GET /api/teams` |
| Create | `src/app/api/teams/route.test.ts` | Tests for POST + GET teams |
| Create | `src/app/api/teams/[id]/route.ts` | `GET /api/teams/:id` |
| Create | `src/app/api/teams/[id]/route.test.ts` | Tests for GET team by ID |
| Create | `src/app/api/teams/[id]/archive/route.ts` | `PATCH /api/teams/:id/archive` |
| Create | `src/app/api/teams/[id]/archive/route.test.ts` | Tests for archive |
| Create | `src/app/api/users/route.ts` | `GET /api/users?username=...` |
| Create | `src/app/api/users/route.test.ts` | Tests for user lookup |
| Modify | `src/app/api/matches/route.ts` | New body shape + member/status validation |
| Modify | `src/app/api/matches/route.test.ts` | Rewrite for new contract |

---

## Task 1: Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.mjs`

- [ ] **Step 1: Update `prisma/schema.prisma`**

Replace the entire file content with:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TeamStatus {
  active
  archived
}

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

model TeamMember {
  teamId   String   @map("team_id") @db.Text
  userId   String   @map("user_id") @db.Text
  joinedAt DateTime @default(now()) @map("joined_at") @db.Timestamptz(6)

  team     Team     @relation("TeamMembers", fields: [teamId], references: [id])
  user     User     @relation("UserTeams", fields: [userId], references: [id])

  @@id([teamId, userId])
  @@index([teamId])
  @@index([userId])
  @@map("team_members")
}

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

model AuthRateLimit {
  id              String    @id @db.Text
  action          String    @db.Text
  username        String    @db.Text
  ip              String    @db.Text
  failCount       Int       @default(0) @map("fail_count")
  blockLevel      Int       @default(0) @map("block_level")
  windowStartedAt DateTime  @map("window_started_at") @db.Timestamptz(6)
  blockedUntil    DateTime? @map("blocked_until") @db.Timestamptz(6)
  lastFailedAt    DateTime? @map("last_failed_at") @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([action, username])
  @@map("auth_rate_limits")
}
```

- [ ] **Step 2: Create the migration with `--create-only` to allow manual CHECK constraints**

```bash
npx prisma migrate dev --name dynamic-teams --create-only
```

Expected: a new migration file appears in `prisma/migrations/`.

- [ ] **Step 3: Add CHECK constraints to the migration SQL**

Open the generated migration file at `prisma/migrations/<timestamp>_dynamic-teams/migration.sql` and append these two lines before the final semicolons or at the end:

```sql
ALTER TABLE "matches" ADD CONSTRAINT "matches_teams_different" CHECK (team_a_id <> team_b_id);
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_is_participant" CHECK (winner_team_id IN (team_a_id, team_b_id));
```

- [ ] **Step 4: Apply the migration**

```bash
npx prisma migrate dev
```

Expected: migration applied successfully, no errors.

- [ ] **Step 5: Verify Prisma client was regenerated**

```bash
npm run prisma:generate
```

Expected: client regenerated without errors.

- [ ] **Step 6: Update `prisma/seed.mjs` — remove static team seed**

Replace the entire file with:

```js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: nothing to seed. Teams are created by users at runtime.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/seed.mjs prisma/migrations/
git commit -m "feat: schema de times dinâmicos com TeamMember e Match atualizado"
```

---

## Task 2: Update Types and Remove Static Constants

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Replace `src/lib/constants.ts`**

The `TEAMS` and `WIN_MESSAGES` constants depend on fixed team IDs and are no longer valid. Remove them entirely. If the file has nothing else, replace with:

```ts
// Static team constants removed — teams are now dynamic and user-created.
// See: docs/superpowers/specs/2026-03-22-teams-schema-design.md
```

- [ ] **Step 2: Replace `src/lib/types.ts`**

```ts
// Team domain

export type TeamStatus = "active" | "archived";

export type TeamMemberRecord = {
  userId: string;
  joinedAt: string;
};

export type TeamRecord = {
  id: string;
  name: string;
  status: TeamStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberRecord[];
};

// Match domain

export type MatchRecord = {
  id: string;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string;
  loserTeamId: string;
  playedAt: string;
  note: string | null;
};

// API responses

export type TeamResponse = {
  team: TeamRecord;
};

export type TeamsResponse = {
  teams: TeamRecord[];
};

export type MatchesResponse = {
  matches: MatchRecord[];
};

export type CreateMatchResponse = {
  match: MatchRecord;
};

export type UserLookupResponse = {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export type SessionUser = {
  id: string;
  username: string;
};

export type RegisterUserResponse = {
  user: SessionUser;
};

export type ApiErrorResponse = {
  error: string;
  fieldErrors?: Partial<Record<"username" | "email" | "password", string>>;
  retryAfterSeconds?: number;
};

export type ProfileResponse = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};
```

- [ ] **Step 3: Run typecheck to surface all broken references**

```bash
npm run typecheck
```

Expected: errors in `src/lib/data.ts`, `src/app/api/matches/route.ts`, `src/app/api/scoreboard/route.ts`. These will be fixed in subsequent tasks. If there are unexpected failures in unrelated files, investigate before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants.ts src/lib/types.ts
git commit -m "feat: atualizar types e remover constantes de times fixos"
```

---

## Task 3: Suspend Scoreboard Route

**Files:**
- Modify: `src/app/api/scoreboard/route.ts`
- Modify: `src/app/api/scoreboard/route.test.ts`

- [ ] **Step 1: Write the failing test first**

Replace `src/app/api/scoreboard/route.test.ts` with:

```ts
import { describe, expect, it } from "vitest";

describe("/api/scoreboard", () => {
  it("returns 503 while scoreboard is suspended", async () => {
    const { GET } = await import("@/app/api/scoreboard/route");
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npm run test -- src/app/api/scoreboard/route.test.ts
```

Expected: FAIL — current implementation returns 200.

- [ ] **Step 3: Replace `src/app/api/scoreboard/route.ts`**

```ts
import { NextResponse } from "next/server";

import type { ApiErrorResponse } from "@/lib/types";

export async function GET() {
  return NextResponse.json<ApiErrorResponse>(
    {
      error:
        "O placar está temporariamente indisponível enquanto o sistema de times é atualizado.",
    },
    { status: 503 },
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test -- src/app/api/scoreboard/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/scoreboard/route.ts src/app/api/scoreboard/route.test.ts
git commit -m "feat: suspender /api/scoreboard enquanto placar dinâmico nao esta implementado"
```

---

## Task 4: Rewrite `src/lib/data.ts`

**Files:**
- Modify: `src/lib/data.ts`

There is no longer an in-memory fallback for matches (no `DATABASE_URL` → empty list). `listMatches` is now scoped to the authenticated user's teams. `createMatch` takes the new three-team-ID shape. `getScoreboard` is removed.

- [ ] **Step 1: Write failing tests first**

Create `src/lib/data.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    teamMember: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    match: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

describe("data.ts", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindMany.mockReset();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe("listMatches", () => {
    it("returns empty array when DATABASE_URL is not set", async () => {
      delete process.env.DATABASE_URL;
      const { listMatches } = await import("@/lib/data");
      const result = await listMatches("user-abc");
      expect(result).toEqual([]);
      expect(mockFindMany).not.toHaveBeenCalled();
    });

    it("returns empty array when user has no team memberships", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      mockFindMany.mockResolvedValueOnce([]); // teamMember.findMany returns no memberships

      const { listMatches } = await import("@/lib/data");
      const result = await listMatches("user-abc");
      expect(result).toEqual([]);
    });

    it("derives loserTeamId from teamAId/teamBId/winnerTeamId", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      // First call: teamMember.findMany
      mockFindMany.mockResolvedValueOnce([{ teamId: "team-a" }]);
      // Second call: match.findMany
      mockFindMany.mockResolvedValueOnce([
        {
          id: "match-1",
          teamAId: "team-a",
          teamBId: "team-b",
          winnerTeamId: "team-a",
          playedAt: new Date("2026-03-22T10:00:00.000Z"),
          note: null,
        },
      ]);

      const { listMatches } = await import("@/lib/data");
      const result = await listMatches("user-abc");
      expect(result[0].loserTeamId).toBe("team-b");
    });
  });

  describe("createMatch", () => {
    it("returns the created match with derived loserTeamId", async () => {
      process.env.DATABASE_URL = "postgresql://test";
      mockFindMany.mockResolvedValueOnce({
        id: "match-1",
        teamAId: "team-a",
        teamBId: "team-b",
        winnerTeamId: "team-b",
        playedAt: new Date("2026-03-22T10:00:00.000Z"),
        note: null,
      });

      const { createMatch } = await import("@/lib/data");
      const result = await createMatch({
        teamAId: "team-a",
        teamBId: "team-b",
        winnerTeamId: "team-b",
      });
      expect(result.match.loserTeamId).toBe("team-a");
    });
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
npm run test -- src/lib/data.test.ts
```

Expected: FAIL — `@/lib/data` still has the old implementation.

- [ ] **Step 3: Replace `src/lib/data.ts` entirely**

```ts
import { prisma } from "@/lib/prisma";
import type { CreateMatchResponse, MatchRecord } from "@/lib/types";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function normalizeMatch(row: {
  id: string;
  teamAId: string;
  teamBId: string;
  winnerTeamId: string;
  playedAt: Date;
  note: string | null;
}): MatchRecord {
  return {
    id: row.id,
    teamAId: row.teamAId,
    teamBId: row.teamBId,
    winnerTeamId: row.winnerTeamId,
    loserTeamId:
      row.teamAId === row.winnerTeamId ? row.teamBId : row.teamAId,
    playedAt: row.playedAt.toISOString(),
    note: row.note,
  };
}

export async function listMatches(userId: string): Promise<MatchRecord[]> {
  if (!hasDatabaseUrl()) return [];

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const teamIds = memberships.map((m) => m.teamId);

  if (teamIds.length === 0) return [];

  const rows = await prisma.match.findMany({
    where: {
      OR: [{ teamAId: { in: teamIds } }, { teamBId: { in: teamIds } }],
    },
    orderBy: { playedAt: "desc" },
  });

  return rows.map(normalizeMatch);
}

export async function createMatch(input: {
  teamAId: string;
  teamBId: string;
  winnerTeamId: string;
  note?: string;
}): Promise<CreateMatchResponse> {
  const row = await prisma.match.create({
    data: {
      teamAId: input.teamAId,
      teamBId: input.teamBId,
      winnerTeamId: input.winnerTeamId,
      note: input.note?.trim() || null,
    },
  });

  return { match: normalizeMatch(row) };
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm run test -- src/lib/data.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run typecheck**

```bash
npm run typecheck
```

Expected: errors only in `src/app/api/matches/route.ts` (fixed in Task 10). If errors appear in other files, fix them now.

- [ ] **Step 6: Commit**

```bash
git add src/lib/data.ts src/lib/data.test.ts
git commit -m "feat: reescrever data.ts para suportar times dinamicos"
```

---

## Task 5: Team Data Layer (`src/lib/teams.ts`)

**Files:**
- Create: `src/lib/teams.ts`

This module is the single point of access for all team DB operations. Route handlers call these functions and mock them in tests.

- [ ] **Step 1: Create `src/lib/teams.ts`**

```ts
import { prisma } from "@/lib/prisma";
import type { TeamRecord } from "@/lib/types";

function normalizeTeam(team: {
  id: string;
  name: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: { userId: string; joinedAt: Date }[];
}): TeamRecord {
  return {
    id: team.id,
    name: team.name,
    status: team.status as "active" | "archived",
    createdBy: team.createdBy,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    members: team.members.map((m) => ({
      userId: m.userId,
      joinedAt: m.joinedAt.toISOString(),
    })),
  };
}

export async function isTeamMember(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return Boolean(member);
}

export async function createTeam(input: {
  name: string;
  createdBy: string;
  secondMemberUserId: string;
}): Promise<TeamRecord> {
  const team = await prisma.team.create({
    data: {
      name: input.name.trim().toLowerCase(),
      createdBy: input.createdBy,
      members: {
        create: [
          { userId: input.createdBy },
          { userId: input.secondMemberUserId },
        ],
      },
    },
    include: { members: true },
  });

  return normalizeTeam(team);
}

export async function listUserTeams(
  userId: string,
  includeArchived = false,
): Promise<TeamRecord[]> {
  const memberships = await prisma.teamMember.findMany({
    where: {
      userId,
      ...(includeArchived ? {} : { team: { status: "active" } }),
    },
    include: { team: { include: { members: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => normalizeTeam(m.team));
}

export async function getTeamById(teamId: string): Promise<TeamRecord | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) return null;

  return normalizeTeam(team);
}

export async function archiveTeam(teamId: string): Promise<TeamRecord> {
  const team = await prisma.team.update({
    where: { id: teamId },
    data: { status: "archived" },
    include: { members: true },
  });

  return normalizeTeam(team);
}

export async function findUserByUsername(
  username: string,
): Promise<{ id: string; username: string; displayName: string | null; avatarUrl: string | null } | null> {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  });
}

export async function findUserById(
  userId: string,
): Promise<{ id: string } | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/teams.ts
git commit -m "feat: adicionar camada de dados de times (teams.ts)"
```

---

## Task 6: `POST /api/teams` and `GET /api/teams`

**Files:**
- Create: `src/app/api/teams/route.ts`
- Create: `src/app/api/teams/route.test.ts`

**Test setup pattern:** Mock `@/lib/auth` and `@/lib/teams`. Set `DATABASE_URL` so routes don't return 503.

- [ ] **Step 1: Write failing tests**

Create `src/app/api/teams/route.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let currentUser: { id: string; username: string } | null = {
  id: "user-abc",
  username: "gui.dev",
};

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});

const mockCreateTeam = vi.fn();
const mockListUserTeams = vi.fn();
const mockFindUserByUsername = vi.fn();
const mockFindUserById = vi.fn();

vi.mock("@/lib/teams", () => ({
  createTeam: (...args: unknown[]) => mockCreateTeam(...args),
  listUserTeams: (...args: unknown[]) => mockListUserTeams(...args),
  findUserByUsername: (...args: unknown[]) => mockFindUserByUsername(...args),
  findUserById: (...args: unknown[]) => mockFindUserById(...args),
}));

describe("/api/teams", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockCreateTeam.mockReset();
    mockListUserTeams.mockReset();
    mockFindUserByUsername.mockReset();
    mockFindUserById.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe("GET", () => {
    it("returns the authenticated user's teams", async () => {
      const fakeTeam = {
        id: "team-1",
        name: "encacapados",
        status: "active",
        createdBy: "user-abc",
        createdAt: "2026-03-22T00:00:00.000Z",
        updatedAt: "2026-03-22T00:00:00.000Z",
        members: [{ userId: "user-abc", joinedAt: "2026-03-22T00:00:00.000Z" }],
      };
      mockListUserTeams.mockResolvedValue([fakeTeam]);

      const { GET } = await import("@/app/api/teams/route");
      const response = await GET(new Request("http://localhost/api/teams"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.teams).toHaveLength(1);
      expect(body.teams[0].name).toBe("encacapados");
    });

    it("passes includeArchived param when query string is set", async () => {
      mockListUserTeams.mockResolvedValue([]);

      const { GET } = await import("@/app/api/teams/route");
      await GET(new Request("http://localhost/api/teams?includeArchived=true"));

      expect(mockListUserTeams).toHaveBeenCalledWith("user-abc", true);
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { GET } = await import("@/app/api/teams/route");
      const response = await GET(new Request("http://localhost/api/teams"));
      expect(response.status).toBe(401);
    });
  });

  describe("POST", () => {
    it("creates a team and returns 201", async () => {
      mockFindUserById.mockResolvedValue({ id: "user-xyz" });
      const fakeTeam = {
        id: "team-1",
        name: "encacapados",
        status: "active",
        createdBy: "user-abc",
        createdAt: "2026-03-22T00:00:00.000Z",
        updatedAt: "2026-03-22T00:00:00.000Z",
        members: [
          { userId: "user-abc", joinedAt: "2026-03-22T00:00:00.000Z" },
          { userId: "user-xyz", joinedAt: "2026-03-22T00:00:00.000Z" },
        ],
      };
      mockCreateTeam.mockResolvedValue(fakeTeam);

      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Encaçapados", secondMemberUserId: "user-xyz" }),
        }),
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.team.name).toBe("encacapados");
    });

    it("returns 404 when secondMemberUserId does not exist", async () => {
      mockFindUserById.mockResolvedValue(null);

      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test", secondMemberUserId: "user-ghost" }),
        }),
      );

      expect(response.status).toBe(404);
    });

    it("returns 400 when user tries to create a team with themselves", async () => {
      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Solo", secondMemberUserId: "user-abc" }),
        }),
      );

      expect(response.status).toBe(400);
    });

    it("returns 400 when name is missing", async () => {
      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secondMemberUserId: "user-xyz" }),
        }),
      );

      expect(response.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { POST } = await import("@/app/api/teams/route");
      const response = await POST(
        new Request("http://localhost/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test", secondMemberUserId: "user-xyz" }),
        }),
      );
      expect(response.status).toBe(401);
    });
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
npm run test -- src/app/api/teams/route.test.ts
```

Expected: FAIL — route file does not exist.

- [ ] **Step 3: Create `src/app/api/teams/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { createTeam, listUserTeams, findUserById } from "@/lib/teams";
import type { ApiErrorResponse, TeamsResponse, TeamResponse } from "@/lib/types";

const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório.")
    .max(50, "Nome pode ter no máximo 50 caracteres.")
    .transform((v) => v.trim().toLowerCase()),
  secondMemberUserId: z.string().min(1, "secondMemberUserId é obrigatório."),
});

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const url = new URL(request.url);
  const includeArchived = url.searchParams.get("includeArchived") === "true";

  const teams = await listUserTeams(user.id, includeArchived);

  return NextResponse.json<TeamsResponse>({ teams });
}

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const payload = await request.json().catch(() => null);
  const result = createTeamSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json<ApiErrorResponse>(
      { error: result.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { name, secondMemberUserId } = result.data;

  if (secondMemberUserId === user.id) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Você não pode criar um time com você mesmo." },
      { status: 400 },
    );
  }

  const secondMember = await findUserById(secondMemberUserId);

  if (!secondMember) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Usuário não encontrado." },
      { status: 404 },
    );
  }

  try {
    const team = await createTeam({
      name,
      createdBy: user.id,
      secondMemberUserId,
    });

    return NextResponse.json<TeamResponse>({ team }, { status: 201 });
  } catch (err: unknown) {
    // Prisma unique constraint violation (P2002) — name already taken
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Já existe um time com esse nome." },
        { status: 400 },
      );
    }
    throw err;
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- src/app/api/teams/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/teams/route.ts src/app/api/teams/route.test.ts
git commit -m "feat: adicionar rotas POST e GET /api/teams"
```

---

## Task 7: `GET /api/teams/:id`

**Files:**
- Create: `src/app/api/teams/[id]/route.ts`
- Create: `src/app/api/teams/[id]/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/api/teams/[id]/route.test.ts`:

```ts
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

let currentUser: { id: string; username: string } | null = {
  id: "user-abc",
  username: "gui.dev",
};

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});

const mockGetTeamById = vi.fn();
const mockIsTeamMember = vi.fn();

vi.mock("@/lib/teams", () => ({
  getTeamById: (...args: unknown[]) => mockGetTeamById(...args),
  isTeamMember: (...args: unknown[]) => mockIsTeamMember(...args),
}));

const fakeTeam = {
  id: "team-1",
  name: "encacapados",
  status: "active",
  createdBy: "user-abc",
  createdAt: "2026-03-22T00:00:00.000Z",
  updatedAt: "2026-03-22T00:00:00.000Z",
  members: [
    { userId: "user-abc", joinedAt: "2026-03-22T00:00:00.000Z" },
    { userId: "user-xyz", joinedAt: "2026-03-22T00:00:00.000Z" },
  ],
};

describe("GET /api/teams/:id", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockGetTeamById.mockReset();
    mockIsTeamMember.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns the team when user is a member", async () => {
    mockGetTeamById.mockResolvedValue(fakeTeam);
    mockIsTeamMember.mockResolvedValue(true);

    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/team-1"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.team.id).toBe("team-1");
  });

  it("returns 403 when user is not a member (team exists)", async () => {
    mockIsTeamMember.mockResolvedValue(false);
    // getTeamById should NOT be called — membership check short-circuits

    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/team-1"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(403);
    expect(mockGetTeamById).not.toHaveBeenCalled();
  });

  it("returns 403 for non-member querying a non-existent team ID (prevents enumeration)", async () => {
    mockIsTeamMember.mockResolvedValue(false);

    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/no-team"), {
      params: Promise.resolve({ id: "no-team" }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 404 when team does not exist and user is a member (edge case)", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockGetTeamById.mockResolvedValue(null);

    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/no-team"), {
      params: Promise.resolve({ id: "no-team" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    currentUser = null;
    const { GET } = await import("@/app/api/teams/[id]/route");
    const response = await GET(new Request("http://localhost/api/teams/team-1"), {
      params: Promise.resolve({ id: "team-1" }),
    });
    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npm run test -- "src/app/api/teams/\[id\]/route.test.ts"
```

Expected: FAIL — file does not exist.

- [ ] **Step 3: Create `src/app/api/teams/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { getTeamById, isTeamMember } from "@/lib/teams";
import type { ApiErrorResponse, TeamResponse } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const { id } = await params;

  // Check membership FIRST — prevents enumeration (non-members always get 403)
  const member = await isTeamMember(id, user.id);

  if (!member) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Acesso negado." },
      { status: 403 },
    );
  }

  const team = await getTeamById(id);

  if (!team) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Time não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json<TeamResponse>({ team });
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- "src/app/api/teams/\[id\]/route.test.ts"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/teams/[id]/route.ts" "src/app/api/teams/[id]/route.test.ts"
git commit -m "feat: adicionar rota GET /api/teams/:id"
```

---

## Task 8: `PATCH /api/teams/:id/archive`

**Files:**
- Create: `src/app/api/teams/[id]/archive/route.ts`
- Create: `src/app/api/teams/[id]/archive/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/api/teams/[id]/archive/route.test.ts`:

```ts
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

let currentUser: { id: string; username: string } | null = {
  id: "user-abc",
  username: "gui.dev",
};

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});

const mockGetTeamById = vi.fn();
const mockIsTeamMember = vi.fn();
const mockArchiveTeam = vi.fn();

vi.mock("@/lib/teams", () => ({
  getTeamById: (...args: unknown[]) => mockGetTeamById(...args),
  isTeamMember: (...args: unknown[]) => mockIsTeamMember(...args),
  archiveTeam: (...args: unknown[]) => mockArchiveTeam(...args),
}));

const activeTeam = {
  id: "team-1",
  name: "encacapados",
  status: "active",
  createdBy: "user-abc",
  createdAt: "2026-03-22T00:00:00.000Z",
  updatedAt: "2026-03-22T00:00:00.000Z",
  members: [
    { userId: "user-abc", joinedAt: "2026-03-22T00:00:00.000Z" },
    { userId: "user-xyz", joinedAt: "2026-03-22T00:00:00.000Z" },
  ],
};

const archivedTeam = { ...activeTeam, status: "archived" };

describe("PATCH /api/teams/:id/archive", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockGetTeamById.mockReset();
    mockIsTeamMember.mockReset();
    mockArchiveTeam.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("archives the team and returns 200", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockGetTeamById.mockResolvedValue(activeTeam);
    mockArchiveTeam.mockResolvedValue(archivedTeam);

    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/team-1/archive"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.team.status).toBe("archived");
  });

  it("is idempotent — returns 200 when team is already archived", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockGetTeamById.mockResolvedValue(archivedTeam);

    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/team-1/archive"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockArchiveTeam).not.toHaveBeenCalled();
  });

  it("returns 403 before checking idempotency — non-member gets 403 even if archived", async () => {
    mockIsTeamMember.mockResolvedValue(false);
    // getTeamById should NOT be called — membership check short-circuits

    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/team-1/archive"), {
      params: Promise.resolve({ id: "team-1" }),
    });

    expect(response.status).toBe(403);
    expect(mockGetTeamById).not.toHaveBeenCalled();
  });

  it("returns 404 when team does not exist and user is a member", async () => {
    mockIsTeamMember.mockResolvedValue(true);
    mockGetTeamById.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/no-team/archive"), {
      params: Promise.resolve({ id: "no-team" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    currentUser = null;
    const { PATCH } = await import("@/app/api/teams/[id]/archive/route");
    const response = await PATCH(new Request("http://localhost/api/teams/team-1/archive"), {
      params: Promise.resolve({ id: "team-1" }),
    });
    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npm run test -- "src/app/api/teams/\[id\]/archive/route.test.ts"
```

Expected: FAIL.

- [ ] **Step 3: Create `src/app/api/teams/[id]/archive/route.ts`**

```ts
import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { getTeamById, isTeamMember, archiveTeam } from "@/lib/teams";
import type { ApiErrorResponse, TeamResponse } from "@/lib/types";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const { id } = await params;

  // Authorization check runs FIRST — prevents team enumeration by non-members
  const member = await isTeamMember(id, user.id);

  if (!member) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Acesso negado." },
      { status: 403 },
    );
  }

  const team = await getTeamById(id);

  if (!team) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Time não encontrado." },
      { status: 404 },
    );
  }

  // Idempotent: already archived → return current state
  if (team.status === "archived") {
    return NextResponse.json<TeamResponse>({ team });
  }

  const archived = await archiveTeam(id);

  return NextResponse.json<TeamResponse>({ team: archived });
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- "src/app/api/teams/\[id\]/archive/route.test.ts"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/teams/[id]/archive/route.ts" "src/app/api/teams/[id]/archive/route.test.ts"
git commit -m "feat: adicionar rota PATCH /api/teams/:id/archive"
```

---

## Task 9: `GET /api/users`

**Files:**
- Create: `src/app/api/users/route.ts`
- Create: `src/app/api/users/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/api/users/route.test.ts`:

```ts
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

let currentUser: { id: string; username: string } | null = {
  id: "user-abc",
  username: "gui.dev",
};

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});

const mockFindUserByUsername = vi.fn();

vi.mock("@/lib/teams", () => ({
  findUserByUsername: (...args: unknown[]) => mockFindUserByUsername(...args),
}));

describe("GET /api/users", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockFindUserByUsername.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns user data when username is found", async () => {
    mockFindUserByUsername.mockResolvedValue({
      id: "user-xyz",
      username: "jean.dev",
      displayName: "Jean",
      avatarUrl: null,
    });

    const { GET } = await import("@/app/api/users/route");
    const response = await GET(new Request("http://localhost/api/users?username=jean.dev"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user.id).toBe("user-xyz");
    expect(body.user.username).toBe("jean.dev");
  });

  it("returns 404 when username is not found", async () => {
    mockFindUserByUsername.mockResolvedValue(null);

    const { GET } = await import("@/app/api/users/route");
    const response = await GET(new Request("http://localhost/api/users?username=ghost"));

    expect(response.status).toBe(404);
  });

  it("returns 400 when username param is missing", async () => {
    const { GET } = await import("@/app/api/users/route");
    const response = await GET(new Request("http://localhost/api/users"));

    expect(response.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    currentUser = null;
    const { GET } = await import("@/app/api/users/route");
    const response = await GET(new Request("http://localhost/api/users?username=jean.dev"));
    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npm run test -- src/app/api/users/route.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create `src/app/api/users/route.ts`**

```ts
import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { findUserByUsername } from "@/lib/teams";
import type { ApiErrorResponse, UserLookupResponse } from "@/lib/types";

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const url = new URL(request.url);
  const username = url.searchParams.get("username");

  if (!username) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Parâmetro 'username' é obrigatório." },
      { status: 400 },
    );
  }

  const found = await findUserByUsername(username);

  if (!found) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Usuário não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json<UserLookupResponse>({ user: found });
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- src/app/api/users/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/users/route.ts src/app/api/users/route.test.ts
git commit -m "feat: adicionar rota GET /api/users para resolucao de username"
```

---

## Task 10: Update `/api/matches`

**Files:**
- Modify: `src/app/api/matches/route.ts`
- Modify: `src/app/api/matches/route.test.ts`

The route now accepts `{ teamAId, teamBId, winnerTeamId, note? }`. It validates that teams are distinct, the winner is one of them, both teams are active, and the user is a member of at least one.

- [ ] **Step 1: Write the failing tests**

Replace `src/app/api/matches/route.test.ts`:

```ts
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

let currentUser: { id: string; username: string } | null = {
  id: "user-abc",
  username: "gui.dev",
};

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});

const mockListMatches = vi.fn();
const mockCreateMatch = vi.fn();

vi.mock("@/lib/data", () => ({
  listMatches: (...args: unknown[]) => mockListMatches(...args),
  createMatch: (...args: unknown[]) => mockCreateMatch(...args),
}));

const mockIsTeamMember = vi.fn();

vi.mock("@/lib/teams", () => ({
  isTeamMember: (...args: unknown[]) => mockIsTeamMember(...args),
}));

// Mock Prisma for team status checks inline in the route
const mockTeamFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    team: {
      findMany: (...args: unknown[]) => mockTeamFindMany(...args),
    },
  },
}));

const fakeMatch = {
  id: "match-1",
  teamAId: "team-a",
  teamBId: "team-b",
  winnerTeamId: "team-a",
  loserTeamId: "team-b",
  playedAt: "2026-03-22T10:00:00.000Z",
  note: null,
};

describe("/api/matches", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
    vi.resetModules();
    mockListMatches.mockReset();
    mockCreateMatch.mockReset();
    mockIsTeamMember.mockReset();
    mockTeamFindMany.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe("GET", () => {
    it("returns matches for the authenticated user's teams", async () => {
      mockListMatches.mockResolvedValue([fakeMatch]);

      const { GET } = await import("@/app/api/matches/route");
      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.matches).toHaveLength(1);
      expect(body.matches[0].teamAId).toBe("team-a");
      expect(mockListMatches).toHaveBeenCalledWith("user-abc");
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { GET } = await import("@/app/api/matches/route");
      const response = await GET();
      expect(response.status).toBe(401);
    });
  });

  describe("POST", () => {
    it("registers a match and returns 201", async () => {
      // Both teams are active
      mockTeamFindMany.mockResolvedValue([
        { id: "team-a", status: "active" },
        { id: "team-b", status: "active" },
      ]);
      // User is member of teamA
      mockIsTeamMember.mockResolvedValue(true);
      mockCreateMatch.mockResolvedValue({ match: fakeMatch });

      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-a",
          }),
        }),
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.match.winnerTeamId).toBe("team-a");
    });

    it("returns 400 when teamAId equals teamBId", async () => {
      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-a",
            winnerTeamId: "team-a",
          }),
        }),
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when winnerTeamId is not one of the two teams", async () => {
      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-c",
          }),
        }),
      );
      expect(response.status).toBe(400);
    });

    it("returns 422 when a team is archived", async () => {
      mockTeamFindMany.mockResolvedValue([
        { id: "team-a", status: "archived" },
        { id: "team-b", status: "active" },
      ]);

      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-a",
          }),
        }),
      );
      expect(response.status).toBe(422);
    });

    it("returns 403 when user is not a member of either team", async () => {
      mockTeamFindMany.mockResolvedValue([
        { id: "team-a", status: "active" },
        { id: "team-b", status: "active" },
      ]);
      mockIsTeamMember.mockResolvedValue(false);

      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-a",
          }),
        }),
      );
      expect(response.status).toBe(403);
    });

    it("returns 400 when note exceeds 140 characters", async () => {
      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAId: "team-a",
            teamBId: "team-b",
            winnerTeamId: "team-a",
            note: "x".repeat(141),
          }),
        }),
      );
      expect(response.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { POST } = await import("@/app/api/matches/route");
      const response = await POST(
        new Request("http://localhost/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamAId: "a", teamBId: "b", winnerTeamId: "a" }),
        }),
      );
      expect(response.status).toBe(401);
    });
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npm run test -- src/app/api/matches/route.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Replace `src/app/api/matches/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { listMatches, createMatch } from "@/lib/data";
import { isTeamMember } from "@/lib/teams";
import { prisma } from "@/lib/prisma";
import type {
  ApiErrorResponse,
  CreateMatchResponse,
  MatchesResponse,
} from "@/lib/types";

const createMatchSchema = z.object({
  teamAId: z.string().min(1, "teamAId é obrigatório."),
  teamBId: z.string().min(1, "teamBId é obrigatório."),
  winnerTeamId: z.string().min(1, "winnerTeamId é obrigatório."),
  note: z
    .string()
    .max(140, "note deve ter no máximo 140 caracteres.")
    .optional(),
});

export async function GET() {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const matches = await listMatches(user.id);

  return NextResponse.json<MatchesResponse>({ matches });
}

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const payload = await request.json().catch(() => null);
  const result = createMatchSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json<ApiErrorResponse>(
      { error: result.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { teamAId, teamBId, winnerTeamId, note } = result.data;

  if (teamAId === teamBId) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Os dois times devem ser diferentes." },
      { status: 400 },
    );
  }

  if (winnerTeamId !== teamAId && winnerTeamId !== teamBId) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "winnerTeamId deve ser um dos dois times da partida." },
      { status: 400 },
    );
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: [teamAId, teamBId] } },
    select: { id: true, status: true },
  });

  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);

  if (!teamA || !teamB) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Um ou mais times não foram encontrados." },
      { status: 404 },
    );
  }

  if (teamA.status !== "active" || teamB.status !== "active") {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Ambos os times devem estar ativos para registrar uma partida." },
      { status: 422 },
    );
  }

  const isMemberA = await isTeamMember(teamAId, user.id);
  const isMemberB = isMemberA ? true : await isTeamMember(teamBId, user.id);

  if (!isMemberA && !isMemberB) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Você precisa ser membro de pelo menos um dos times." },
      { status: 403 },
    );
  }

  const response = await createMatch({ teamAId, teamBId, winnerTeamId, note });

  return NextResponse.json<CreateMatchResponse>(response, { status: 201 });
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- src/app/api/matches/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all tests**

```bash
npm run test
```

Expected: all tests pass. Fix any remaining failures before continuing.

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/matches/route.ts src/app/api/matches/route.test.ts
git commit -m "feat: atualizar /api/matches para times dinamicos"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Run typecheck**

```bash
npm run typecheck
```

Expected: zero errors.

- [ ] **Run lint**

```bash
npm run lint
```

Expected: zero warnings or errors.

- [ ] **Final commit if needed**

```bash
git add -A
git commit -m "chore: ajustes finais pos-implementacao de times dinamicos"
```
