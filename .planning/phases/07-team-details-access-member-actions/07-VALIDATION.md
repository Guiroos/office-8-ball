---
phase: 7
slug: team-details-access-member-actions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + testing-library + playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test -- src/lib/team-details.test.ts` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- src/lib/team-details.test.ts`
- **After every plan wave:** Run `npm run test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | TEAM-02 | unit | `npm run test -- src/lib/team-details.test.ts` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | TEAM-02 | component | `npm run test -- src/components/teams/team-detail-access-denied.test.tsx` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | TEAM-02 | route | `npm run test -- src/app/api/teams/[id]/members/route.test.ts src/app/api/teams/[id]/members/[userId]/route.test.ts src/app/api/users/route.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | TEAM-02 | component | `npm run test -- src/components/teams/invite-member-dialog.test.tsx src/components/teams/member-list.test.tsx` | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 2 | TEAM-02 | e2e | `npm run e2e -- e2e/team-member-actions.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/teams/team-detail-access-denied.test.tsx` — explicit denied-state rendering for non-members
- [ ] `src/components/teams/invite-member-dialog.test.tsx` — username lookup + add-member interaction coverage
- [ ] `src/components/teams/member-list.test.tsx` — remove confirmation + delete interaction coverage
- [ ] `src/app/api/teams/[id]/members/route.test.ts` — member add route coverage
- [ ] `src/app/api/teams/[id]/members/[userId]/route.test.ts` — member remove route coverage
- [ ] `e2e/team-member-actions.spec.ts` — authenticated manage-members flow and denied direct access

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Authenticated manage-members flow against real DB/auth runtime | TEAM-02 | Local shell may lack `DATABASE_URL` and `NEXTAUTH_SECRET` even though automated E2E is planned | Configure env, open `/times/[id]` as a current member, invite by username, remove removable member, confirm toast + refreshed roster |
| Explicit denied UX copy for non-member direct URL access | TEAM-02 | Final PT-BR copy/clarity still benefits from human review even with automated assertions | Login as non-member, open another team's `/times/[id]`, confirm explicit denied screen and clear route back to `/times` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
