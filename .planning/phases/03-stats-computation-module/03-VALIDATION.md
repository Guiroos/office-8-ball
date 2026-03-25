---
phase: 3
slug: stats-computation-module
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npm run test -- src/lib/stats.test.ts -x` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds (quick), ~15 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- src/lib/stats.test.ts -x`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | SC-1,SC-2 | unit | `npm run test -- src/lib/stats.test.ts --grep "wins and losses"` | ❌ W0 | pending |
| 3-01-02 | 01 | 0 | SC-2 | unit | `npm run test -- src/lib/stats.test.ts --grep "zero matches"` | ❌ W0 | pending |
| 3-01-03 | 01 | 0 | SC-2 | unit | `npm run test -- src/lib/stats.test.ts --grep "single match"` | ❌ W0 | pending |
| 3-01-04 | 01 | 0 | SC-2 | unit | `npm run test -- src/lib/stats.test.ts --grep "large dataset"` | ❌ W0 | pending |
| 3-01-05 | 01 | 1 | SC-3 | unit | `npm run test -- src/lib/stats.test.ts --grep "streak"` | ❌ W0 | pending |
| 3-01-06 | 01 | 1 | SC-4 | unit | `npm run test -- src/lib/stats.test.ts --grep "head-to-head"` | ❌ W0 | pending |
| 3-01-07 | 01 | 1 | SC-6 | unit | `npm run test -- src/lib/stats.test.ts --grep "validation"` | ❌ W0 | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/stats.ts` — Core implementation file (stubs or full implementation)
- [ ] `src/lib/stats.test.ts` — Test file with stubs covering all success criteria SC-1..SC-6:
  - [ ] 0 matches → stats with 0% win rate, no streaks
  - [ ] 1 match (win) → stats with 100% win rate, currentStreak = win/1
  - [ ] 1 match (loss) → stats with 0% win rate, currentStreak = loss/1
  - [ ] Multiple matches → accurate wins/losses/win rate
  - [ ] 100+ match dataset → aggregation correctness
  - [ ] Current streak: 3 consecutive wins → `{ type: "win", count: 3 }`
  - [ ] Current streak broken by loss → `{ type: "loss", count: 1 }`
  - [ ] Longest streak detected correctly after streak breaks
  - [ ] H2H: filters correctly when teams in normal order
  - [ ] H2H: filters correctly when teams in reversed order
  - [ ] H2H: teamAWins + teamBWins === totalMatches
  - [ ] Zod validation: rejects NaN win rate
  - [ ] Zod validation: rejects negative win rate
  - [ ] Zod validation: rejects win rate > 100
  - [ ] Zod validation: rejects negative streak count

*Existing Vitest infrastructure covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
