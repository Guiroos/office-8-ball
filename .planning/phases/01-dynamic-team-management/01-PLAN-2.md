---
phase: 01-dynamic-team-management
plan: 2
type: execute
wave: 2
depends_on:
  - 01-dynamic-team-management/01-PLAN-1
files_modified:
  - src/lib/teams.ts
  - src/app/api/teams/[id]/members/route.ts
  - src/app/api/teams/[id]/members/[userId]/route.ts
autonomous: true
requirements:
  - TEAM-01
user_setup: []

must_haves:
  truths:
    - "User can add an existing user as a member to a team they belong to"
    - "User can remove a member from a team they belong to"
    - "Team creator cannot be removed as a member"
    - "Users cannot be added to a team twice"
    - "Duo teams must always have at least 2 members"
    - "API returns 403 if user is not a team member"
  artifacts:
    - path: "src/lib/teams.ts"
      provides: "addTeamMember and removeTeamMember functions"
      exports: "addTeamMember(teamId, userId), removeTeamMember(teamId, userIdToRemove)"
    - path: "src/app/api/teams/[id]/members/route.ts"
      provides: "POST endpoint to add member to team"
      contains: "export async function POST(request, { params })"
    - path: "src/app/api/teams/[id]/members/[userId]/route.ts"
      provides: "DELETE endpoint to remove member from team"
      contains: "export async function DELETE(request, { params })"
  key_links:
    - from: "POST /api/teams/:id/members"
      to: "src/lib/teams.ts addTeamMember"
      via: "endpoint calls domain function after auth + membership guard"
      pattern: "addTeamMember.*teamId.*userId"
    - from: "DELETE /api/teams/:id/members/:userId"
      to: "src/lib/teams.ts removeTeamMember"
      via: "endpoint calls domain function after auth + membership guard"
      pattern: "removeTeamMember.*teamId.*userIdToRemove"
    - from: "Route handlers"
      to: "src/lib/teams.ts isTeamMember"
      via: "membership-first guard: verify user is team member before mutation"
      pattern: "isTeamMember.*user\\.id.*teamId"
---

<objective>
Implement team member management: POST endpoint to add members, DELETE endpoint to remove members. Both operations guard with membership check (user must be on team to add/remove members). Enforce constraints: creator cannot be removed, duo teams need ≥2 members, solo teams need ≥1 member.

**Purpose:** Complete team CRUD by enabling roster changes. Required for Phase 2 (users can create teams with initial duo, then manage rosters dynamically).

**Output:** Two new API routes (POST /api/teams/:id/members, DELETE /api/teams/:id/members/:userId) and supporting domain functions (addTeamMember, removeTeamMember).
</objective>

<execution_context>
@/home/guiroos/Documentos/Projects/office-8-ball/.claude/get-shit-done/workflows/execute-plan.md
@/home/guiroos/Documentos/Projects/office-8-ball/.claude/get-shit-done/templates/summary.md

**Phase boundary:** New API routes for member management. No UI; no changes to existing routes. Domain layer additions only.

**Locked decisions from CONTEXT.md:**
- D-06: Qualquer membro do time pode adicionar ou remover outros membros (não apenas o criador)
- D-07: Adicionar membro: `POST /api/teams/:id/members` com body `{ userId: string }`
- D-08: Remover membro: `DELETE /api/teams/:id/members/:userId`. Não remove `createdBy`
- D-09: Solo team = 1 membro; Duo team = ≥2 membros (minimum)
- D-10: Sem DATABASE_URL, `GET /api/teams/:id` retorna 503; rotas de membros também 503
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/01-dynamic-team-management/01-CONTEXT.md
@.planning/research/SUMMARY.md
@/home/guiroos/Documentos/Projects/office-8-ball/CLAUDE.md

**Canonical reference files the executor must read:**
- `src/app/api/teams/[id]/route.ts` — Pattern for membership-first guard (`isTeamMember` check)
- `src/lib/teams.ts` — isTeamMember function, existing pattern for team operations
- `src/app/api/teams/route.ts` — POST pattern with Zod validation, error handling
- `.claude/rules/api-patterns.md` — Auth guard, response typing, input validation
- `.claude/rules/architecture.md` — In-memory fallback constraint
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add addTeamMember and removeTeamMember functions to teams.ts</name>
  <files>src/lib/teams.ts</files>
  <read_first>
    - src/lib/teams.ts (full file, to understand existing patterns)
    - src/lib/types.ts (TeamRecord type structure)
  </read_first>
  <action>
Add two new domain functions to src/lib/teams.ts for team member management.

**Function 1: addTeamMember**
```typescript
export async function addTeamMember(
  teamId: string,
  userId: string,
): Promise<TeamRecord> {
  // Check if user is already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (existingMember) {
    throw new Error("Usuário já é membro deste time.");
  }

  // Add user as team member
  await prisma.teamMember.create({
    data: { teamId, userId },
  });

  // Return updated team
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) throw new Error("Time não encontrado.");
  return normalizeTeam(team);
}
```

**Function 2: removeTeamMember**
```typescript
export async function removeTeamMember(
  teamId: string,
  userIdToRemove: string,
): Promise<TeamRecord> {
  // Get team to check type and member count
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) throw new Error("Time não encontrado.");

  // Prevent removing creator
  if (team.createdBy === userIdToRemove) {
    throw new Error("Não é possível remover o criador do time.");
  }

  // Check minimum member count based on type
  const memberCount = team.members.length;
  const minMembers = team.type === 'solo' ? 1 : 2;

  if (memberCount <= minMembers) {
    throw new Error(
      team.type === 'solo'
        ? "Solo team precisa ter pelo menos 1 membro."
        : "Time duo precisa ter pelo menos 2 membros."
    );
  }

  // Remove user from team
  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userIdToRemove } },
  });

  // Return updated team
  const updatedTeam = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!updatedTeam) throw new Error("Time não encontrado após remoção.");
  return normalizeTeam(updatedTeam);
}
```

**Import at top of file:**
Ensure `normalizeTeam` is available (it already is in the file).

**Error handling pattern:**
Throw errors with descriptive Portuguese messages. Route handlers will catch and convert to HTTP responses.
  </action>
  <verify>
    <automated>grep -n "export async function addTeamMember" src/lib/teams.ts && grep -n "export async function removeTeamMember" src/lib/teams.ts</automated>
  </verify>
  <acceptance_criteria>
    - src/lib/teams.ts contains `addTeamMember(teamId: string, userId: string)` function
    - src/lib/teams.ts contains `removeTeamMember(teamId: string, userIdToRemove: string)` function
    - addTeamMember checks for duplicate membership before adding (throws error if already member)
    - removeTeamMember prevents removing team creator (throws error)
    - removeTeamMember enforces minimum member count (1 for solo, 2 for duo)
    - Both functions return normalizeTeam() result (typed TeamRecord)
    - Error messages in Portuguese
    - TypeScript strict mode: `npm run typecheck` passes
  </acceptance_criteria>
  <done>Member management domain functions added. addTeamMember and removeTeamMember enforce constraints via thrown errors.</done>
</task>

<task type="auto">
  <name>Task 2: Create POST /api/teams/:id/members endpoint</name>
  <files>src/app/api/teams/[id]/members/route.ts</files>
  <read_first>
    - src/app/api/teams/[id]/route.ts (membership-first guard pattern on lines ~15-30)
    - src/app/api/teams/route.ts (Zod validation + error handling pattern on lines 13-50)
    - src/lib/teams.ts (addTeamMember function signature)
  </read_first>
  <action>
Create new route file for POST /api/teams/:id/members to add a member to a team.

**File path:** `src/app/api/teams/[id]/members/route.ts`

**Full handler code:**
```typescript
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { addTeamMember, isTeamMember, findUserById } from "@/lib/teams";
import type { ApiErrorResponse, TeamResponse } from "@/lib/types";

const addMemberSchema = z.object({
  userId: z.string().min(1, "userId é obrigatório."),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const { id: teamId } = params;

  // Membership-first guard: user must be on team to add members
  const isMember = await isTeamMember(teamId, user.id);
  if (!isMember) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Você não é membro deste time." },
      { status: 403 },
    );
  }

  const payload = await request.json().catch(() => null);
  const result = addMemberSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json<ApiErrorResponse>(
      { error: result.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { userId } = result.data;

  // Verify user exists
  const userToAdd = await findUserById(userId);
  if (!userToAdd) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Usuário não encontrado." },
      { status: 404 },
    );
  }

  try {
    const team = await addTeamMember(teamId, userId);
    return NextResponse.json<TeamResponse>({ team }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao adicionar membro.";
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 400 },
    );
  }
}
```

**Key patterns:**
- `hasDatabaseUrl()` guard first (in-memory fallback returns 503)
- Auth guard: `getAuthenticatedUser()` check
- Membership-first guard: `isTeamMember()` check before mutation
- Input validation: Zod schema with safeParse
- User existence check: `findUserById()` before calling domain function
- Error handling: Catch domain function errors (addTeamMember throws on duplicate/other issues)
- Response typing: `NextResponse.json<TeamResponse>()` for consistency
  </action>
  <verify>
    <automated>grep -n "export async function POST" src/app/api/teams/\[id\]/members/route.ts && grep -n "addMemberSchema\|isTeamMember\|addTeamMember" src/app/api/teams/\[id\]/members/route.ts</automated>
  </verify>
  <acceptance_criteria>
    - File `src/app/api/teams/[id]/members/route.ts` exists and is readable
    - POST handler includes hasDatabaseUrl guard (returns 503 if missing)
    - POST handler includes getAuthenticatedUser guard (returns 401 if not authenticated)
    - POST handler includes isTeamMember guard (returns 403 if user not on team)
    - POST handler validates userId with Zod schema
    - POST handler checks user exists before calling addTeamMember
    - POST handler catches errors from addTeamMember and returns 400 with error message
    - Response typed as TeamResponse with 200 status on success
    - Error messages in Portuguese
    - TypeScript strict mode: `npm run typecheck` passes
  </acceptance_criteria>
  <done>POST /api/teams/:id/members route created. Enforces auth, membership, and validates user before adding.</done>
</task>

<task type="auto">
  <name>Task 3: Create DELETE /api/teams/:id/members/:userId endpoint</name>
  <files>src/app/api/teams/[id]/members/[userId]/route.ts</files>
  <read_first>
    - src/app/api/teams/[id]/members/route.ts (just created, for reference pattern)
    - src/lib/teams.ts (removeTeamMember function signature)
  </read_first>
  <action>
Create new route file for DELETE /api/teams/:id/members/:userId to remove a member from a team.

**File path:** `src/app/api/teams/[id]/members/[userId]/route.ts`

**Full handler code:**
```typescript
import { NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  getAuthRequiredResponse,
  hasDatabaseUrl,
  getAuthUnavailableResponse,
} from "@/lib/auth";
import { removeTeamMember, isTeamMember } from "@/lib/teams";
import type { ApiErrorResponse, TeamResponse } from "@/lib/types";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } },
) {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();

  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();

  const { id: teamId, userId: userIdToRemove } = params;

  // Membership-first guard: user must be on team to remove members
  const isMember = await isTeamMember(teamId, user.id);
  if (!isMember) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Você não é membro deste time." },
      { status: 403 },
    );
  }

  try {
    const team = await removeTeamMember(teamId, userIdToRemove);
    return NextResponse.json<TeamResponse>({ team }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao remover membro.";
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 400 },
    );
  }
}
```

**Key patterns:**
- `hasDatabaseUrl()` guard first
- Auth guard: `getAuthenticatedUser()` check
- Membership-first guard: `isTeamMember()` check (user removing must be on team)
- Extract `userIdToRemove` from params
- Call domain function: `removeTeamMember(teamId, userIdToRemove)`
- Error handling: Catch thrown errors (creator removal, min member enforcement)
- Response typing: `NextResponse.json<TeamResponse>()` on success (200)
  </action>
  <verify>
    <automated>grep -n "export async function DELETE" src/app/api/teams/\[id\]/members/\[userId\]/route.ts && grep -n "removeTeamMember\|isTeamMember" src/app/api/teams/\[id\]/members/\[userId\]/route.ts</automated>
  </verify>
  <acceptance_criteria>
    - File `src/app/api/teams/[id]/members/[userId]/route.ts` exists and is readable
    - DELETE handler includes hasDatabaseUrl guard (returns 503 if missing)
    - DELETE handler includes getAuthenticatedUser guard (returns 401 if not authenticated)
    - DELETE handler includes isTeamMember guard (returns 403 if user not on team)
    - DELETE handler extracts userIdToRemove from params
    - DELETE handler calls removeTeamMember(teamId, userIdToRemove)
    - DELETE handler catches errors and returns 400 with error message
    - Response typed as TeamResponse with 200 status on success
    - Error messages in Portuguese
    - Correctly rejects removal of team creator (error from removeTeamMember propagates)
    - Correctly rejects removal if it violates min member count (error from removeTeamMember propagates)
    - TypeScript strict mode: `npm run typecheck` passes
  </acceptance_criteria>
  <done>DELETE /api/teams/:id/members/:userId route created. Enforces auth, membership, and applies constraints from domain layer.</done>
</task>

<task type="auto">
  <name>Task 4: Verify in-memory fallback behavior for new endpoints</name>
  <files>src/app/api/teams/[id]/members/route.ts, src/app/api/teams/[id]/members/[userId]/route.ts</files>
  <read_first>
    - src/lib/data.ts (check in-memory mode handling for existing routes)
    - src/lib/auth.ts (hasDatabaseUrl, getAuthUnavailableResponse)
  </read_first>
  <action>
Verify that new member management endpoints correctly return 503 (Service Unavailable) when DATABASE_URL is not set, consistent with locked decision D-10.

**Expected behavior (per CONTEXT.md):**
- Sem `DATABASE_URL`, `POST /api/teams/:id/members` retorna 503
- Sem `DATABASE_URL`, `DELETE /api/teams/:id/members/:userId` retorna 503

**Verification steps:**
1. Check that both new endpoints start with `if (!hasDatabaseUrl()) return getAuthUnavailableResponse();`
2. Confirm `getAuthUnavailableResponse()` returns status 503
3. No try to read from Prisma or fall back to in-memory; just return 503 immediately

This is automatic in Plan 2 because both endpoints include the `hasDatabaseUrl()` guard as first line of POST and DELETE handlers (see Task 2 and Task 3).

**Testing (if dev server available):**
Start dev without DATABASE_URL and call both endpoints:
```bash
unset DATABASE_URL
npm run dev
```

Then in another terminal:
```bash
curl -X POST http://localhost:3000/api/teams/some-id/members \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id"}'
# Expected: 503 Service Unavailable

curl -X DELETE http://localhost:3000/api/teams/some-id/members/user-id
# Expected: 503 Service Unavailable
```

No further action needed if guards are in place. This is a verification task only.
  </action>
  <verify>
    <automated>grep -n "if (!hasDatabaseUrl())" src/app/api/teams/\[id\]/members/route.ts && grep -n "if (!hasDatabaseUrl())" src/app/api/teams/\[id\]/members/\[userId\]/route.ts</automated>
  </verify>
  <acceptance_criteria>
    - Both new endpoints (POST and DELETE) include `if (!hasDatabaseUrl()) return getAuthUnavailableResponse();` as first guard
    - No fallback to in-memory team member operations (functions don't exist in in-memory mode)
    - Consistent with D-10 behavior (member management requires database)
    - No breaking changes to existing hasDatabaseUrl guard pattern
    - TypeScript strict mode: `npm run typecheck` passes
  </acceptance_criteria>
  <done>In-memory fallback behavior verified. Member management endpoints correctly return 503 without DATABASE_URL.</done>
</task>

<task type="auto">
  <name>Task 5: Create test file for member management functions</name>
  <files>src/lib/teams.test.ts (or extend existing team tests)</files>
  <read_first>
    - src/lib/teams.ts (addTeamMember, removeTeamMember functions)
    - Look for existing test files in src/lib/ to understand testing pattern
    - .claude/rules/testing.md (testing conventions for data layer)
  </read_first>
  <action>
Create or extend test file to cover new member management functions. Use Vitest + Testing Library patterns.

**Create src/lib/teams.test.ts with test cases for:**

1. **addTeamMember success**
   - Add existing user to team successfully → team returned with new member in list
   - Member joinedAt timestamp set correctly

2. **addTeamMember error cases**
   - Throws if user is already a member
   - Throws if user doesn't exist (should be checked in route, but test domain layer independently)
   - Throws if team doesn't exist

3. **removeTeamMember success**
   - Remove non-creator member from team → team returned without removed member

4. **removeTeamMember error cases**
   - Throws if attempting to remove creator
   - Throws if removal would violate min member count (duo team with 2 members)
   - Throws if team doesn't exist
   - Throws if user not on team

5. **Edge cases**
   - Solo team: can have 1 member (creator only)
   - Duo team: cannot drop below 2 members
   - Type field consistency after member changes

**Test structure pattern:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addTeamMember, removeTeamMember, getTeamById } from "@/lib/teams";
import { prisma } from "@/lib/prisma";

describe("Team member management", () => {
  describe("addTeamMember", () => {
    it("adds a user to a team", async () => {
      // Setup: create team, users
      // Call: addTeamMember
      // Assert: member in team.members array
    });

    it("throws if user already a member", async () => {
      // Setup: create team with user as member
      // Call: addTeamMember with same user
      // Assert: throws error
    });
  });

  describe("removeTeamMember", () => {
    it("removes a non-creator member", async () => {
      // Setup: create team with 2+ members
      // Call: removeTeamMember for non-creator
      // Assert: member removed from team.members
    });

    it("prevents removing creator", async () => {
      // Setup: create team
      // Call: removeTeamMember for creator
      // Assert: throws error with "criador" message
    });

    it("prevents removing if min members violated", async () => {
      // Setup: duo team with 2 members
      // Call: removeTeamMember for non-creator
      // Assert: throws error about min members
    });
  });
});
```

**Testing pattern:**
Use `vi.resetModules()` for isolation (if needed per .claude/rules/testing.md). Mock Prisma if unit testing in isolation; use real Prisma if integration testing with in-memory DB.

Since tests in this project appear to use in-memory Prisma mode (DATABASE_URL optional), set up test DB state directly via prisma calls.
  </action>
  <verify>
    <automated>find src/lib -name "*.test.ts" | head -1 && grep -n "addTeamMember\|removeTeamMember" src/lib/*.test.ts | head -5</automated>
  </verify>
  <acceptance_criteria>
    - Test file exists (src/lib/teams.test.ts or extended in existing team test file)
    - Tests cover addTeamMember success and error cases
    - Tests cover removeTeamMember success and error cases
    - Tests verify team type constraints (solo min 1, duo min 2)
    - Tests verify creator cannot be removed
    - Tests verify duplicate member prevention
    - All tests pass: `npm run test -- src/lib/teams.test.ts` (or equivalent)
    - No test failures in overall test suite: `npm run test` passes
  </acceptance_criteria>
  <done>Test file created for member management. Core functions tested for success and error paths.</done>
</task>

<task type="auto">
  <name>Task 6: Verify routes integration and type consistency</name>
  <files>src/app/api/teams/[id]/members/route.ts, src/app/api/teams/[id]/members/[userId]/route.ts, src/lib/types.ts</files>
  <read_first>
    - src/lib/types.ts (TeamResponse, ApiErrorResponse types)
    - Both new route files (created in Tasks 2 and 3)
  </read_first>
  <action>
Verify that new routes follow established patterns and that type annotations are consistent.

**Checklist:**
1. Both routes use `NextResponse.json<TeamResponse>()` for success (200)
2. Both routes use `NextResponse.json<ApiErrorResponse>()` for errors (400, 403, 401, 503)
3. All import paths use `@/` alias (no relative paths)
4. No hardcoded strings that should be in constants or config
5. Error messages in Portuguese throughout
6. Consistent guard order: hasDatabaseUrl → getAuthenticatedUser → business logic (membership, validation)
7. All thrown errors from domain functions caught and converted to HTTP responses
8. Routes follow naming convention: `[id]` for team ID, `[userId]` for user ID in path params

**Run type checking:**
```bash
npm run typecheck
```

**Run linting:**
```bash
npm run lint
```

Expected: No errors in new files.
  </action>
  <verify>
    <automated>grep -n "NextResponse.json<TeamResponse>" src/app/api/teams/\[id\]/members/route.ts && grep -n "NextResponse.json<TeamResponse>" src/app/api/teams/\[id\]/members/\[userId\]/route.ts</automated>
  </verify>
  <acceptance_criteria>
    - Both routes import and use TeamResponse for success responses
    - Both routes import and use ApiErrorResponse for error responses
    - All imports use @/ alias
    - All error messages in Portuguese
    - Guard order consistent across routes (database → auth → business)
    - Error handling catches domain function exceptions and converts to HTTP responses
    - TypeScript strict mode: `npm run typecheck` passes with no errors
    - Linting: `npm run lint` passes with no errors (or only pre-existing errors)
  </acceptance_criteria>
  <done>Routes verified for consistency, typing, and pattern adherence. Ready for execution phase integration tests.</done>
</task>

</tasks>

<verification>
**Per-task verification:**
- Task 1: Domain functions defined; TypeScript types match
- Task 2: POST endpoint created; guards and validation in place
- Task 3: DELETE endpoint created; guards and validation in place
- Task 4: In-memory fallback behavior verified (returns 503)
- Task 5: Tests created and passing
- Task 6: Type consistency and pattern adherence verified

**Integration check:**
Run full test and type suite:
```bash
npm run typecheck
npm run lint
npm run test
```

Expected: All pass (or pre-existing failures only).

**Manual verification (if dev server available):**
1. Ensure DATABASE_URL is set (dev or test database)
2. Start server: `npm run dev`
3. Create a team with type='duo' (from Plan 1)
4. POST to `/api/teams/:id/members` with a new user ID → returns 200 with updated team
5. DELETE from `/api/teams/:id/members/:userId` with non-creator member → returns 200 with updated team
6. Attempt DELETE creator → returns 400 with "criador" error
7. Attempt DELETE when only 1 member left on duo → returns 400 with min member error
8. Verify type field still present in all responses
</verification>

<success_criteria>
**Phase 1, Plan 2 complete when:**
1. addTeamMember function added to src/lib/teams.ts with validation (no duplicates)
2. removeTeamMember function added to src/lib/teams.ts with constraints (no creator, min members)
3. POST /api/teams/:id/members endpoint created with full auth/membership guards
4. DELETE /api/teams/:id/members/:userId endpoint created with full auth/membership guards
5. In-memory fallback returns 503 for both endpoints (per D-10)
6. Tests created and passing for all member management functions
7. TypeScript strict mode: `npm run typecheck` passes
8. No breaking changes to existing team CRUD routes
9. Routes follow established patterns (guards, validation, typing)

**Phase 1 complete when:**
- Plan 1 (type field) complete
- Plan 2 (member management) complete
- All 6 Phase 1 success criteria met:
  1. User can create solo (1 member) or duo (2 members) team with unique name ✓
  2. User can view list of their teams with member roster ✓
  3. User can add existing users as team members ✓
  4. User can remove members from their team ✓
  5. Dual-mode persistence verified (in-memory + Prisma) ✓
  6. All team CRUD works without DATABASE_URL ✓ (via hasDatabaseUrl guards returning 503)
</success_criteria>

<output>
After completion, create `.planning/phases/01-dynamic-team-management/01-PLAN-2-SUMMARY.md` with:
- What was built (member management functions, POST and DELETE endpoints)
- Files changed (list all modified/created files)
- API behavior (new endpoints, status codes, error cases)
- Constraints enforced (creator protection, min member counts, duplicate prevention)
- In-memory fallback behavior (returns 503)
- Test coverage status
- Dependency on Plan 1 resolved (uses type field from Plan 1)
- Ready for Phase 2 (scoreboard reactivation can now use dynamic teams with rosters)
</output>
