---
phase: 2
slug: scoreboard-reactivation-match-recording
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- src/app/api/scoreboard/route.test.ts` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- src/app/api/scoreboard/route.test.ts`
- **After every plan wave:** Run `npm run test` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | TBD | 0 | DASH-01 | component | `npm run test -- src/components/dashboard/index.test.tsx` | ❌ W0 | ⬜ pending |
| 2-01-02 | TBD | 0 | DASH-02 | unit | `npm run test -- src/lib/data.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-03 | TBD | 1 | DASH-02 | unit/route | `npm run test -- src/app/api/scoreboard/route.test.ts` | ✅ Placeholder | ⬜ pending |
| 2-01-04 | TBD | 1 | DASH-02 | unit/route | `npm run test -- src/app/api/matches/route.test.ts` | ✅ Exists | ⬜ pending |
| 2-01-05 | TBD | 2 | DASH-02 | e2e | `npm run e2e -- scoreboard.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/scoreboard/route.test.ts` — rewrite placeholder; full test coverage for dynamic team scoreboard
- [ ] `src/components/dashboard/index.test.tsx` — new; test dynamic team rendering (replaces hardcoded TEAMS constant)
- [ ] `src/lib/data.test.ts` — new tests for `getScoreboard()` no-limit query guarantee
- [ ] `e2e/scoreboard.spec.ts` — new E2E: create match → verify in scoreboard (real DB)

*Framework already installed (Vitest 4.1.0); no install action needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| API response < 500ms for 100+ matches | DASH-02 | Performance benchmark requires real DB at scale | Seed 100+ matches; time GET /api/scoreboard; verify < 500ms |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
