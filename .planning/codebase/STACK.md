# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**
- TypeScript 5 - Application code, all `.ts` and `.tsx` files
- JavaScript ES2017 - Configuration files, migration seeds

**Markup & Styling:**
- JSX/TSX - React component markup
- CSS - Tailwind-generated styles via PostCSS
- HTML - Server-rendered via Next.js

## Runtime

**Environment:**
- Node.js (via Next.js/Vercel) - All execution
- Browser (Chrome/Chromium) - E2E testing via Playwright

**Package Manager:**
- npm - Dependency management
- Lockfile: `package-lock.json` (present, committed)

## Frameworks & Core Libraries

**Primary Framework:**
- Next.js 16.1.6 - Full-stack framework with App Router
  - Location: Entry points in `src/app/`
  - Features: Server components, API routes, middleware, built-in image optimization

**UI/Frontend:**
- React 19.2.3 - Component library and hooks
- Tailwind CSS 4.2.1 - Utility-first styling
  - PostCSS 4 - CSS processing (custom plugin for Turbopack compatibility at `postcss.config.mjs`)
- shadcn/ui 4.0.8 - Headless component library (Radix UI wrappers)
- class-variance-authority 0.7.1 - Type-safe component variants
- clsx 2.1.1 - Conditional classname merging
- tailwind-merge 3.5.0 - Tailwind class conflict resolution
- next-themes 0.4.6 - Theme provider (light/dark/sepia via localStorage)
- Geist Font (next/font/google) - Default typeface

**Testing:**
- Vitest 4.1.0 - Unit and component test runner
  - Config: `vitest.config.ts` with jsdom environment
  - Coverage: v8 provider with html reporter
- @testing-library/react 16.3.2 - Component testing utilities
- @testing-library/jest-dom 6.9.1 - DOM matchers
- @testing-library/user-event 14.6.1 - User interaction simulation
- jsdom 28.1.0 - DOM implementation for test environment

**E2E Testing:**
- Playwright 1.58.2 - Headless browser automation
  - Config: `playwright.config.ts`
  - Browsers: Chromium (Desktop Chrome)
  - Features: Screenshots on failure, video retention, trace recording
  - CI: Single worker, 2 retries; Local: parallel workers, no retries

## Build & Development Tools

**Development Server:**
- Next.js dev server - Hot reload on file changes
- npm run dev - Localhost:3000

**Build System:**
- Next.js build (`next build`) - Static and server-side rendering
- Turbopack - Bundler (default for next dev and next build)

**Type Checking:**
- TypeScript 5 with strict mode
  - `tsc --noEmit` - Standalone type check
  - ES2017 target, esModuleInterop enabled
  - Path alias `@/*` → `./src/*`

**Linting & Formatting:**
- ESLint 9 - JavaScript linting
  - Config: `eslint.config.mjs` (flat config format)
  - Extends: `eslint-config-next/core-web-vitals` and `/typescript`
- Prettier - Presumed for formatting (not explicitly configured; shadcn installs it)

**Database Tools:**
- Prisma 6.19.2 - ORM and schema management
  - Config: `prisma.config.ts`
  - Client: `@prisma/client` auto-generated on `postinstall`
  - Generator: Binary targets for native and RHEL OpenSSL 3.0.x

## Key Dependencies

**Critical - Authentication & Security:**
- next-auth 4.24.13 - Session and credential-based authentication
  - Provider: CredentialsProvider (username/password)
  - Session strategy: JWT
  - Secure cookies in production
  - Location: `src/lib/auth.ts`
- bcryptjs 3.0.3 - Password hashing (for credential validation)

**Critical - Database & Persistence:**
- @prisma/client 6.19.2 - Database client for PostgreSQL
  - In-memory fallback via `src/lib/data.ts` when DATABASE_URL is absent
  - Prisma client auto-generated on postinstall
  - Location: `src/lib/prisma.ts` (singleton pattern)

**UI Components - Radix-based:**
- @radix-ui/react-dialog 1.1.15 - Modal/dialog primitives
- @radix-ui/react-scroll-area 1.2.10 - Custom scrollbar
- @radix-ui/react-separator 1.1.8 - Visual divider
- @radix-ui/react-slot 1.2.4 - Slot composition pattern

**UI Components - Icons:**
- lucide-react 0.577.0 - Icon library (SVG icons as React components)

**UI Components - UI Utilities:**
- @base-ui/react 1.3.0 - Base unstyled UI components

**Data Validation:**
- Zod 4.3.6 - Schema validation and TypeScript inference
  - Location: Validation in auth, API payloads

**UI Enhancements:**
- sonner 2.0.7 - Toast notifications (presumed from package name)
- tw-animate-css 1.4.0 - Tailwind animation utilities

**Observability:**
- @vercel/speed-insights 2.0.0 - Core Web Vitals monitoring
  - Location: `src/app/layout.tsx` via `SpeedInsights` component

**Development Utilities:**
- dotenv 17.3.1 - Environment variable loading for Prisma config

## Configuration Files

**TypeScript:**
- `tsconfig.json` - Strict mode, ES2017 target, Next.js plugin, path aliases

**Next.js:**
- `next.config.ts - Security headers (CSP, X-Frame-Options, HSTS in production), remote image patterns

**Prisma:**
- `prisma.config.ts` - PostgreSQL datasource, schema at `prisma/schema.prisma`, migrations at `prisma/migrations`, seed at `prisma/seed.mjs`

**Testing:**
- `vitest.config.ts` - jsdom, `@/` path alias, mock for `next/image`, coverage via v8
- `playwright.config.ts` - Chromium only, baseURL from `PLAYWRIGHT_BASE_URL`, test dir `e2e/`, HTML reporter

**Build & Development:**
- `postcss.config.mjs` - Tailwind v4 PostCSS plugin + custom wildcard font-size removal for Turbopack
- `eslint.config.mjs` - ESLint 9 flat config with Next.js defaults

**Package Management:**
- `package.json` - Scripts for dev, build, test, lint, typecheck, e2e, prisma

## Environment Variables

**Required for Authentication:**
- `DATABASE_URL` - PostgreSQL connection string (Neon Postgres recommended)
- `NEXTAUTH_SECRET` - Auth.js session signing secret (only required when DATABASE_URL is set)

**Optional for Development:**
- `NEXTAUTH_URL` - Session callback URL (defaults to `http://localhost:3000` in dev)

**Optional for Observability:**
- `NEXT_PUBLIC_APP_ENV` - Shown in UI; values: "development", "preview", "production"

**Optional for E2E Testing:**
- `PLAYWRIGHT_BASE_URL` - Test server URL (defaults to `http://127.0.0.1:3000`)
- `CI` - Set by CI runner; triggers single-worker Playwright mode and retries

**Not Configured (Fallback Mode):**
When `DATABASE_URL` is absent, the app runs in in-memory mode:
- Authentication is disabled
- Matches and users are stored in RAM
- Used for local development and unit test isolation

## Platform Requirements

**Development:**
- Node.js (version managed by project; run `node --version` to verify)
- PostgreSQL (or Neon Postgres account for remote DB)
- Chromium (installed via `npm run e2e:install` for Playwright)

**Production:**
- Vercel (primary deployment platform)
- PostgreSQL database (Neon or compatible)
- Node.js runtime environment

**Browser Compatibility:**
- Modern browsers (Chrome/Edge/Firefox/Safari)
- E2E tests only run on Chromium (Desktop Chrome profile)

---

*Stack analysis: 2026-03-23*
