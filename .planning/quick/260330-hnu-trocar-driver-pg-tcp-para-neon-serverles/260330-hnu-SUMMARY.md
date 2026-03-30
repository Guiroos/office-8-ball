---
phase: 260330-hnu
plan: 01
subsystem: database
tags: [prisma, neon, postgres, cloudflare, websocket, driver]

# Dependency graph
requires: []
provides:
  - Neon serverless WebSocket driver replacing pg TCP driver in prisma.ts
  - ws polyfill for Node.js environments; native WebSocket used in workerd
  - src/lib/prisma-client.ts re-export module for PrismaClient
affects: [vinext, cloudflare-workers, prisma, database-connections]

# Tech tracking
tech-stack:
  added:
    - "@neondatabase/serverless ^1.0.2 — Neon serverless WebSocket driver"
    - "@prisma/adapter-neon ^7.6.0 — Prisma driver adapter for Neon serverless"
    - "ws ^8.20.0 — WebSocket polyfill for Node.js"
    - "@types/ws ^8.18.1 — TypeScript types for ws"
  patterns:
    - "PrismaNeon takes PoolConfig (connectionString), not a Pool instance"
    - "ws polyfill applied conditionally: only when typeof WebSocket === 'undefined'"
    - "PrismaClient re-exported from src/lib/prisma-client.ts for indirection"

key-files:
  created:
    - src/lib/prisma-client.ts
  modified:
    - src/lib/prisma.ts
    - package.json
    - package-lock.json

key-decisions:
  - "PrismaNeon receives PoolConfig directly (not a Pool instance) — type-correct API usage"
  - "Created src/lib/prisma-client.ts re-export to decouple prisma.ts from @prisma/client direct import"
  - "Removed @prisma/adapter-pg; pg itself is not a direct dep so no separate uninstall needed"

patterns-established:
  - "Neon serverless pattern: neonConfig.webSocketConstructor = ws only for Node.js (typeof WebSocket check)"
  - "PrismaClient import indirection via @/lib/prisma-client for runtime portability"

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-03-30
---

# Phase 260330-hnu: Neon Serverless Driver Migration Summary

**Replaced pg TCP driver with @neondatabase/serverless WebSocket driver in prisma.ts so Prisma connections work in Cloudflare workerd runtime**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-30T12:48Z
- **Completed:** 2026-03-30T13:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Installed @neondatabase/serverless, @prisma/adapter-neon, ws, @types/ws; removed @prisma/adapter-pg
- Rewrote src/lib/prisma.ts to use PrismaNeon adapter with WebSocket driver
- Created src/lib/prisma-client.ts as PrismaClient re-export for import indirection
- ws polyfill applied only in Node.js; workerd uses native WebSocket
- All prisma-related type errors resolved; 43/45 test files pass (2 theme failures are pre-existing localStorage/jsdom issues unrelated to this change)

## Task Commits

1. **Task 1: Swap packages** - `f50464f` (chore)
2. **Task 2: Rewrite prisma.ts** - `4e61282` (feat)
3. **Task 3: Verify** - no commit (verification only, no file changes)

## Files Created/Modified
- `src/lib/prisma.ts` - Rewritten to use @neondatabase/serverless Pool + PrismaNeon adapter
- `src/lib/prisma-client.ts` - New re-export: `export { PrismaClient } from "@prisma/client"`
- `package.json` - Added @neondatabase/serverless, @prisma/adapter-neon, ws, @types/ws; removed @prisma/adapter-pg
- `package-lock.json` - Updated lockfile

## Decisions Made
- **PrismaNeon takes PoolConfig not Pool instance:** The NEON-FIX.md code passed `new Pool(...)` to `PrismaNeon`, but the `@prisma/adapter-neon` v7.x API expects a `PoolConfig` object. Fixed to `new PrismaNeon({ connectionString: databaseUrl })`.
- **Created prisma-client.ts re-export:** The plan's prisma.ts imports `PrismaClient` from `@/lib/prisma-client`, which didn't exist. Created a minimal re-export file to make the import resolve without changing the plan's intended code shape.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed PrismaNeon constructor call — PoolConfig required, not Pool instance**
- **Found during:** Task 2 (Rewrite prisma.ts)
- **Issue:** NEON-FIX.md code had `new Pool({ connectionString: databaseUrl })` then `new PrismaNeon(pool)`. TypeScript error: `Argument of type 'Pool' is not assignable to parameter of type 'PoolConfig'`. The @prisma/adapter-neon v7 PrismaNeon constructor takes `neon.PoolConfig`, not an instantiated Pool.
- **Fix:** Removed `Pool` import and instance; changed to `new PrismaNeon({ connectionString: databaseUrl })` directly.
- **Files modified:** src/lib/prisma.ts
- **Verification:** `npm run typecheck` shows 0 errors in prisma.ts
- **Committed in:** `4e61282` (Task 2 commit)

**2. [Rule 3 - Blocking] Created missing src/lib/prisma-client.ts re-export**
- **Found during:** Task 2 (Rewrite prisma.ts)
- **Issue:** The plan's prisma.ts imports `PrismaClient` from `@/lib/prisma-client`, but that file did not exist in the repo. TypeScript would fail to resolve the import.
- **Fix:** Created `src/lib/prisma-client.ts` with `export { PrismaClient } from "@prisma/client"`.
- **Files modified:** src/lib/prisma-client.ts (created)
- **Verification:** Import resolves, typecheck passes for prisma.ts
- **Committed in:** `4e61282` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 blocking issue)
**Impact on plan:** Both auto-fixes necessary for the code to compile and work correctly. The NEON-FIX.md code had an API mismatch with the installed adapter version; the re-export file was a missing prerequisite.

## Issues Encountered
- Pre-existing TypeScript errors in ranking.ts, team-details.ts, teams.ts, data.ts (implicit any) — out of scope, not caused by this change. Logged for awareness.
- Pre-existing test failures in theme-core.test.ts and theme-provider.test.tsx (localStorage API unavailable in jsdom) — pre-existing, unrelated to Neon driver. 297 tests pass.

## User Setup Required
None - no external service configuration required. DATABASE_URL connection string format is unchanged; the Neon serverless driver uses the same postgresql:// URL via WebSocket.

## Next Phase Readiness
- Neon serverless driver is active; Cloudflare workerd connections should no longer hang
- No prisma client regeneration needed unless schema changes
- The `ws` polyfill ensures Node.js dev and CI environments work identically

---
*Phase: 260330-hnu*
*Completed: 2026-03-30*
