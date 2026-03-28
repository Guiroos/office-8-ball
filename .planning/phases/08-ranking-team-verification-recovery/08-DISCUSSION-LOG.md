# Phase 8: Ranking/Team Verification Recovery - Discussion Log

> **Audit trail only.** Do not use as planning or implementation input.
> Decisions captured in `08-CONTEXT.md`.

**Date:** 2026-03-26
**Phase:** 08-ranking-team-verification-recovery
**Mode:** discuss
**Areas discussed:** TEAM-02 recovery policy, evidence bar for re-verification, traceability repair scope, verification report granularity

## Discussion Summary

Phase 8 was discussed as a verification-recovery phase, not a feature-design phase. The focus stayed on how to reconstruct missing evidence for Phase 4 and how to repair traceability without creating conflicting sources of truth for `TEAM-02`.

## Questions and Decisions

### 1. TEAM-02 recovery policy

**Question**
- Should Phase 8 recreate historical evidence for `TEAM-02` inside the recovered Phase 4 verification artifact, or treat Phase 7 as the canonical proof and only cross-reference it?

**Options presented**
- `A. Cross-reference Phase 7 as canonical` — current member-only behavior is now defined and verified in Phase 7, while Phase 4 originally implemented a looser access policy.
- `B. Recreate TEAM-02 evidence entirely inside recovered Phase 4 verification` — keeps old requirement IDs self-contained but risks mixing superseded Phase 4 behavior with Phase 7 hardening.
- `C. Drop TEAM-02 from Phase 8 entirely` — simpler, but conflicts with roadmap and audit text that explicitly call out `TEAM-02`.

**User selection**
- `A`

**Captured decision**
- Phase 8 will acknowledge `TEAM-02` in the recovered traceability chain, but Phase 7 remains the canonical verification source.

### 2. Evidence bar for re-verification

**Question**
- Should the recovery lean on code inspection, existing tests, and focused reruns, or require fresh targeted tests and/or new manual UAT notes?

**Options presented**
- `A. Use existing tests/code plus focused reruns, add new tests only if a gap appears`
- `B. Require fresh targeted tests even if current coverage already proves behavior`
- `C. Require manual UAT notes again`

**User selection**
- `A`

**Captured decision**
- Re-verification should be evidence-efficient: use current code and targeted reruns first; add tests only if a concrete gap appears.

### 3. Traceability repair scope

**Question**
- Should the plan stop at recreating `04-VERIFICATION.md` and updating requirement traceability, or also rerun/update the milestone audit and add explicit anti-orphan cross-links?

**Options presented**
- `A. Recreate 04-VERIFICATION.md and update requirement traceability only`
- `B. Also rerun/update milestone audit and add explicit anti-orphan cross-links`
- `C. Fix only the verification file and leave audit cleanup for a later phase`

**User selection**
- `B`

**Captured decision**
- Phase 8 must repair the audit-facing chain as well, not just the missing file.

### 4. Verification report granularity

**Question**
- Should the recovered report be strict requirement-by-requirement evidence, or a more compact grouped verification summary?

**Options presented**
- `A. Strict requirement-by-requirement evidence for RANK-01..04 and TEAM-02 note`
- `B. Group ranking requirements into one combined “ranking surface verified” section`
- `C. Hybrid: strict for RANK-01..04, short cross-reference note for TEAM-02`

**User selection**
- `A`

**Captured decision**
- The recovered Phase 4 verification report should verify `RANK-01` through `RANK-04` individually and include a separate `TEAM-02` traceability note.

## Resulting Planning Contract

- Phase 7 remains canonical for `TEAM-02`.
- Phase 8 recreates Phase 4 verification evidence without duplicating or contradicting Phase 7.
- Evidence should come from current code, current tests, and focused reruns before any new test work.
- Audit-facing documents must be updated so orphaned-gap reporting clears after execution.
- The recovered report must be requirement-level for `RANK-01..04`.

## Deferred Ideas

None — discussion stayed within phase scope.
