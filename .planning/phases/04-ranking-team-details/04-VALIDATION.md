---
phase: 4
slug: ranking-team-details
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4 + @testing-library/react 16 + Playwright 1.58 |
| **Config file** | `vitest.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test && npm run typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test && npm run typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | ranking-page | 1 | RANK-01 | unit | `npm run test -- src/components/ranking` | ❌ W0 | ⬜ pending |
| 4-01-02 | ranking-page | 1 | RANK-02 | unit | `npm run test -- src/app/api/matches` | ✅ | ⬜ pending |
| 4-02-01 | team-detail-page | 2 | RANK-03 | unit | `npm run test -- src/components/team` | ❌ W0 | ⬜ pending |
| 4-02-02 | team-detail-page | 2 | TEAM-02 | unit | `npm run test -- src/app/api/teams` | ✅ | ⬜ pending |
| 4-03-01 | h2h-comparison | 3 | RANK-04 | unit | `npm run test -- src/lib/data` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/ranking/__tests__/ranking-page.test.tsx` — stubs for RANK-01, RANK-02
- [ ] `src/components/team/__tests__/team-detail.test.tsx` — stubs for RANK-03, TEAM-02
- [ ] `src/app/(authenticated)/ranking/__tests__/page.test.tsx` — route-level stubs

*Existing vitest + Testing Library infrastructure is available; only test files need creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ranking updates within 1s of match creation | RANK-02 | Requires real DB + real Next.js revalidation | Register match via UI, observe ranking refresh without full page reload |
| Visual H2H comparison on team detail | RANK-04 | Layout/visual quality not automatable | Open team detail page, verify comparison section renders both team stats side-by-side |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
