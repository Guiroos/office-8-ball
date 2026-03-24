# CONVENTIONS.md — Code Style & Patterns

## Language & Tooling

- **TypeScript** strict mode — `tsconfig.json` targets ES2017+, `moduleResolution: bundler`
- **ESLint** via `next/core-web-vitals` + `@typescript-eslint`; run with `npm run lint`
- **Prettier** for formatting (implicit via Next.js toolchain)
- All source files in `src/` use `"use client"` directive only when needed (RSC-first)

## Import Conventions

- **Always** use `@/` path alias — never relative `../` paths
- Named imports for everything except Next.js page/layout/route files
- Group order: external packages → `@/lib/*` → `@/components/*` → local

```ts
// Good
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { listMatches } from "@/lib/data";
import type { MatchesResponse } from "@/lib/types";

// Bad
import { listMatches } from "../../lib/data";
```

## Naming

| Artifact | Convention | Example |
|----------|------------|---------|
| Files | `kebab-case` | `dashboard-hero.tsx`, `use-dashboard-data.ts` |
| React components | `PascalCase` | `DashboardHero`, `StatTile` |
| Functions/variables | `camelCase` | `getAuthenticatedUser`, `currentUser` |
| Types/interfaces | `PascalCase` | `TeamRecord`, `MatchRecord`, `SessionUser` |
| Constants | `SCREAMING_SNAKE` | `TEAMS`, `AUTH_RATE_LIMIT_ERROR` |
| Route handlers | Named exports matching HTTP verbs | `export async function GET()` |
| Hooks | `use` prefix | `useDashboardData` |

## Component Patterns

### CVA for Variants

Use `cva()` at module scope for components with multiple visual states:

```tsx
const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "bg-gold-gradient ...",
      ghost: "border border-border ...",
    },
    size: {
      default: "h-11 px-5",
      sm: "h-9 px-4 text-xs",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

Combine with `cn()` from `@/lib/utils` for conditional merging.

### Styling Rules

- **Semantic design tokens only** — no arbitrary Tailwind values (`[#abc123]`, `[var(--token)]`)
- Shadow pattern: `shadow-sm shadow-{color}/{opacity}` (e.g., `shadow-sm shadow-gold/35`)
- Shadow states: `shadow-sm` rest → `shadow-md` hover → `shadow-xs` active
- Never use `style={{}}` when a token class exists

### Client vs Server Components

- Server components by default (no `"use client"`)
- Add `"use client"` only when using browser APIs, event handlers, or React hooks
- Data fetching hooks (`use-dashboard-data.ts`) are client-side

## Type Patterns

All shared types live in `src/lib/types.ts`. Extend this file; don't scatter types.

### Domain Types

```ts
export type TeamRecord = { id: string; name: string; status: TeamStatus; ... };
export type MatchRecord = { id: string; teamAId: string; winnerTeamId: string; ... };
```

### API Response Types

Every API route types its `NextResponse.json<T>()` call:

```ts
return NextResponse.json<MatchesResponse>({ matches });
return NextResponse.json<ApiErrorResponse>({ error: "..." }, { status: 400 });
```

## API Route Patterns

### Auth Guard (every protected route)

```ts
export async function GET() {
  if (!hasDatabaseUrl()) return getAuthUnavailableResponse();  // 503
  const user = await getAuthenticatedUser();
  if (!user) return getAuthRequiredResponse();                 // 401
  // ...handler body
}
```

### Input Validation

- Use Zod schemas for request body validation
- Return HTTP 400 with `{ error: string }` on validation failure
- Validate before any DB write

```ts
const result = createMatchSchema.safeParse(payload);
if (!result.success) {
  return NextResponse.json<ApiErrorResponse>(
    { error: result.error.issues[0]?.message ?? "Dados inválidos." },
    { status: 400 },
  );
}
```

### HTTP Status Codes (do not change without updating client-side handlers)

| Status | Meaning |
|--------|---------|
| 200 | Successful GET |
| 201 | Successful POST (creation) |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Forbidden (not a team member) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Business rule violation |
| 429 | Rate limited |
| 500 | Internal server error |
| 503 | Auth/DB unavailable |

## Error Handling

### Server Side

- Auth failures: use `getAuthRequiredResponse()` / `getAuthUnavailableResponse()` from `@/lib/auth`
- Validation failures: Zod `safeParse` + return 400 with first issue message
- Not found: return 404 with `{ error: "..." }`
- Business violations: return 422 with descriptive message

### Client Side

- API errors surface through `use-dashboard-data.ts` hook state
- Toast notifications via `sonner` for user-facing feedback

## Language in Code

- Error messages and validation messages in **Brazilian Portuguese**
- Code identifiers, comments, and type names in **English**
- Git commits in English (conventional commits)
- PR bodies in Portuguese (sections: "O que muda" / "Como testar")

## In-Memory Fallback Pattern

`src/lib/data.ts` checks `hasDatabaseUrl()` at the top of each function:

```ts
if (!hasDatabaseUrl()) return [];  // in-memory/offline mode
```

This is the test harness and local dev path when `DATABASE_URL` is absent.

## Component Layer Rules

- `ui/` components: shadcn primitives only, no domain logic
- `primitives/` components: domain-aware reusables (StatTile, SectionHeader)
- Feature components import from `ui/` and `primitives/` — never cross-feature imports
