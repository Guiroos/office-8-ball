# AGENTS.md

## Project

Office Sinuca Tracker is a Next.js 16 app for recording office pool matches. The current product state uses dynamic, user-created teams plus authenticated ranking, dashboard, profile, and team pages.

Do not rely on the legacy "frontend vs backend only" framing in older docs when the code or planning artifacts disagree.

## Source Of Truth

When sources conflict, prefer them in this order:

1. `src/` and `prisma/`
2. `.planning/PROJECT.md`
3. `README.md` and `techspec/`
4. `CLAUDE.md`
5. `PRD.md`

Use `.claude/rules/*.md` as focused reference material, not as unconditional truth when the codebase has moved on.

For GSD work, also treat `.planning/ROADMAP.md`, `.planning/STATE.md`, and the relevant phase directory under `.planning/phases/` as first-class context.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript 5
- Prisma + PostgreSQL
- better-auth v1.5.6 with credentials-only auth and session-based auth
- Tailwind CSS 4 + shadcn/ui
- Vitest + Testing Library
- Playwright

## Important Paths

- `src/app/(authenticated)/`
- `src/app/api/`
- `src/components/`
- `src/lib/`
- `prisma/`
- `.planning/`
- `.codex/`

## Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run e2e`

Use the narrowest verification that proves the change. For cross-cutting work, run at least `npm run typecheck` plus the relevant test target.

## Hard Constraints

- Do not edit `prisma/schema.prisma` without explicit approval. If approved, update migrations and seed together.
- Do not install new packages without approval.
- Keep both persistence modes working: DB-backed mode and in-memory mode without `DATABASE_URL`.
- Do not change protected API statuses `401`, `409`, `429`, `500`, or `503` without updating client handling and tests.
- Keep `/dashboard` as the functional authenticated route. `/scoreboard` stays a legacy redirect.
- Keep scoreboard and team stats derived from match history; do not introduce persisted aggregate counters unless explicitly requested.
- Use `@/` imports instead of relative `../` imports.
- Use named exports except where Next.js requires default exports for page/layout files.
- Prefer server components by default; add `"use client"` only when hooks, browser APIs, or event handlers require it.

## Current Domain Notes

- Teams are dynamic and user-created.
- `src/lib/stats.ts` is the reusable stats module for ranking and head-to-head calculations.
- `/api/teams` and `/api/scoreboard` are active API surfaces.
- Some older tests and docs still reference fixed team ids; treat current application code and `.planning/PROJECT.md` as the authoritative state.

## Testing Rules

- Data-layer tests that depend on in-memory state should reset modules and re-import dynamically:
  - `delete process.env.DATABASE_URL`
  - `vi.resetModules()`
  - dynamic `await import(...)`
- Route tests should mock `@/lib/auth` and should not call real better-auth session resolution.
- Unit and route tests should not import Prisma directly.

## Consult These Before Editing

- Auth or middleware: `.claude/rules/auth.md`
- API routes: `.claude/rules/api-patterns.md`
- UI components or tokens: `.claude/rules/ui-components.md`
- Tests: `.claude/rules/testing.md`
- Sidebar or authenticated shell: `techspec/sidebar-layout.md`
- Theme changes: `techspec/theme-system.md`
- CI, releases, or deploy flow: `techspec/github-operations.md` and `techspec/git-conventions.md`

## Safe Finish Checklist

- In-memory mode still works.
- DB-backed mode assumptions were preserved.
- No forbidden package or schema changes slipped in.
- API shapes still match the current UI.
- Docs were updated only when behavior actually changed.
