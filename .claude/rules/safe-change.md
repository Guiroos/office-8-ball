# Safe Change Checklist

Before finishing, check:

1. Does the app still support both persistence modes (Prisma and in-memory)?
2. Is the scoreboard still derived from match history?
3. Are `frontend` and `backend` still the only accepted team ids unless the task explicitly changed that?
4. Did `/dashboard` remain the real functional flow while `/scoreboard` stayed available as a legacy redirect?
5. Did API response shapes stay compatible with the current UI?
6. Did login, signup, and protected routes stay consistent with the current auth model?
7. Did you update docs only where behavior actually changed?

---

## Task Routing Guide

Use as the default review map before editing.

### GitHub Actions or repository operations

Read:
1. `techspec/github-operations.md`
2. `README.md`
3. `package.json`
4. `.github/workflows/*`

Constraint: keep Vercel as deployment platform; use GitHub for validation only. If the task changes release or deploy behavior, also review `techspec/git-conventions.md` and `vercel.json`.

### Scoreboard or match-history changes

Read:
1. `src/lib/data.ts`
2. `src/lib/types.ts`
3. `src/app/api/matches/route.ts`
4. `src/app/api/scoreboard/route.ts`
5. Relevant dashboard components and tests

### Dashboard UI changes

Read:
1. `src/components/dashboard/index.tsx`
2. `src/components/dashboard/use-dashboard-data.ts`
3. Relevant subcomponents in `src/components/dashboard/`
4. `src/components/dashboard.test.tsx`
5. `src/components/ui/composition.test.tsx` when shared composition primitives are involved

### Login/auth changes

Read:
1. `src/app/page.tsx`
2. `src/app/login/page.tsx`
3. `src/components/login/login-screen.tsx`
4. `src/components/login/login-screen.test.tsx`
5. `src/lib/auth-validation.ts` when validation rules are involved

Constraint: keep auth simple unless the user explicitly asks to extend it.

### Persistence or schema changes

Read:
1. `prisma/schema.prisma`
2. `prisma/seed.mjs`
3. `src/lib/data.ts`
4. Relevant API route tests

Constraint: do not break the in-memory fallback unless the user explicitly approves that change.

---

## Validation Commands

Run the smallest useful set for the area changed.

```bash
npm run lint
npm run test
npm run e2e
npm run typecheck
npm run build
```

Targeted per-file checks:

```bash
npm run test -- src/lib/data.test.ts
npm run test -- src/app/api/matches/route.test.ts
npm run test -- src/app/api/scoreboard/route.test.ts
npm run test -- src/components/dashboard.test.tsx
npm run test -- src/components/login/login-screen.test.tsx
npm run test -- src/components/ui/composition.test.tsx
npm run test -- src/lib/auth-validation.test.ts
```

Database commands (require `DATABASE_URL`):

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

Notes:
- `postinstall` runs `prisma generate` automatically
- If you change API shape, verify the calling UI
- If you change routing, verify `/`, `/login`, and `/scoreboard`

---

## Known Gaps

- No password recovery
- No email verification
- No profile/nickname UI
- No Prisma-backed integration tests
- No E2E coverage for auth rate limit or deeper negative-path variants
