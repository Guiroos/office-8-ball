# Project Discovery Checklist

Files to inspect during Phase 2 (Project Context Analysis). Read only the files that exist.

## Package / Manifest (pick one)
- `package.json` — Node.js/TypeScript projects
- `Cargo.toml` — Rust projects
- `go.mod` — Go projects
- `pyproject.toml` or `setup.py` — Python projects
- `build.gradle` / `pom.xml` — JVM projects
- `composer.json` — PHP projects

## Framework / Config Files
- `next.config.js` / `next.config.ts` — Next.js config and features
- `vite.config.ts` — Vite setup, aliases, plugins
- `tsconfig.json` — TypeScript target, paths, strict settings
- `.eslintrc` / `eslint.config.js` — Linting rules
- `prettier.config.js` / `.prettierrc` — Formatting rules

## Infrastructure
- `docker-compose.yml` — Local services (DB, cache, queues)
- `.env.example` — Required environment variables
- `Makefile` — Developer commands not in package.json

## Database
- `prisma/schema.prisma` — ORM schema and provider
- `drizzle.config.ts` — Drizzle ORM config
- `migrations/` directory listing — Migration naming conventions

## CI/CD
- `.github/workflows/` listing — What pipelines run and when
- `Dockerfile` — Build target and base image

## Testing
- `vitest.config.ts` / `jest.config.js` — Test framework setup
- `playwright.config.ts` / `cypress.config.js` — E2E setup

## Key Source Directories (root listing only)
- Scan the root directory listing to identify: `src/`, `app/`, `lib/`, `packages/`, `apps/` (monorepo), `tests/`, `docs/`.
- Do NOT recurse into subdirectories unless a specific section requires it.
