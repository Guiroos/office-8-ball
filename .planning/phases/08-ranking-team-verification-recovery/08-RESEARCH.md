# Phase 8: Ranking/Team Verification Recovery - Research

**Researched:** 2026-03-26
**Domain:** Verification recovery, requirement traceability, audit repair
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 8 should treat Phase 7 as the canonical verification source for `TEAM-02`, not recreate a competing Phase 4 behavioral contract.
- **D-02:** The recovered Phase 4 verification artifact should still acknowledge `TEAM-02` explicitly so the orphaned-audit gap is closed, but it should do so via a traceability note that points to the current canonical evidence in Phase 7.
- **D-03:** Re-verification should rely on current code inspection, existing test coverage, and focused reruns of the narrowest relevant commands.
- **D-04:** New tests should only be added if the recovery work uncovers a real evidence gap that current artifacts do not already prove.
- **D-05:** Manual UAT is supplemental only. It should not be required by default for Phase 8 unless automated/runtime evidence is insufficient.
- **D-06:** Phase 8 must recreate `04-VERIFICATION.md` and repair requirement traceability, not just add a minimal placeholder artifact.
- **D-07:** The repair scope must also include updating or rerunning milestone-audit-facing documentation so the orphaned Phase 4 gaps no longer appear after execution.
- **D-08:** The verification and audit artifacts should include explicit cross-links that make the recovered evidence chain obvious and reduce the risk of future orphaning.
- **D-09:** The recovered verification report must provide strict requirement-by-requirement evidence for `RANK-01`, `RANK-02`, `RANK-03`, and `RANK-04`.
- **D-10:** `TEAM-02` should be documented separately as a cross-referenced traceability note rather than grouped into the ranking requirement evidence body.

### the agent's Discretion
- Exact wording and section layout of the recovered verification report, as long as the report stays requirement-level and audit-friendly.
- Exact choice of focused verification commands, as long as they are the narrowest commands that credibly prove the ranking behavior and traceability repair.
- Exact placement of anti-orphan cross-links across planning artifacts, as long as the recovered evidence chain is explicit.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RANK-01 | Página de ranking exibe todos os times ordenados por vitórias | Current domain sort logic, ranking page wiring, and ranking view behavior tests already prove ordering; recover into `04-VERIFICATION.md` with current line-level evidence |
| RANK-02 | Ranking mostra W/L e win rate % por time | Current ranking contract already carries `wins`, `losses`, and `winRate`; UI code renders those fields today; verification report should document that current automated proof is partly domain-level and partly code-inspection-level |
| RANK-03 | Ranking mostra streak atual (sequência de vitórias/derrotas) por time | Current ranking contract already carries `currentStreak`; UI code renders streak in podium and standings rows; recovered report should call out current test coverage honestly |
| RANK-04 | Ranking mostra total de partidas por time | Current ranking contract already carries `totalMatches`; standings rows render it directly; recovered report should cite the existing domain test plus the current render path |

`TEAM-02` is not a Phase 8 requirement body. It remains a cross-reference-only traceability note pointing to Phase 7 canonical verification.
</phase_requirements>

## Summary

Phase 8 is a documentation-and-traceability repair phase, not a feature-delivery phase. The missing artifact is `04-VERIFICATION.md`; the live ranking implementation still exists, the requirement-bearing Phase 4 summaries still exist, and the current ranking-focused rerun passes today: `npm run test -- src/lib/ranking.test.ts src/components/ranking/ranking-view.test.tsx` passed with 20/20 tests on 2026-03-26, and `npm run typecheck` also passed.

The correct recovery posture is: rebuild `04-VERIFICATION.md` around the current ranking code and tests for `RANK-01..04`, treat `TEAM-02` as an explicit cross-reference to Phase 7 rather than duplicate Phase 4 truth, and update audit-facing traceability artifacts so the orphaned Phase 4 findings disappear.

**Primary recommendation:** Recreate `04-VERIFICATION.md` with requirement-by-requirement evidence for `RANK-01..04`, add a separate `TEAM-02` traceability note that points to Phase 7, then refresh the docs that still advertise the Phase 4 orphan gap.

## Project Constraints (from project instructions)

- Prefer `src/` and `prisma/` over older docs when evidence conflicts.
- Treat `.planning/ROADMAP.md`, `.planning/STATE.md`, and the relevant phase directory as first-class context.
- Do not edit `prisma/schema.prisma` without approval.
- Do not install new packages without approval.
- Keep both DB-backed mode and in-memory mode intact.
- Use the narrowest verification that proves the repair; for cross-cutting work, run at least `npm run typecheck` plus the relevant test target.
- Keep ranking/team behavior derived from match history; do not introduce persisted aggregates.
- Prefer current application code and `.planning/PROJECT.md` over stale docs that still describe older fixed-team behavior.

## Findings / Current Evidence

### Current requirement evidence map

| Requirement | Current proving code | Current proving tests | Assessment |
|-------------|----------------------|-----------------------|------------|
| `RANK-01` | `src/lib/ranking.ts:58-105` fetches active teams, computes stats, sorts by `wins desc`, then `winRate desc`, then name, and assigns `rank`; `src/app/(authenticated)/ranking/page.tsx:16-34` always feeds that list into the live page; `src/components/ranking/ranking-view.tsx:58-95` preserves ranked input across podium and row rendering | `src/lib/ranking.test.ts:50-91` proves rank assignment; `src/lib/ranking.test.ts:93-166` proves win-based ordering; `src/components/ranking/ranking-view.test.tsx:102-117` proves podium order and rank-4+ row handling | HIGH |
| `RANK-02` | `src/lib/ranking.ts:91-105` spreads `computeTeamStats()` into each ranked team; `src/components/ranking/podium-card.tsx:22-29` renders `Vitórias`, `Derrotas`, `Taxa de Vitória`; `src/components/ranking/standings-row.tsx:17-19` renders wins, losses, and win rate in the standings list | `src/lib/ranking.test.ts:168-194` proves zero-match stat fields exist and stay normalized; `src/components/ranking/ranking-view.test.tsx` passes populated fixtures through the live view but does not explicitly assert the rendered metric strings | MEDIUM |
| `RANK-03` | `src/lib/ranking.ts:91-105` carries `currentStreak`; `src/components/ranking/podium-card.tsx:30-34` renders streak for podium cards; `src/components/ranking/standings-row.tsx:20-24` renders streak in the standings row | Domain proof comes from the ranking contract depending on `computeTeamStats()` plus the populated ranking fixtures in `src/components/ranking/ranking-view.test.tsx:26-99`; there is no explicit current assertion for streak text in the rendered UI | MEDIUM |
| `RANK-04` | `src/lib/ranking.ts:91-105` carries `totalMatches`; `src/components/ranking/standings-row.tsx:20-25` renders `{team.totalMatches}j` directly in the list row | `src/lib/ranking.test.ts:168-194` proves `totalMatches` stays correct for zero-match teams; current ranking view tests do not explicitly assert the rendered `j` text | MEDIUM |

### Current rerun status

- `npm run test -- src/lib/ranking.test.ts src/components/ranking/ranking-view.test.tsx` -> PASS, 2 files, 20 tests, 2026-03-26
- `npm run typecheck` -> PASS, 2026-03-26

### TEAM-02 cross-reference posture

No hard contradiction was found against the constraint. The correct posture remains cross-reference-only:

- `TEAM-02` is already mapped to Phase 7 as complete in `.planning/REQUIREMENTS.md`.
- `07-VERIFICATION.md` is the canonical current evidence because Phase 7 changed the product contract from Phase 4's old authenticated-public detail view to member-only access plus wired invite/remove actions.
- The recovered `04-VERIFICATION.md` should mention `TEAM-02` only as an audit-repair note: Phase 4 summary/frontmatter referenced it historically, but the canonical satisfied evidence now lives in Phase 7.
- Do not restate `TEAM-02` as a fresh Phase 4 satisfied requirement body. Doing that would recreate competing truth.

## File Touch Recommendations

| File / Artifact | Why it likely needs touch-up |
|-----------------|------------------------------|
| `.planning/phases/04-ranking-team-details/04-VERIFICATION.md` | Missing blocker artifact. Must be recreated with strict `RANK-01..04` evidence and a separate `TEAM-02` cross-reference note. |
| `.planning/REQUIREMENTS.md` | `RANK-01..04` still show pending in traceability; execution should mark them complete once recovered verification exists. |
| `.planning/ROADMAP.md` | Phase 8 progress and traceability rows need closure; Phase 8 wording that still implies `TEAM-02` direct ownership should be clarified to cross-reference posture if left ambiguous. |
| `.planning/v1.0-v1.0-MILESTONE-AUDIT.md` | The audit artifact currently contains the orphan findings that motivated Phase 8. It must be rerun or replaced so the repaired chain is visible to reviewers. |
| `.planning/STATE.md` | Current focus/status should reflect that Phase 4 evidence was recovered and that `TEAM-02` canonical evidence sits in Phase 7. |
| `.planning/phases/04-ranking-team-details/04-CODEX-CHECKS.md` | Recommended, not mandatory. It currently says original UAT artifacts were reverted; adding a pointer to the recovered verification artifact would reduce future confusion. |

Normal Phase 8 outputs such as `08-SUMMARY.md` and `08-VERIFICATION.md` should also be expected during execution, but they do not replace the need to restore `04-VERIFICATION.md`.

## Verification Strategy

### Narrowest credible command set

1. `npm run test -- src/lib/ranking.test.ts src/components/ranking/ranking-view.test.tsx`
2. `npm run typecheck`

Optional only if a reviewer wants a fresh TEAM-02 corroboration signal:

3. `npm run test -- src/lib/team-details.test.ts`

### Why this is the right minimum

- Phase 8 is repairing evidence for `RANK-01..04`, not delivering new runtime behavior.
- The ranking domain and ranking page/view tests are the only current automated evidence directly tied to the affected requirements.
- `TEAM-02` is cross-reference-only, so broad member-action reruns or E2E are not required by default.
- Manual UAT should stay supplemental unless the recovered `04-VERIFICATION.md` reveals a genuine gap that existing automated evidence cannot cover.

## Risks / Pitfalls

- **Reopening TEAM-02 ownership in Phase 8:** This would conflict with `.planning/REQUIREMENTS.md` and Phase 7 verification. Keep it as a traceability note only.
- **Copying stale Phase 4 semantics into the recovered report:** `04-03-SUMMARY.md` still reflects the older authenticated-public detail contract. The recovered report must acknowledge that Phase 7 superseded that behavior.
- **Overstating UI proof for `RANK-02..04`:** Current code is correct, but the direct assertions are weaker than `RANK-01`. The recovered verification should say that plainly instead of pretending stronger test coverage exists.
- **Fixing only `04-VERIFICATION.md`:** That would leave the milestone audit and traceability docs still showing orphaned gaps.
- **Using a broad verification suite by habit:** Full E2E reruns are unnecessary for this recovery unless execution uncovers a real contradiction.

## Recommended Plans

1. **Plan 08-01: Reconstruct Phase 4 verification evidence**
   Build `04-VERIFICATION.md` from current code, current targeted test evidence, and Phase 4 summary/frontmatter. Structure it requirement-by-requirement for `RANK-01..04`, then add a separate `TEAM-02` traceability note that points to `07-VERIFICATION.md`.

2. **Plan 08-02: Repair traceability and audit-facing artifacts**
   Update `REQUIREMENTS.md`, `ROADMAP.md`, and `STATE.md`, then rerun or regenerate the milestone audit artifact so the orphaned findings no longer appear. Add explicit cross-links so future audits can jump from Phase 8 recovery output to `04-VERIFICATION.md` and Phase 7 canonical `TEAM-02` evidence.

3. **Plan 08-03: Re-verify the repaired evidence chain**
   Run the narrowest command set, record exact results in the recovered verification and Phase 8 outputs, and confirm the final artifact chain is obvious: Phase 4 ranking evidence restored, Phase 7 team-detail evidence cross-referenced, milestone audit repaired.

## Explicit Test Recommendation

New tests are **not required by default**.

Current code plus the existing ranking-focused test suite are sufficient to execute this recovery credibly. If execution or review decides the recovered `04-VERIFICATION.md` needs stronger direct UI evidence for `RANK-02..04`, the smallest acceptable addition is a very small expansion of `src/components/ranking/ranking-view.test.tsx` to assert rendered W/L, win rate, streak text, and total-match text. That would be a quality upgrade, not a prerequisite to start Phase 8.

## Sources

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/v1.0-v1.0-MILESTONE-AUDIT.md`
- `.planning/phases/08-ranking-team-verification-recovery/08-CONTEXT.md`
- `.planning/phases/04-ranking-team-details/04-CONTEXT.md`
- `.planning/phases/04-ranking-team-details/04-01-SUMMARY.md`
- `.planning/phases/04-ranking-team-details/04-02-SUMMARY.md`
- `.planning/phases/04-ranking-team-details/04-03-SUMMARY.md`
- `.planning/phases/04-ranking-team-details/04-CODEX-CHECKS.md`
- `.planning/phases/04-ranking-team-details/04-VALIDATION.md`
- `.planning/phases/02-scoreboard-reactivation-match-recording/02-VERIFICATION.md`
- `.planning/phases/05-user-profiles-advanced-features/05-VERIFICATION.md`
- `.planning/phases/07-team-details-access-member-actions/07-VERIFICATION.md`
- `src/lib/ranking.ts`
- `src/lib/ranking.test.ts`
- `src/components/ranking/ranking-view.tsx`
- `src/components/ranking/ranking-view.test.tsx`
- `src/components/ranking/podium-card.tsx`
- `src/components/ranking/standings-row.tsx`
- `src/app/(authenticated)/ranking/page.tsx`
- `src/lib/team-details.ts`
- `src/lib/team-details.test.ts`
- `src/app/(authenticated)/times/[id]/page.tsx`
