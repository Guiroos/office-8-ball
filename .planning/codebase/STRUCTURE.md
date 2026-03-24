# STRUCTURE.md — Directory Layout & Organization

## Root Layout

```
office-8-ball/
├── src/                    # Application source
│   ├── app/                # Next.js App Router pages & API routes
│   ├── components/         # React components (organized by domain)
│   ├── lib/                # Domain logic, auth, Prisma, constants
│   └── types/              # TypeScript declaration files
├── prisma/                 # Schema, migrations, seed
│   ├── schema.prisma
│   ├── seed.mjs
│   └── migrations/
├── techspec/               # Architecture and operational docs
├── e2e/                    # Playwright end-to-end tests
├── .claude/                # Claude Code configuration (rules, hooks, agents)
│   └── rules/              # Domain invariants and coding conventions
├── public/                 # Static assets
├── middleware.ts           # Auth guard for protected routes
├── vitest.config.ts        # Vitest unit/integration test config
└── playwright.config.ts    # E2E test config
```

## `src/app/` — Next.js App Router

```
src/app/
├── (authenticated)/        # Route group — all routes require session
│   ├── layout.tsx          # Authenticated shell layout (sidebar + app shell)
│   ├── dashboard/
│   │   └── page.tsx        # Main scoreboard page
│   ├── ranking/
│   │   └── page.tsx        # Ranking view (placeholder)
│   ├── settings/
│   │   └── page.tsx        # Settings (placeholder)
│   ├── times/
│   │   └── page.tsx        # Teams view (placeholder)
│   └── profile/
│       └── page.tsx        # User profile page
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts    # Auth.js v4 catch-all handler
│   │   └── register/route.ts        # POST /api/auth/register
│   ├── matches/route.ts             # GET/POST /api/matches
│   ├── scoreboard/route.ts          # GET /api/scoreboard
│   ├── teams/
│   │   ├── route.ts                 # GET/POST /api/teams
│   │   └── [id]/
│   │       ├── route.ts             # GET/PUT /api/teams/:id
│   │       └── archive/route.ts     # POST /api/teams/:id/archive
│   ├── users/route.ts               # GET /api/users
│   └── profile/route.ts             # GET/PATCH /api/profile
├── login/
│   └── page.tsx            # Public login/register page
├── scoreboard/
│   └── page.tsx            # Legacy redirect → /dashboard
├── layout.tsx              # Root layout (ThemeProvider, Toaster)
├── page.tsx                # Root redirect (by session state)
├── error.tsx               # Error boundary
└── not-found.tsx           # 404 page
```

## `src/components/` — Component Organization

```
src/components/
├── ui/                     # shadcn/ui primitives (Button, Card, Input, Badge, Dialog…)
├── primitives/             # Domain reusables built on top of ui/
│   ├── stat-tile.tsx       # Metric display tile
│   ├── section-header.tsx  # Section heading primitive
│   ├── form-field.tsx      # Labeled form field wrapper
│   └── icon-callout.tsx    # Icon + text callout
├── dashboard/              # Dashboard feature components
│   ├── index.tsx           # Dashboard entry point (re-exports)
│   ├── dashboard-hero.tsx  # Scoreboard hero section
│   ├── dashboard-sidebar.tsx
│   ├── dashboard-utils.tsx
│   ├── recent-matches-card.tsx
│   └── use-dashboard-data.ts   # Data fetching hook (React hooks only)
├── authenticated/          # App shell and layout components
│   ├── app-shell.tsx       # Main layout shell with sidebar
│   └── placeholder-page.tsx
├── login/
│   └── login-screen.tsx    # Login/register form
├── profile/
│   ├── profile-page.tsx
│   └── profile-edit-dialog.tsx
├── theme/
│   ├── theme-core.ts       # Design token definitions
│   ├── theme-provider.tsx  # Theme context provider
│   └── theme-toggle.tsx    # Dark/light toggle
└── route-state-screen.tsx  # Loading/error state wrapper
```

## `src/lib/` — Domain Logic

```
src/lib/
├── constants.ts            # Team IDs, TEAMS array — authoritative team source
├── types.ts                # All shared TypeScript types
├── data.ts                 # DB queries: listMatches, createMatch
├── teams.ts                # Team helpers: isTeamMember, getScoreboard
├── auth.ts                 # Auth.js config, session helpers, auth guards
├── auth-validation.ts      # Zod schemas for login/register payloads
├── auth-rate-limit.ts      # In-memory rate limiter for auth endpoints
├── prisma.ts               # Prisma client singleton
└── utils.ts                # cn() tailwind class merger
```

## `prisma/` — Database

```
prisma/
├── schema.prisma           # Data model: User, Team, TeamMember, Match
├── seed.mjs                # Seed default teams into DB
└── migrations/             # Sequential numbered migrations (001_, 002_…)
```

## Naming Conventions

| Artifact | Convention | Example |
|----------|------------|---------|
| Component files | kebab-case | `dashboard-hero.tsx` |
| Hook files | kebab-case prefixed `use-` | `use-dashboard-data.ts` |
| Test files | co-located, `.test.ts(x)` suffix | `route.test.ts` |
| API routes | Next.js convention `route.ts` | `src/app/api/matches/route.ts` |
| Type names | PascalCase | `TeamRecord`, `MatchRecord` |
| Constants | SCREAMING_SNAKE | `TEAMS`, `AUTH_RATE_LIMIT_ERROR` |
| Exports | Named everywhere except page/layout/route | `export function GET()` |
| Imports | `@/` alias only — no relative `../` | `import { TEAMS } from "@/lib/constants"` |

## Where to Add New Code

| Need | Location |
|------|----------|
| New shadcn primitive | `src/components/ui/` |
| New domain component | `src/components/{feature}/` |
| New API route | `src/app/api/{resource}/route.ts` |
| New domain type | `src/lib/types.ts` |
| New domain query | `src/lib/data.ts` |
| New protected page | `src/app/(authenticated)/{name}/page.tsx` |
| New public page | `src/app/{name}/page.tsx` |
| New DB table | `prisma/schema.prisma` + new migration |

## Key Rules

- All routes under `src/app/(authenticated)/` are session-protected via `middleware.ts`
- Never use relative imports (`../`) — always use `@/` alias
- Named exports everywhere except Next.js page/layout/route files (which use default exports)
- Dashboard state managed with React hooks only — no external state library
- Test files co-located next to source files
