---
phase: quick-260330-wnc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/(authenticated)/head-to-head/page.test.tsx
  - src/components/ranking/ranking-view.test.tsx
  - src/components/login/login-screen.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "All 10 previously failing tests pass"
    - "npm run test exits with code 0 for the three affected test files"
  artifacts:
    - path: "src/app/(authenticated)/head-to-head/page.test.tsx"
      provides: "Fixed mock factory with vi.hoisted()"
    - path: "src/components/ranking/ranking-view.test.tsx"
      provides: "Fixed mock factory with vi.hoisted()"
    - path: "src/components/login/login-screen.tsx"
      provides: "Redirect to /dashboard after successful auth"
  key_links:
    - from: "src/components/login/login-screen.tsx"
      to: "/dashboard"
      via: "router.push('/dashboard')"
      pattern: "router\\.push.*dashboard"
---

<objective>
Fix 10 failing Vitest tests across three files:

- 8 failures from Vitest mock factory hoisting violations in ranking-view.test.tsx and head-to-head/page.test.tsx
- 2 failures from redirect mismatch in login-screen.test.tsx (tests expect /dashboard, implementation redirects to /profile)

Purpose: Restore green test suite without altering any production behavior beyond the redirect destination.
Output: Three files modified, all 10 tests passing.
</objective>

<execution_context>
@/home/guiroos/Documentos/Projects/office-8-ball/.claude/get-shit-done/workflows/execute-plan.md
@/home/guiroos/Documentos/Projects/office-8-ball/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/260330-wnc-fix-10-failing-tests-vitest-mock-factory/260330-wnc-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix vi.hoisted() mock factory violations in head-to-head and ranking tests</name>
  <files>
    src/app/(authenticated)/head-to-head/page.test.tsx,
    src/components/ranking/ranking-view.test.tsx
  </files>
  <action>
Vitest hoists `vi.mock()` calls above all variable declarations. Any top-level variable referenced directly (not via a deferred closure) inside a factory will hit the temporal dead zone and be `undefined`.

**head-to-head/page.test.tsx — two factories reference top-level vi.fn() directly:**

Lines 24-36 define `mockListUserTeams` and `mockListMatches` as `vi.fn()`, then the factories at lines 26-28 and 33-35 reference them directly:
```ts
vi.mock("@/lib/teams", () => ({
  listUserTeams: mockListUserTeams,   // direct reference — broken
}));
vi.mock("@/lib/data", () => ({
  listMatches: mockListMatches,        // direct reference — broken
}));
```

Fix: use `vi.hoisted()` to declare these fns before the factory runs:
```ts
const { mockListUserTeams, mockListMatches } = vi.hoisted(() => ({
  mockListUserTeams: vi.fn<() => Promise<TeamRecord[]>>(),
  mockListMatches: vi.fn<() => Promise<MatchRecord[]>>(),
}));
```
Then replace the standalone `const mockListUserTeams = vi.fn<...>()` and `const mockListMatches = vi.fn<...>()` declarations with the destructured result above. The factory references stay the same (they now resolve correctly).

**ranking-view.test.tsx — three factories reference top-level vi.fn() directly:**

Lines 8-10 define `mockListAllTeamsWithStats`, `mockHasDatabaseUrl`, `mockPush`. The factories at lines 12-32 wrap them in arrow functions (`(...args) => mockListAllTeamsWithStats(...args)`) which defers the read to call time. However, `mockPush` in the `next/navigation` factory is referenced directly:
```ts
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),  // closure deferring — ok
}));
```
This is a closure, so the read of `mockPush` is deferred to when `useRouter()` is called. It should work. Re-examine: the true issue is that `mockPush` is declared with `const` at line 10, and `vi.mock()` for `next/navigation` at line 12 returns an object where `push: mockPush` evaluates `mockPush` lazily inside `useRouter: () => ({...})` — this IS deferred. So these three mocks in ranking-view.test.tsx should technically work.

Run the tests first to confirm which file actually fails:
```bash
npm run test -- src/components/ranking/ranking-view.test.tsx --reporter=verbose 2>&1 | head -60
npm run test -- src/app/(authenticated)/head-to-head/page.test.tsx --reporter=verbose 2>&1 | head -60
```

If ranking-view.test.tsx passes but head-to-head fails, only fix head-to-head. If both fail, apply vi.hoisted() to head-to-head (definite fix) and convert ranking-view mocks to vi.hoisted() pattern too for consistency.

For head-to-head, the definitive fix is:

Remove the two standalone `vi.fn()` declarations and replace with:
```ts
const { mockListUserTeams, mockListMatches } = vi.hoisted(() => ({
  mockListUserTeams: vi.fn<() => Promise<TeamRecord[]>>(),
  mockListMatches: vi.fn<() => Promise<MatchRecord[]>>(),
}));
```

Place this block BEFORE the `vi.mock()` calls in the file (it will be hoisted anyway, but placing it before makes intent clear). The `vi.mock()` factory bodies can then reference `mockListUserTeams` and `mockListMatches` directly since vi.hoisted() guarantees they are initialized before any factory runs.

The `hasDatabaseUrlReturnValue` and `currentUser` let variables in head-to-head/page.test.tsx are used inside the `@/lib/auth` factory via closures: `vi.fn(() => hasDatabaseUrlReturnValue)` and `vi.fn(async () => currentUser)`. These are closures that read the variable at call time, not factory time — they are correct and do not need vi.hoisted(). Leave them as-is.
  </action>
  <verify>
    <automated>cd /home/guiroos/Documentos/Projects/office-8-ball && npm run test -- src/app/(authenticated)/head-to-head/page.test.tsx src/components/ranking/ranking-view.test.tsx --reporter=verbose 2>&1 | tail -20</automated>
  </verify>
  <done>Both test files pass with 0 failures. The "5 tests | 5 passed" and "11 tests | 11 passed" (or similar counts) confirmed in output.</done>
</task>

<task type="auto">
  <name>Task 2: Fix redirect destination in login-screen.tsx from /profile to /dashboard</name>
  <files>src/components/login/login-screen.tsx</files>
  <action>
In `src/components/login/login-screen.tsx`, line 230:
```ts
router.push("/profile");
```
Change to:
```ts
router.push("/dashboard");
```

This is a single-line change inside `handleSubmit`. The redirect fires after both login and registration succeed. Tests in login-screen.test.tsx at lines 71 and 140 expect `pushMock` called with `"/dashboard"`. The test names confirm intent: "redirects to the dashboard".

Do not change any other behavior in the file.
  </action>
  <verify>
    <automated>cd /home/guiroos/Documentos/Projects/office-8-ball && npm run test -- src/components/login/login-screen.test.tsx --reporter=verbose 2>&1 | tail -20</automated>
  </verify>
  <done>All login-screen tests pass. The two previously failing redirect tests now show "passed".</done>
</task>

<task type="auto">
  <name>Task 3: Run full test suite to confirm no regressions</name>
  <files></files>
  <action>
Run the complete test suite to confirm all 10 previously failing tests now pass and no regressions were introduced.
  </action>
  <verify>
    <automated>cd /home/guiroos/Documentos/Projects/office-8-ball && npm run test 2>&1 | tail -30</automated>
  </verify>
  <done>Full test run exits 0. Test count matches or exceeds previous passing count. No new failures.</done>
</task>

</tasks>

<verification>
- `npm run test -- src/app/(authenticated)/head-to-head/page.test.tsx` exits 0
- `npm run test -- src/components/ranking/ranking-view.test.tsx` exits 0
- `npm run test -- src/components/login/login-screen.test.tsx` exits 0
- `npm run test` full suite exits 0
- `npm run typecheck` passes (no TS errors from the changes)
</verification>

<success_criteria>
All 10 previously failing tests pass. No new failures introduced. The three changed files: head-to-head/page.test.tsx uses vi.hoisted() for mock fns, login-screen.tsx redirects to /dashboard.
</success_criteria>

<output>
After completion, create `.planning/quick/260330-wnc-fix-10-failing-tests-vitest-mock-factory/260330-wnc-SUMMARY.md` with:
- files_changed: list of files modified
- tests_fixed: count and names of previously failing tests now passing
- approach: brief description of each fix applied
</output>
