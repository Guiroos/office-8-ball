---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing

## Data Layer Tests

Data layer tests (e.g. `src/lib/data.test.ts`, `src/lib/stats.test.ts`) do not rely on an in-memory fallback — there is no `memoryState` to reset. The data layer returns empty/default responses when `DATABASE_URL` is absent, so tests stub Prisma at the module level or work with pure functions that receive match arrays as arguments.

For modules that check `hasDatabaseUrl()` internally, ensure `DATABASE_URL` is absent in the test environment (delete it in `beforeEach` if needed) so the guard path is exercised without a real database.

## Route Tests

Route tests must mock `@/lib/auth` and stub `getAuthenticatedUser` with a controllable `vi.fn()`:

```ts
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});
```

Real better-auth session resolution is never exercised in unit/route tests. Omitting this mock causes `getAuthenticatedUser` to attempt a real session lookup, which fails in jsdom and produces false negatives. The rest of `@/lib/auth` is spread from `importActual` to preserve other exports like `getAuthRequiredResponse`.

## General Conventions

- Test files are co-located with their implementation (e.g. `src/lib/data.test.ts` alongside `src/lib/data.ts`).
- Use `vi.useFakeTimers()` + `vi.setSystemTime()` whenever a test depends on `playedAt` timestamps — do not rely on wall-clock time.
- Prisma is never imported in tests. All data-layer tests run in in-memory mode; route tests mock auth and let the data layer use in-memory mode via the absent `DATABASE_URL`.
