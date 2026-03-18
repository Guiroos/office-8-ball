# Claude Code Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AGENTS.md (Codex) with a lean root CLAUDE.md + auto-loaded .claude/rules/ files as the authoritative Claude Code instruction source.

**Architecture:** New root CLAUDE.md stays under 80 lines (core context only). Two rules files under .claude/rules/ carry domain invariants, working rules, runtime behavior, safe-change checklist, task routing, and validation commands. Both AGENTS.md and .claude/CLAUDE.md are deleted.

**Tech Stack:** Markdown only — no application code changes.

---

## File Map

| Action  | Path                        | Responsibility                                              |
|---------|-----------------------------|-------------------------------------------------------------|
| Replace | `CLAUDE.md`                 | Core context loaded every session (~70 lines)               |
| Create  | `.claude/rules/domain.md`   | Domain invariants, working rules, runtime behavior          |
| Create  | `.claude/rules/safe-change.md` | Safe-change checklist, task routing, validation commands |
| Delete  | `AGENTS.md`                 | Was Codex authoritative guide — no longer needed            |
| Delete  | `.claude/CLAUDE.md`         | Was duplicate of old root CLAUDE.md — no longer needed      |

---

### Task 1: Replace root CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Verify current state**

```bash
wc -l CLAUDE.md
head -5 CLAUDE.md
```

Expected: file exists, starts with `# CLAUDE.md`, currently delegates to AGENTS.md.

- [ ] **Step 2: Replace CLAUDE.md with new content**

Replace the entire file with:

```markdown
# CLAUDE.md

Office 8 Ball is an internal scoreboard app for office pool matches between two fixed teams (`frontend` and `backend`). Flow: login → `/dashboard` → register a match winner → scoreboard updates. See `.claude/rules/` for domain invariants, working rules, and safe-change checklist.

## Source of Truth

When sources disagree: `src/` and `prisma/` > `README.md` and `techspec/` > `PRD.md`.

- `techspec/` — technical docs and architecture decisions
- `techspec/github-operations.md` — CI and repository protection
- `techspec/git-conventions.md` — release flow and deploy prerequisites

## Commands

```bash
# Development
npm run dev           # Start dev server (http://localhost:3000)
npm run build         # Production build
npm run typecheck     # TypeScript strict check

# Testing
npm run test                              # Run all unit/component tests
npm run test:watch                        # Watch mode
npm run test -- src/lib/data.test.ts     # Run a single test file
npm run e2e                               # Playwright E2E tests
npm run e2e:ui                            # Playwright UI mode

# Quality
npm run lint

# Database (requires DATABASE_URL)
npm run prisma:migrate    # Run migrations in dev
npm run prisma:deploy     # Deploy migrations to production
npm run prisma:seed       # Seed teams into DB
npm run prisma:generate   # Regenerate Prisma client (runs on postinstall)
```

## Architecture

**Stack:** Next.js (App Router) · React 19 · Prisma + PostgreSQL · Auth.js v4 · Tailwind CSS · Zod · Vitest · Playwright

**Routes:**
- `/` — redirects by session state
- `/login` — login/signup (public)
- `/(authenticated)/dashboard` — main scoreboard (protected)
- `/(authenticated)/**` — placeholder pages (protected)
- `/api/scoreboard` — GET aggregated scoreboard (session required)
- `/api/matches` — GET/POST matches (session required)
- `/api/auth/register` — POST signup

**Persistence (`src/lib/data.ts`):**
- `DATABASE_URL` present → Prisma + Postgres
- `DATABASE_URL` absent → in-memory fallback (local dev only, no auth)
- Scoreboard is always derived from match history, never stored as counters

**Auth (`src/lib/auth.ts`, `auth-validation.ts`, `auth-rate-limit.ts`):**
- Credentials-only via Auth.js with JWT sessions
- Zod schemas in `auth-validation.ts` shared by client and server
- Rate limiting: 5 failures in 10 min → progressive blocks (15/30/60 min), keyed by `email + IP`
- Requires both `DATABASE_URL` and `NEXTAUTH_SECRET`

**Middleware (`middleware.ts`):** protects `/(authenticated)` routes; no-op if auth env vars missing.

## Environment Variables

```
DATABASE_URL=postgresql://...       # Required for auth and shared persistence
NEXTAUTH_SECRET=...                 # Required when DATABASE_URL is set
NEXTAUTH_URL=http://localhost:3000  # Optional in dev
```

## Testing

- Unit/integration: Vitest + Testing Library (jsdom)
- E2E: Playwright with a real temporary Postgres (configured in CI)
- Run a specific file: `npm run test -- <path>`
- Coverage: `npm run test:coverage`
```

- [ ] **Step 3: Verify line count**

```bash
wc -l CLAUDE.md
```

Expected: under 80 lines.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: replace CLAUDE.md with lean Claude Code–native version"
```

---

### Task 2: Create .claude/rules/domain.md

**Files:**
- Create: `.claude/rules/domain.md`

- [ ] **Step 1: Verify rules directory does not exist yet**

```bash
ls .claude/rules/ 2>/dev/null || echo "directory does not exist"
```

Expected: `directory does not exist` (or empty).

- [ ] **Step 2: Create .claude/rules/ directory and domain.md**

```bash
mkdir -p .claude/rules
```

Create `.claude/rules/domain.md` with:

```markdown
# Domain

## Invariants

- Only two valid team ids: `frontend` and `backend`
- Team definitions are hard-coded in `src/lib/constants.ts`
- Scoreboard values are always derived from `matches` — never stored as counters
- `leaderTeamId` is `null` on ties
- `leadBy` is the absolute win difference
- `currentStreak` is based on newest consecutive wins by the latest winner

## Team Behavior Files

When touching team behavior, review all of:

- `src/lib/constants.ts`
- `src/lib/types.ts`
- `src/lib/data.ts`
- `src/app/api/matches/route.ts`
- `prisma/seed.mjs`
- `prisma/schema.prisma`

## Working Rules

**Prefer small, concrete changes.** Avoid unless explicitly requested: multi-team abstractions, admin concepts, caching layers, client state libraries, stored aggregate counters.

**Match the existing UX intent.**
- Scoreboard UX should stay fast and obvious
- Copy should stay short, readable, and playful
- Auth UX: credentials only, no fake providers
- Keep the green billiards-table visual direction unless the task explicitly changes it
- `/dashboard` remains the main authenticated entry; `/scoreboard` remains a legacy redirect

**Be precise about persistence.** When changing `src/lib/data.ts`, verify behavior both with and without `DATABASE_URL`. Do not assume the database is the source of team truth — teams are mirrored in code and seeded into the DB.

**Keep docs honest.** If your change alters real behavior, update:
- `.claude/rules/` files — for agent workflow, domain, or architecture changes
- `techspec/` — for technical decisions or architecture changes
- `README.md` — for setup or runtime usage changes

Prefer short corrections over broad doc rewrites.

## Runtime Behavior

### Persistence Modes

- With `DATABASE_URL`: Prisma + Postgres
- Without `DATABASE_URL`: in-memory fallback (local dev only)

Important:
- In-memory data disappears on server restart
- Login/signup require `DATABASE_URL` (users persist only in Postgres)
- Rate limiting also persists only when `DATABASE_URL` is available
- If `DATABASE_URL` exists without `NEXTAUTH_SECRET`, treat as invalid configuration

### Match Creation

`POST /api/matches` accepts `winnerTeamId` (required) and `note` (optional, max 140 chars).

Validation:
- `winnerTeamId` must be `frontend` or `backend`
- `note` is trimmed; empty values normalized to `null`

### UI Data Flow

- Scoreboard UI fetches `/api/scoreboard` and `/api/matches`
- After registering a win, UI re-fetches both endpoints
- No optimistic scoreboard updates before persistence succeeds
- With `DATABASE_URL`, middleware protects the authenticated area; page/API layers also validate session
- Login screen handles both `entrar` and `criar conta`; validates on blur or submit; remote field errors returned on conflict
- Repeated auth failures trigger progressive blocks keyed by `email + IP`
```

- [ ] **Step 3: Verify file exists**

```bash
wc -l .claude/rules/domain.md
```

Expected: file exists with content.

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/domain.md
git commit -m "docs: add .claude/rules/domain.md with invariants, working rules, and runtime behavior"
```

---

### Task 3: Create .claude/rules/safe-change.md

**Files:**
- Create: `.claude/rules/safe-change.md`

- [ ] **Step 1: Create safe-change.md**

Create `.claude/rules/safe-change.md` with:

```markdown
# Safe Change Checklist

Before finishing, check:

1. Does the app still support both persistence modes (Prisma and in-memory)?
2. Is the scoreboard still derived from match history?
3. Are `frontend` and `backend` still the only accepted team ids unless the task explicitly changed that?
4. Did `/dashboard` remain the real functional flow while `/scoreboard` stayed available as a legacy redirect?
5. Did API response shapes stay compatible with the current UI?
6. Did login, signup, and protected routes stay consistent with the current auth model?
7. Did you update docs only where behavior actually changed?

---

## Task Routing Guide

Use as the default review map before editing.

### GitHub Actions or repository operations

Read:
1. `techspec/github-operations.md`
2. `README.md`
3. `package.json`
4. `.github/workflows/*`

Constraint: keep Vercel as deployment platform; use GitHub for validation only. If the task changes release or deploy behavior, also review `techspec/git-conventions.md` and `vercel.json`.

### Scoreboard or match-history changes

Read:
1. `src/lib/data.ts`
2. `src/lib/types.ts`
3. `src/app/api/matches/route.ts`
4. `src/app/api/scoreboard/route.ts`
5. Relevant dashboard components and tests

### Dashboard UI changes

Read:
1. `src/components/dashboard/index.tsx`
2. `src/components/dashboard/use-dashboard-data.ts`
3. Relevant subcomponents in `src/components/dashboard/`
4. `src/components/dashboard.test.tsx`
5. `src/components/ui/composition.test.tsx` when shared composition primitives are involved

### Login/auth changes

Read:
1. `src/app/page.tsx`
2. `src/app/login/page.tsx`
3. `src/components/login/login-screen.tsx`
4. `src/components/login/login-screen.test.tsx`
5. `src/lib/auth-validation.ts` when validation rules are involved

Constraint: keep auth simple unless the user explicitly asks to extend it.

### Persistence or schema changes

Read:
1. `prisma/schema.prisma`
2. `prisma/seed.mjs`
3. `src/lib/data.ts`
4. Relevant API route tests

Constraint: do not break the in-memory fallback unless the user explicitly approves that change.

---

## Validation Commands

Run the smallest useful set for the area changed.

```bash
npm run lint
npm run test
npm run e2e
npm run typecheck
npm run build
```

Targeted per-file checks:

```bash
npm run test -- src/lib/data.test.ts
npm run test -- src/app/api/matches/route.test.ts
npm run test -- src/app/api/scoreboard/route.test.ts
npm run test -- src/components/dashboard.test.tsx
npm run test -- src/components/login/login-screen.test.tsx
npm run test -- src/components/ui/composition.test.tsx
npm run test -- src/lib/auth-validation.test.ts
```

Database commands (require `DATABASE_URL`):

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

Notes:
- `postinstall` runs `prisma generate` automatically
- If you change API shape, verify the calling UI
- If you change routing, verify `/`, `/login`, and `/scoreboard`

---

## Known Gaps

- No password recovery
- No email verification
- No profile/nickname UI
- No Prisma-backed integration tests
- No E2E coverage for auth rate limit or deeper negative-path variants
```

- [ ] **Step 2: Verify file exists**

```bash
wc -l .claude/rules/safe-change.md
```

Expected: file exists with content.

- [ ] **Step 3: Commit**

```bash
git add .claude/rules/safe-change.md
git commit -m "docs: add .claude/rules/safe-change.md with checklist, task routing, and validation commands"
```

---

### Task 4: Delete AGENTS.md and .claude/CLAUDE.md

**Files:**
- Delete: `AGENTS.md`
- Delete: `.claude/CLAUDE.md`

- [ ] **Step 1: Verify both files exist**

```bash
ls -la AGENTS.md .claude/CLAUDE.md
```

Expected: both files listed.

- [ ] **Step 2: Delete AGENTS.md**

```bash
git rm AGENTS.md
```

- [ ] **Step 3: Delete .claude/CLAUDE.md**

`.claude/CLAUDE.md` may not be tracked by git yet (directory was previously untracked). Handle both cases:

```bash
# If tracked by git:
git rm .claude/CLAUDE.md

# If not tracked (git rm fails), remove manually and stage the whole .claude/ additions:
rm .claude/CLAUDE.md
```

- [ ] **Step 4: Verify deletions**

```bash
git status
```

Expected: `AGENTS.md` shown as deleted, `.claude/CLAUDE.md` either deleted or absent from `git status` untracked files.

- [ ] **Step 5: Commit**

```bash
git add -A .claude/
git commit -m "docs: remove AGENTS.md and .claude/CLAUDE.md — replaced by CLAUDE.md + .claude/rules/"
```

---

### Task 5: Final verification

- [ ] **Step 1: Verify new file structure**

```bash
ls -la CLAUDE.md .claude/rules/
```

Expected: `CLAUDE.md` at root, `domain.md` and `safe-change.md` in `.claude/rules/`.

- [ ] **Step 2: Verify deleted files are gone**

```bash
ls AGENTS.md 2>/dev/null && echo "EXISTS - ERROR" || echo "Deleted OK"
ls .claude/CLAUDE.md 2>/dev/null && echo "EXISTS - ERROR" || echo "Deleted OK"
```

Expected: both print `Deleted OK`.

- [ ] **Step 3: Verify CLAUDE.md is under 80 lines**

```bash
wc -l CLAUDE.md
```

Expected: 80 or fewer lines.

- [ ] **Step 4: Check git log**

```bash
git log --oneline -5
```

Expected: 4 commits visible from this migration (tasks 1–4).
