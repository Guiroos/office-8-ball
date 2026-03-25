---
phase: 01-dynamic-team-management
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - prisma/schema.prisma
  - prisma/migrations
  - src/lib/types.ts
  - src/lib/teams.ts
  - src/app/api/teams/route.ts
autonomous: true
requirements:
  - TEAM-01
user_setup: []

must_haves:
  truths:
    - "User can create a team with type 'solo' (1 member) or 'duo' (2 members) and a unique name"
    - "Team type is immutable after creation"
    - "API responses include type field for every team"
    - "In-memory mode and PostgreSQL mode return consistent team structures with type field"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Team model with type field (enum or string)"
      contains: "type: 'solo' | 'duo'"
    - path: "src/lib/types.ts"
      provides: "TeamRecord type with type field"
      exports: "type TeamRecord { ... type: 'solo' | 'duo' ... }"
    - path: "src/lib/teams.ts"
      provides: "createTeam accepts type parameter"
      exports: "createTeam(input: { name, createdBy, type, secondMemberUserId? })"
    - path: "src/app/api/teams/route.ts"
      provides: "POST /api/teams validates and accepts type field"
      contains: "@db.Text or enum for type validation"
  key_links:
    - from: "src/app/api/teams/route.ts POST"
      to: "src/lib/teams.ts createTeam"
      via: "type parameter passed through to domain function"
      pattern: "createTeam.*type.*solo.*duo"
    - from: "src/lib/teams.ts createTeam"
      to: "prisma/schema.prisma Team.type"
      via: "Prisma creates team with type field"
      pattern: "teams\\.create.*type"
    - from: "src/lib/types.ts TeamRecord"
      to: "src/lib/teams.ts normalizeTeam"
      via: "normalizeTeam returns typed TeamRecord with type field"
      pattern: "type:.*solo.*duo"
---

<objective>
Add `type` field to Team model to distinguish solo (1 member) and duo (2 member) teams. Update domain layer (types, normalization, creation logic) to handle both types. Verify dual-mode persistence is maintained.

**Purpose:** Unblock team member management (Plan 2) by ensuring schema and domain layer support team types correctly.

**Output:** Schema migration, updated types, updated team creation logic. All team CRUD returns type field consistently.
</objective>

<execution_context>
@/home/guiroos/Documentos/Projects/office-8-ball/.claude/get-shit-done/workflows/execute-plan.md
@/home/guiroos/Documentos/Projects/office-8-ball/.claude/get-shit-done/templates/summary.md

**Phase boundary:** Type field addition, domain layer refactor. No UI changes; no new routes. API response shape changes.

**Locked decisions from CONTEXT.md:**
- D-01: `type: 'solo' | 'duo'` field added to Team model, obrigatório e fixo na criação
- D-02: Times `solo` têm apenas 1 membro (o criador); POST sem `secondMemberUserId`
- D-03: Times `duo` têm exatamente 2 membros; comportamento atual mantido
- D-04: `TeamRecord` em `src/lib/types.ts` recebe `type: 'solo' | 'duo'`
- D-05: Schema change requer migration + seed juntos — aprovado explicitamente nesta fase
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/01-dynamic-team-management/01-CONTEXT.md
@.planning/research/SUMMARY.md
@/home/guiroos/Documentos/Projects/office-8-ball/CLAUDE.md

**Canonical reference files the executor must read:**
- `prisma/schema.prisma` — Current Team model (no type field yet)
- `src/lib/types.ts` — TeamRecord (needs type field)
- `src/lib/teams.ts` — createTeam signature and normalizeTeam function
- `src/app/api/teams/route.ts` — Current POST schema and validation
- `.claude/rules/architecture.md` — Constraints on schema changes
- `.claude/rules/safe-change.md` — Safe change checklist #3-5
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add type field to Team model and create migration</name>
  <files>prisma/schema.prisma, prisma/migrations/*</files>
  <read_first>
    - prisma/schema.prisma (current Team model)
    - .claude/rules/architecture.md (constraint on schema changes)
  </read_first>
  <action>
Add `type` field to Prisma Team model. Use `enum TeamType { solo; duo; }` for type safety (matching existing TeamStatus enum pattern). Add required field with default value. Generate migration using `npm run prisma:migrate dev -- --name add_team_type` to create the migration file.

**Exact changes to prisma/schema.prisma:**
1. Add enum above Team model:
```
enum TeamType {
  solo
  duo
}
```

2. Add field to Team model (after name field):
```
type       TeamType @default(duo)
```

3. Run migration locally: `npm run prisma:migrate dev -- --name add_team_type`

The migration will fail if database is not available — that is expected. The migration file itself (in prisma/migrations/) must be committed.

**Reference pattern:** See existing TeamStatus enum (line 11-14 of current schema) — use same pattern for TeamType.
  </action>
  <verify>
    <automated>grep -n "enum TeamType" prisma/schema.prisma && grep -n "type.*TeamType" prisma/schema.prisma</automated>
  </verify>
  <acceptance_criteria>
    - prisma/schema.prisma contains `enum TeamType { solo; duo; }`
    - prisma/schema.prisma Team model contains `type       TeamType @default(duo)`
    - prisma/migrations/ directory contains new migration file with timestamp
    - Migration file name matches pattern `*add_team_type.sql` or similar
    - Running `npm run prisma:generate` succeeds (Prisma client regenerated)
  </acceptance_criteria>
  <done>Schema migration created and committed. Prisma client regenerated successfully. TeamType enum available for types.</done>
</task>

<task type="auto">
  <name>Task 2: Update TeamRecord type and normalizeTeam function</name>
  <files>src/lib/types.ts, src/lib/teams.ts</files>
  <read_first>
    - src/lib/types.ts (current TeamRecord definition, lines 1-18)
    - src/lib/teams.ts (normalizeTeam function, lines 4-25)
  </read_first>
  <action>
Update TypeScript types to include team type in domain layer.

**Change 1: src/lib/types.ts — Add type to TeamRecord**
Add field to TeamRecord interface (after status field):
```typescript
type: 'solo' | 'duo';
```

Result should be:
```typescript
export type TeamRecord = {
  id: string;
  name: string;
  type: 'solo' | 'duo';
  status: TeamStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberRecord[];
};
```

**Change 2: src/lib/teams.ts — Update normalizeTeam signature and function**
Update function parameter type to accept type field:
```typescript
function normalizeTeam(team: {
  id: string;
  name: string;
  type: 'solo' | 'duo';
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: { userId: string; joinedAt: Date }[];
}): TeamRecord {
```

Update return object to include type field (after status):
```typescript
return {
  id: team.id,
  name: team.name,
  type: team.type,
  status: team.status as "active" | "archived",
  ...
};
```

**Verify consistency:** All normalizeTeam calls will automatically include type field from Prisma response (it's now part of the schema).
  </action>
  <verify>
    <automated>grep -n "type: 'solo' | 'duo'" src/lib/types.ts && grep -A 2 "function normalizeTeam" src/lib/teams.ts | grep -q "type:"</automated>
  </verify>
  <acceptance_criteria>
    - src/lib/types.ts TeamRecord type includes `type: 'solo' | 'duo'` field
    - src/lib/teams.ts normalizeTeam function parameter includes `type: 'solo' | 'duo'` in destructure
    - src/lib/teams.ts normalizeTeam return object includes `type: team.type` assignment
    - TypeScript strict mode passes: `npm run typecheck` succeeds with no errors
  </acceptance_criteria>
  <done>TeamRecord type updated to include type field. normalizeTeam function updated to return type in normalized response. TypeScript types consistent.</done>
</task>

<task type="auto">
  <name>Task 3: Update createTeam function to accept and handle type parameter</name>
  <files>src/lib/teams.ts</files>
  <read_first>
    - src/lib/teams.ts (createTeam function, lines 37-57)
    - prisma/schema.prisma (Team model with new type field)
  </read_first>
  <action>
Refactor createTeam to accept type parameter and conditionally set secondMemberUserId.

**Current signature:**
```typescript
export async function createTeam(input: {
  name: string;
  createdBy: string;
  secondMemberUserId: string;
}): Promise<TeamRecord>
```

**New signature:**
```typescript
export async function createTeam(input: {
  name: string;
  createdBy: string;
  type: 'solo' | 'duo';
  secondMemberUserId?: string;
}): Promise<TeamRecord>
```

**New function body logic:**
```typescript
export async function createTeam(input: {
  name: string;
  createdBy: string;
  type: 'solo' | 'duo';
  secondMemberUserId?: string;
}): Promise<TeamRecord> {
  const team = await prisma.team.create({
    data: {
      name: input.name.trim().toLowerCase(),
      type: input.type,
      createdBy: input.createdBy,
      members: {
        create: input.type === 'solo'
          ? [{ userId: input.createdBy }]
          : [
              { userId: input.createdBy },
              { userId: input.secondMemberUserId! },
            ],
      },
    },
    include: { members: true },
  });

  return normalizeTeam(team);
}
```

**Key behavior:**
- For `type: 'solo'`: Only add creator as member; secondMemberUserId ignored
- For `type: 'duo'`: Add creator + secondMemberUserId as members (current behavior)
  </action>
  <verify>
    <automated>grep -A 30 "export async function createTeam" src/lib/teams.ts | grep -q "type.*solo.*duo"</automated>
  </verify>
  <acceptance_criteria>
    - src/lib/teams.ts createTeam input includes `type: 'solo' | 'duo'` and `secondMemberUserId?: string`
    - createTeam function creates solo teams with 1 member (creator only)
    - createTeam function creates duo teams with 2 members (creator + secondMemberUserId)
    - createTeam passes type field to prisma.team.create
    - TypeScript strict mode passes: `npm run typecheck` succeeds
  </acceptance_criteria>
  <done>createTeam function refactored to handle both solo and duo team creation. Type parameter controls member count.</done>
</task>

<task type="auto">
  <name>Task 4: Update POST /api/teams route to accept and validate type field</name>
  <files>src/app/api/teams/route.ts</files>
  <read_first>
    - src/app/api/teams/route.ts (current GET/POST handlers, lines 1-93)
    - src/lib/types.ts (updated TeamRecord type)
  </read_first>
  <action>
Update route handler to accept type field in request and pass to domain layer.

**Change 1: Update createTeamSchema Zod validation**
Add type field to schema:
```typescript
const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório.")
    .max(50, "Nome pode ter no máximo 50 caracteres.")
    .transform((v) => v.trim().toLowerCase()),
  type: z.enum(['solo', 'duo'], {
    errorMap: () => ({ message: "Tipo deve ser 'solo' ou 'duo'." })
  }),
  secondMemberUserId: z.string().min(1, "Membro adicional é obrigatório para times duo.").optional(),
});
```

**Change 2: Update POST handler to conditionally validate secondMemberUserId**
After payload parsing, add conditional validation:
```typescript
  const { name, type, secondMemberUserId } = result.data;

  // Validate secondMemberUserId for duo teams
  if (type === 'duo' && !secondMemberUserId) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "secondMemberUserId é obrigatório para times do tipo duo." },
      { status: 400 },
    );
  }

  // Validate secondMemberUserId is not same as creator (for duo teams)
  if (type === 'duo' && secondMemberUserId === user.id) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Você não pode criar um time com você mesmo." },
      { status: 400 },
    );
  }

  // Lookup secondMemberUserId only if needed (duo teams)
  if (type === 'duo' && secondMemberUserId) {
    const secondMember = await findUserById(secondMemberUserId);
    if (!secondMember) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    }
  }
```

**Change 3: Update createTeam call**
Pass type and conditionally pass secondMemberUserId:
```typescript
  const team = await createTeam({
    name,
    createdBy: user.id,
    type,
    secondMemberUserId: type === 'duo' ? secondMemberUserId : undefined,
  });
```

**Behavior:**
- `POST /api/teams` with `type: 'solo'` → creates team with 1 member (creator)
- `POST /api/teams` with `type: 'duo'` + `secondMemberUserId` → creates team with 2 members
- `POST /api/teams` with `type: 'duo'` without `secondMemberUserId` → returns 400
  </action>
  <verify>
    <automated>grep -n "type: z.enum" src/app/api/teams/route.ts && grep -n "type === 'solo'" src/app/api/teams/route.ts</automated>
  </verify>
  <acceptance_criteria>
    - src/app/api/teams/route.ts createTeamSchema includes `type: z.enum(['solo', 'duo'])`
    - POST handler validates secondMemberUserId is required only for duo teams
    - POST handler validates secondMemberUserId is not same as creator for duo teams
    - POST handler passes type to createTeam function
    - API response includes type field in team object (via normalizeTeam)
    - TypeScript strict mode passes: `npm run typecheck` succeeds
  </acceptance_criteria>
  <done>POST /api/teams route updated to accept and validate type field. Request validation enforces solo/duo rules.</done>
</task>

<task type="auto">
  <name>Task 5: Update seed.mjs to match new schema</name>
  <files>prisma/seed.mjs</files>
  <read_first>
    - prisma/seed.mjs (seed script — full file)
  </read_first>
  <action>
Update seed script to include type field for teams created during seeding.

**Task:** Search for team creation in seed.mjs and add `type: 'duo'` field to each team data object.

**Example change:**
If seed currently has:
```javascript
prisma.team.create({
  data: {
    name: 'frontend',
    createdBy: userId1,
    ...
  }
})
```

Update to:
```javascript
prisma.team.create({
  data: {
    name: 'frontend',
    type: 'duo',
    createdBy: userId1,
    ...
  }
})
```

**Verify:** Run seed and confirm no Prisma errors about missing required field.
  </action>
  <verify>
    <automated>grep -n "type:" prisma/seed.mjs | head -5</automated>
  </verify>
  <acceptance_criteria>
    - prisma/seed.mjs includes `type` field in all team data objects
    - Seed script runs without Prisma validation errors (if DATABASE_URL is available)
    - All seeded teams have type explicitly set (no relying on defaults)
  </acceptance_criteria>
  <done>Seed script updated to include type field for all teams. Seed synchronization with schema complete.</done>
</task>

<task type="auto">
  <name>Task 6: Verify dual-mode persistence and type consistency</name>
  <files>src/lib/data.ts (if in-memory fallback exists there)</files>
  <read_first>
    - src/lib/data.ts (check for in-memory team handling)
    - src/lib/constants.ts (check if TEAMS constant exists)
    - .claude/rules/architecture.md (constraint: dual-mode must not break)
  </read_first>
  <action>
Verify that in-memory mode and Prisma mode both support the type field correctly.

**Step 1: Check current in-memory handling**
Search for any in-memory team data structures. If TEAMS constant exists in constants.ts, verify it can be extended with type field.

**Step 2: Ensure dual-mode consistency**
If there's fallback logic in data.ts or teams.ts that creates teams without database:
- Confirm it includes type field in response
- Confirm type field matches actual member count (solo = 1 member, duo = 2 members)

**Step 3: Verify no hardcoded team references break**
Run `grep -r "frontend" src/ --include="*.ts" --include="*.tsx"` to find hardcoded team references. Document findings but do NOT change in this task.

**Step 4: Test dual-mode manually (if time allows)**
Start dev server without DATABASE_URL:
```bash
unset DATABASE_URL
npm run dev
```
Call `GET /api/teams` — should return 503 (auth unavailable) with in-memory guard. This is expected per D-10.

The key verification is that TypeScript types are consistent: TeamRecord type includes type field everywhere, and no code assumes teams exist without type field.
  </action>
  <verify>
    <automated>grep -n "getTeamById\|listUserTeams\|createTeam" src/lib/teams.ts | head -10</automated>
  </verify>
  <acceptance_criteria>
    - All team-returning functions in teams.ts (getTeamById, listUserTeams, createTeam, etc.) call normalizeTeam()
    - normalizeTeam() returns TeamRecord with type field
    - No code in src/ directly creates TeamRecord without type field
    - In-memory fallback behavior matches locked decisions (D-10: GET /api/teams returns 503; POST returns 503)
    - TypeScript strict mode: `npm run typecheck` passes with no errors
  </acceptance_criteria>
  <done>Dual-mode persistence verified. Type field consistently present in all team responses. No hardcoded team references visible.</done>
</task>

</tasks>

<verification>
**Per-task verification:**
- Task 1: Migration file created; `npm run prisma:generate` succeeds
- Task 2: TypeScript types updated; `npm run typecheck` passes
- Task 3: createTeam function handles both solo/duo correctly
- Task 4: POST /api/teams accepts type; validation rules enforced
- Task 5: Seed script updated; type field present
- Task 6: Dual-mode consistency verified; no breaking changes

**Integration check:**
Run full test suite to ensure no regressions:
```bash
npm run typecheck
npm run test
```

Expected: All tests pass (or fail only on unrelated tests already failing).

**Manual verification (if dev server available):**
1. Start server with DATABASE_URL set
2. POST to `/api/teams` with `type: 'solo'` → creates team with 1 member
3. POST to `/api/teams` with `type: 'duo'` → creates team with 2 members
4. GET `/api/teams` → returns teams with type field present
5. Verify types in response: `{ team: { type: 'solo' | 'duo', ... } }`
</verification>

<success_criteria>
**Phase 1, Plan 1 complete when:**
1. prisma/schema.prisma has TeamType enum and type field on Team model
2. src/lib/types.ts has type field in TeamRecord
3. src/lib/teams.ts createTeam accepts type parameter and creates solo/duo teams correctly
4. src/app/api/teams/route.ts POST validates type and secondMemberUserId conditionally
5. prisma/seed.mjs includes type field for all teams
6. TypeScript strict mode: `npm run typecheck` passes
7. No breaking changes to existing team CRUD functionality
8. Dual-mode persistence not broken (in-memory fallback behavior per decisions D-10, D-11, D-12)

**Ready for Plan 2:** Member management endpoints can now assume type field exists and create teams accordingly.
</success_criteria>

<output>
After completion, create `.planning/phases/01-dynamic-team-management/01-PLAN-1-SUMMARY.md` with:
- What was built (type field, schema migration, domain layer updates)
- Files changed (list all modified files)
- API behavior changes (POST /api/teams now accepts type)
- Dependency status: Ready for Plan 2 (member management endpoints)
- Any issues discovered during implementation
- TypeScript and test suite status
</output>
