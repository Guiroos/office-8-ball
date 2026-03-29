---
phase: 9
slug: auth-migration-next-auth-to-better-auth
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-28
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- src/lib/auth.test.ts src/components/login/login-screen.test.tsx` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- src/lib/auth.test.ts`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green + `npm run typecheck`
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | AUTH-MIGRATION-01 | unit | `npm run test -- src/lib/auth.test.ts` | ⚠️ needs update | ⬜ pending |
| 09-01-02 | 01 | 0 | AUTH-MIGRATION-05 | unit | `npm run test -- src/components/login/login-screen.test.tsx` | ⚠️ needs update | ⬜ pending |
| 09-01-03 | 01 | 0 | AUTH-MIGRATION-06 | unit | `npm run test -- src/components/authenticated/app-shell.test.tsx` | ⚠️ needs update | ⬜ pending |
| 09-01-04 | 01 | 1 | AUTH-MIGRATION-01/02 | unit | `npm run test -- src/lib/auth.test.ts` | ⚠️ W0 | ⬜ pending |
| 09-01-05 | 01 | 1 | AUTH-MIGRATION-03/04 | unit | `npm run test -- src/lib/auth.test.ts` | ⚠️ W0 | ⬜ pending |
| 09-01-06 | 01 | 2 | AUTH-MIGRATION-05 | unit | `npm run test -- src/components/login/login-screen.test.tsx` | ⚠️ W0 | ⬜ pending |
| 09-01-07 | 01 | 2 | AUTH-MIGRATION-06 | unit | `npm run test -- src/components/authenticated/app-shell.test.tsx` | ⚠️ W0 | ⬜ pending |
| 09-01-08 | 01 | 3 | AUTH-MIGRATION-07 | e2e | `npm run e2e` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/auth.test.ts` — Update mocks: replace `vi.mock("next-auth", ...)` and `vi.mock("next-auth/providers/credentials", ...)` with mocks for better-auth's `auth.api.getSession`. Replace `getServerSessionMock` stub.
- [ ] `src/components/login/login-screen.test.tsx` — Replace `vi.mock("next-auth/react", ...)` with `vi.mock("@/lib/auth-client", ...)`. Update `signInMock` to match `authClient.signIn.username` return shape `{ data, error }`.
- [ ] `src/components/authenticated/app-shell.test.tsx` — Replace `vi.mock("next-auth/react", ...)` with `vi.mock("@/lib/auth-client", ...)`. Update `signOut` mock.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login + session persists across page reload | AUTH-MIGRATION-03 | Requires real DB + browser cookie | Start dev server, login, reload, confirm still authenticated |
| Register flow creates user + auto-login | AUTH-MIGRATION-03 | E2E with DB | Use Playwright test if available, else manual |
| Unauthenticated visit to /dashboard redirects to /login | AUTH-MIGRATION-07 | E2E | Visit /dashboard without session cookie — should redirect |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
