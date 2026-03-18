---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing

## Data Layer Tests

Tests that exercise the in-memory data layer must follow this isolation pattern in `beforeEach`:

```ts
delete process.env.DATABASE_URL;
vi.resetModules();
```

Then re-import the module under test with a dynamic import inside each test:

```ts
const { getScoreboard, listMatches } = await import("@/lib/data");
```

The in-memory `memoryState` is module-level. A static top-level import would share state across tests, producing non-deterministic results. `vi.resetModules()` resets that state between tests.

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

Real Auth.js session resolution is never exercised in unit/route tests. Omitting this mock causes `getAuthenticatedUser` to call `getServerSession`, which fails in jsdom and produces false negatives. The rest of `@/lib/auth` is spread from `importActual` to preserve other exports like `getAuthRequiredResponse`.

## General Conventions

- Test files are co-located with their implementation (e.g. `src/lib/data.test.ts` alongside `src/lib/data.ts`).
- Use `vi.useFakeTimers()` + `vi.setSystemTime()` whenever a test depends on `playedAt` timestamps — do not rely on wall-clock time.
- Prisma is never imported in tests. All data-layer tests run in in-memory mode; route tests mock auth and let the data layer use in-memory mode via the absent `DATABASE_URL`.
