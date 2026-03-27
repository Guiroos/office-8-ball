---
phase: 05
slug: user-profiles-advanced-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + testing-library + playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test -- src/lib` |
| **Full suite command** | `npm run typecheck && npm run test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- src/lib`
- **After every plan wave:** Run `npm run typecheck && npm run test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | PROF-01 | unit | `npm run test -- src/lib/profile-stats` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | PROF-02 | unit | `npm run test -- src/lib/profile-stats` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | PROF-03 | integration | `npm run test -- src/app/api/profile` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | RANK-05 | unit/integration | `npm run test -- src/lib/ranking` | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 2 | PROF-01,PROF-03 | e2e/manual | `npm run e2e -- --grep head-to-head` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/profile-stats.test.ts` — stubs for PROF-01, PROF-02, PROF-03
- [ ] `src/lib/time-period.test.ts` — boundaries for `all|month|week` (America/Sao_Paulo)
- [ ] `src/app/(authenticated)/head-to-head/page.test.tsx` — URL fallback and validation states

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| URL deep-link sharing across `/head-to-head` selector changes | PROF-01, PROF-03 | Browser history/navigation behavior is hard to assert purely in unit tests | Open `/head-to-head`, change Team A/B, refresh, and confirm pair and URL stay synchronized |
| Ranking empty-state messaging with `period` + `type` combined filters | RANK-05 | PT-BR copy and combined-filter UX verification | Open `/ranking?type=solo&period=week` on low-data window and confirm empty state keeps filters visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
