---
phase: quick
plan: 260330-wfk
type: execute
wave: 1
depends_on: []
files_modified:
  - CLAUDE.md
  - README.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "CLAUDE.md references better-auth 1.5.6, not next-auth 4.24.13"
    - "README.md env var names match the actual runtime env vars (BETTER_AUTH_SECRET, BETTER_AUTH_URL)"
    - "No next-auth references remain in either documentation file"
  artifacts:
    - path: "CLAUDE.md"
      provides: "Accurate tech stack and architecture descriptions"
      contains: "better-auth 1.5.6"
    - path: "README.md"
      provides: "Accurate local development instructions"
      contains: "BETTER_AUTH_SECRET"
  key_links:
    - from: "CLAUDE.md"
      to: "src/app/api/auth/[...all]/route.ts"
      via: "Entry point documentation"
      pattern: "\\[...all\\]"
    - from: "README.md"
      to: "src/lib/auth.ts"
      via: "Env var documentation (BETTER_AUTH_SECRET, BETTER_AUTH_URL)"
      pattern: "BETTER_AUTH_"
---

<objective>
Update stale next-auth documentation references in CLAUDE.md and README.md to reflect the completed better-auth migration (Phase 09).

Purpose: Phase 09 migrated the runtime from next-auth 4.24.13 to better-auth 1.5.6, but CLAUDE.md and README.md still describe the old stack. Stale docs cause confusion for agents and developers reading them.
Output: CLAUDE.md and README.md accurately describe better-auth, BETTER_AUTH_SECRET, BETTER_AUTH_URL, and the [...all] route handler.
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
  <name>Task 1: Update CLAUDE.md next-auth references to better-auth</name>
  <files>CLAUDE.md</files>
  <action>
Apply the following targeted string replacements in CLAUDE.md. Do NOT touch any other content.

1. In the Tech Stack section:
   - Replace: `Auth.js v4 (next-auth 4.24.13) — credentials-only, JWT sessions`
   - With: `better-auth 1.5.6 — credentials-only, username/password sessions`

2. In the Key Dependencies list:
   - Replace: `next-auth 4.24.13 - Session and credential-based authentication`
   - With: `better-auth 1.5.6 - Session and credential-based authentication`

3. In the Architecture section, Auth layer "Contains" field:
   - Remove the NextAuthOptions reference. The actual auth.ts exports a `betterAuth` singleton (auth), migration middleware (migrationMiddleware), and helpers: `getAuthSession`, `getAuthenticatedUser`, `getAuthUnavailableResponse`, `getAuthRequiredResponse`, `hasDatabaseUrl`, `hasAuthSecret`, `isAuthAvailable`.
   - Replace the Contains description with: `better-auth singleton config (betterAuth), migration hook (createAuthMiddleware), session helpers: getAuthSession, getAuthenticatedUser; availability guards: getAuthUnavailableResponse, getAuthRequiredResponse`

4. In the Architecture section, Auth layer "Depends on" field:
   - Replace: `Depends on: bcryptjs, next-auth, Prisma`
   - With: `Depends on: bcryptjs, better-auth, Prisma`

5. In the Architecture section, Middleware layer "Depends on" field:
   - Replace: `Depends on: next-auth/middleware`
   - With: `Depends on: better-auth`

6. In the Entry Points section:
   - Replace: `src/app/api/auth/[...nextauth]/route.ts`
   - With: `src/app/api/auth/[...all]/route.ts`

   Also update any description text that mentions `POST /api/auth/signin`, `POST /api/auth/signout` as Auth.js internals. Replace the Responsibilities line for this entry point with: `Responsibilities: Proxy all better-auth HTTP requests; handles sign-in, sign-out, and session endpoints`
  </action>
  <verify>
    <automated>grep -n "next-auth\|nextauth\|NextAuthOptions\|NEXTAUTH" /home/guiroos/Documentos/Projects/office-8-ball/CLAUDE.md</automated>
  </verify>
  <done>The grep command returns zero matches (no next-auth, nextauth, NextAuthOptions, or NEXTAUTH strings remain in CLAUDE.md).</done>
</task>

<task type="auto">
  <name>Task 2: Update README.md next-auth references to better-auth</name>
  <files>README.md</files>
  <action>
Apply the following targeted string replacements in README.md. Do NOT touch any other content.

1. In the Stack section:
   - Replace: `Auth.js` (`next-auth`)
   - With: `better-auth`

2. In the "Desenvolvimento Local" section, env var block:
   - Replace: `NEXTAUTH_SECRET=algum-segredo-local`
   - With: `BETTER_AUTH_SECRET=algum-segredo-local`

3. In the "Variaveis De Ambiente" section:
   - Replace the `NEXTAUTH_SECRET` bullet:
     - Old: `NEXTAUTH_SECRET` / `segredo usado pelo Auth.js; obrigatorio sempre que DATABASE_URL estiver definido`
     - New: `BETTER_AUTH_SECRET` / `segredo usado pelo better-auth; obrigatorio sempre que DATABASE_URL estiver definido`
   - Replace the `NEXTAUTH_URL` bullet:
     - Old: `NEXTAUTH_URL` / `opcional em desenvolvimento; recomendado quando necessario para callbacks/sessoes`
     - New: `BETTER_AUTH_URL` / `opcional em desenvolvimento; recomendado quando necessario para callbacks/sessoes`
  </action>
  <verify>
    <automated>grep -n "next-auth\|nextauth\|NEXTAUTH\|Auth\.js" /home/guiroos/Documentos/Projects/office-8-ball/README.md</automated>
  </verify>
  <done>The grep command returns zero matches (no next-auth, nextauth, NEXTAUTH, or Auth.js strings remain in README.md).</done>
</task>

</tasks>

<verification>
After both tasks:

1. No next-auth references in either file:
   `grep -rn "next-auth\|nextauth\|NEXTAUTH\|NextAuthOptions" CLAUDE.md README.md`
   Expected: no output

2. better-auth references present in CLAUDE.md:
   `grep -c "better-auth" CLAUDE.md`
   Expected: >= 4

3. BETTER_AUTH env vars present in README.md:
   `grep -c "BETTER_AUTH" README.md`
   Expected: >= 2

4. Correct route entry in CLAUDE.md:
   `grep "\[...all\]" CLAUDE.md`
   Expected: at least one match
</verification>

<success_criteria>
- CLAUDE.md: All next-auth/NextAuthOptions/NEXTAUTH strings replaced with better-auth equivalents; entry point route updated to [...all]
- README.md: Stack line updated to better-auth; NEXTAUTH_SECRET and NEXTAUTH_URL renamed to BETTER_AUTH_SECRET and BETTER_AUTH_URL
- No src/ files, test files, .yml files, or .planning/research/ files touched
</success_criteria>

<output>
After completion, create `.planning/quick/260330-wfk-update-stale-next-auth-references-to-bet/260330-wfk-SUMMARY.md`
</output>
