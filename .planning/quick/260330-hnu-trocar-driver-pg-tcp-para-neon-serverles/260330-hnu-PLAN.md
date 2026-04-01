---
phase: 260330-hnu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/prisma.ts
  - package.json
  - package-lock.json
autonomous: true
requirements: []
must_haves:
  truths:
    - "prisma.ts uses @neondatabase/serverless Pool + PrismaNeon adapter"
    - "ws polyfill is applied in Node.js environments (typeof WebSocket === 'undefined')"
    - "@prisma/adapter-pg is no longer installed"
    - "npm run build passes without type errors"
  artifacts:
    - path: "src/lib/prisma.ts"
      provides: "Neon serverless Prisma client factory"
      contains: "PrismaNeon"
  key_links:
    - from: "src/lib/prisma.ts"
      to: "@neondatabase/serverless"
      via: "Pool + neonConfig import"
      pattern: "from \"@neondatabase/serverless\""
---

<objective>
Replace the pg TCP driver with the Neon serverless WebSocket driver so that Prisma connections work reliably inside the Cloudflare workerd runtime (vinext dev + production).

Purpose: The pg TCP persistent connection is not reliably supported in workerd. Neon serverless uses WebSocket, which workerd supports natively.
Output: Updated src/lib/prisma.ts using @neondatabase/serverless + @prisma/adapter-neon; old adapter removed.
</objective>

<execution_context>
@/home/guiroos/Documentos/Projects/office-8-ball/.claude/get-shit-done/workflows/execute-plan.md
@/home/guiroos/Documentos/Projects/office-8-ball/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Swap packages — install Neon driver, remove pg adapter</name>
  <files>package.json, package-lock.json</files>
  <action>
    Run the following commands in order:

    1. Install Neon serverless driver and Prisma adapter:
       npm install @neondatabase/serverless @prisma/adapter-neon

    2. Install ws and its types (Node.js WebSocket polyfill):
       npm install ws
       npm install --save-dev @types/ws

    3. Remove the old pg adapter (pg and @types/pg are NOT direct deps in package.json — only @prisma/adapter-pg is):
       npm uninstall @prisma/adapter-pg

    After all installs, verify the following appear in package.json dependencies:
    - @neondatabase/serverless
    - @prisma/adapter-neon
    - ws (in dependencies)
    - @types/ws (in devDependencies)

    And verify @prisma/adapter-pg is gone from package.json.
  </action>
  <verify>
    <automated>node -e "const p = JSON.parse(require('fs').readFileSync('package.json','utf8')); const ok = p.dependencies['@neondatabase/serverless'] && p.dependencies['@prisma/adapter-neon'] && p.dependencies['ws'] && p.devDependencies['@types/ws'] && !p.dependencies['@prisma/adapter-pg']; process.exit(ok ? 0 : 1);"</automated>
  </verify>
  <done>package.json has @neondatabase/serverless, @prisma/adapter-neon, ws, @types/ws; @prisma/adapter-pg is absent.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite src/lib/prisma.ts with Neon serverless driver</name>
  <files>src/lib/prisma.ts</files>
  <action>
    Overwrite src/lib/prisma.ts with exactly the following content (from NEON-FIX.md):

    ```ts
    import { Pool, neonConfig } from "@neondatabase/serverless";
    import { PrismaNeon } from "@prisma/adapter-neon";
    import ws from "ws";
    import { PrismaClient } from "@/lib/prisma-client";

    declare global {
      var __office8ballPrisma: PrismaClient | undefined;
    }

    const globalForPrisma = globalThis as typeof globalThis & {
      __office8ballPrisma?: PrismaClient;
    };

    function createPrismaClient(): PrismaClient {
      const log: Array<"error" | "warn"> =
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
      const databaseUrl = process.env.DATABASE_URL?.trim();

      if (!databaseUrl) {
        return new PrismaClient({ log });
      }

      // Node.js precisa de ws para WebSocket; workerd tem WebSocket nativo.
      if (typeof WebSocket === "undefined") {
        neonConfig.webSocketConstructor = ws;
      }

      const pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaNeon(pool);

      return new PrismaClient({ adapter, log });
    }

    export const prisma =
      globalForPrisma.__office8ballPrisma ??
      (globalForPrisma.__office8ballPrisma = createPrismaClient());
    ```

    Do NOT keep any of the old pg-specific code (buildPoolConnectionString, getPgSslConfig, PrismaPg, Pool from "pg"). The new file is a clean rewrite.
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | tail -5</automated>
  </verify>
  <done>src/lib/prisma.ts imports from @neondatabase/serverless and @prisma/adapter-neon; typecheck passes with no errors.</done>
</task>

<task type="auto">
  <name>Task 3: Verify build and tests pass</name>
  <files></files>
  <action>
    Run the test suite and build to confirm nothing is broken:

    1. npm run test
    2. npm run build

    If build fails with a module-not-found error for @prisma/adapter-pg, double-check Task 1 completed correctly.
    If typecheck fails, verify prisma.ts matches the exact content from Task 2.

    Tests that mock prisma (via vi.mock('@/lib/prisma')) are unaffected by the driver swap — they should all continue passing.
  </action>
  <verify>
    <automated>npm run test 2>&1 | tail -10</automated>
  </verify>
  <done>All unit tests pass. npm run build completes without errors. No references to @prisma/adapter-pg remain in src/.</done>
</task>

</tasks>

<verification>
- grep -r "adapter-pg" src/ returns no results
- grep -r "from \"pg\"" src/ returns no results
- src/lib/prisma.ts contains "PrismaNeon" and "@neondatabase/serverless"
- npm run typecheck exits 0
- npm run test passes
</verification>

<success_criteria>
- @prisma/adapter-pg removed from package.json and node_modules
- src/lib/prisma.ts uses @neondatabase/serverless Pool + PrismaNeon adapter
- ws polyfill applied only when typeof WebSocket === "undefined" (Node.js path)
- All existing unit tests continue to pass (prisma is mocked in tests; driver is irrelevant)
- TypeScript strict check passes
</success_criteria>

<output>
After completion, create `.planning/quick/260330-hnu-trocar-driver-pg-tcp-para-neon-serverles/260330-hnu-SUMMARY.md`
</output>
