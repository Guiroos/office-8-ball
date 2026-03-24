# TESTING.md — Test Structure & Patterns

## Frameworks

| Layer | Framework | Config |
|-------|-----------|--------|
| Unit / Integration | Vitest 4 + @testing-library/react 16 | `vitest.config.ts` |
| End-to-End | Playwright | `playwright.config.ts` |

## Test File Organization

Test files are **co-located** with their implementation:

```
src/lib/data.ts              → src/lib/data.test.ts
src/lib/auth.ts              → src/lib/auth.test.ts
src/app/api/matches/route.ts → src/app/api/matches/route.test.ts
src/components/ui/button.tsx → src/components/ui/button.test.tsx
```

No separate `__tests__/` directories.

## Running Tests

```bash
npm run test              # All unit/component tests
npm run test:watch        # Watch mode
npm run test -- src/lib/data.test.ts  # Single file

npm run e2e               # Playwright E2E (requires real Postgres, CI only)
npm run e2e:ui            # Playwright interactive UI
```

## Vitest Configuration

- Environment: `jsdom` (browser-like DOM for React component tests)
- Path alias: `@/` maps to `src/`
- Setup file configures `@testing-library/jest-dom` matchers

## Critical Isolation Patterns

### Data Layer Tests (module-level state)

`memoryState` in `src/lib/data.ts` is module-level. Tests must reset it between cases:

```ts
import { afterEach, beforeEach, describe, it, vi } from "vitest";

describe("data.ts", () => {
  beforeEach(() => {
    vi.resetModules();                  // REQUIRED: resets memoryState
    delete process.env.DATABASE_URL;    // force in-memory mode
  });

  it("...", async () => {
    // REQUIRED: dynamic import INSIDE each test
    const { listMatches } = await import("@/lib/data");
    // ...
  });
});
```

**Why:** Static top-level imports share the same module instance across tests → non-deterministic state leakage.

### Route Tests (auth mocking)

All route tests mock `@/lib/auth` to prevent real Auth.js session resolution:

```ts
let currentUser: { id: string; username: string } | null = {
  id: "user-abc",
  username: "gui.dev",
};

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,                                        // preserve all other exports
    getAuthenticatedUser: vi.fn(async () => currentUser),
  };
});
```

Set `currentUser = null` to test unauthenticated scenarios.

**Why:** `getServerSession()` calls fail in jsdom environment (no real HTTP context).

### Prisma is NEVER imported in tests

All tests run against in-memory mode. Mock Prisma when a route directly accesses it:

```ts
const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    team: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    match: { create: (...args: unknown[]) => mockFindMany(...args) },
  },
}));
```

### Timestamps

Use fake timers for any test that depends on `playedAt` or date logic:

```ts
vi.useFakeTimers();
vi.setSystemTime(new Date("2026-03-22T10:00:00.000Z"));
// ... test ...
vi.useRealTimers();
```

## Test Structure — Route Tests

```ts
describe("/api/matches", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";  // enable DB-mode checks
    vi.resetModules();
    mockFindMany.mockReset();
    currentUser = { id: "user-abc", username: "gui.dev" };
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  describe("GET", () => {
    it("returns 200 with matches for authenticated user", async () => {
      mockListMatches.mockResolvedValue([fakeMatch]);
      const { GET } = await import("@/app/api/matches/route");
      const response = await GET();
      expect(response.status).toBe(200);
    });

    it("returns 401 when not authenticated", async () => {
      currentUser = null;
      const { GET } = await import("@/app/api/matches/route");
      const response = await GET();
      expect(response.status).toBe(401);
    });
  });
});
```

## Test Structure — Component Tests

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });
});
```

## End-to-End Tests (Playwright)

- Located in `e2e/`
- Run against real PostgreSQL (not in-memory mode)
- CI-only — not run in local unit test suite
- Test full user flows: login → dashboard → register match → scoreboard update

## What is NOT tested

- Prisma client itself (it's a third-party library)
- Real Auth.js session flow in unit tests
- Real network calls in unit tests
