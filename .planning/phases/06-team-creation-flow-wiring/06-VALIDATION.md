---
phase: 6
slug: team-creation-flow-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + testing-library + playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test -- src/app/api/teams/route.test.ts` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- src/app/api/teams/route.test.ts`
- **After every plan wave:** Run `npm run test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | TEAM-01 | component | `npm run test -- src/components/teams/team-create-form.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | TEAM-01 | route | `npm run test -- src/app/api/teams/route.test.ts` | ✅ | ⬜ pending |
| 06-02-01 | 02 | 2 | TEAM-01 | e2e | `npm run e2e -- e2e/team-create-flow.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/teams/team-create-form.test.tsx` — create-tab submit and error/success handling
- [ ] `e2e/team-create-flow.spec.ts` — authenticated create-solo flow E2E

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Authenticated create flow in real runtime with DB + Auth.js session | TEAM-01 | Local shell currently lacks `DATABASE_URL` and `NEXTAUTH_SECRET` | Configure env vars, run app, sign in, create team via `/times?tab=create`, confirm team appears in list and dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
