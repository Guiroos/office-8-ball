# Phase 8: Ranking/Team Verification Recovery - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Recreate the missing Phase 4 verification artifact and repair requirement traceability for the already-shipped ranking and team-detail surfaces. This phase verifies and documents current runtime behavior for `RANK-01` through `RANK-04`, and closes the audit gap that left Phase 4 orphaned.

This phase does not redesign ranking UI, change ranking semantics, or reopen team-detail product scope. It is a verification-recovery phase focused on evidence quality, report structure, and traceability integrity.

</domain>

<decisions>
## Implementation Decisions

### TEAM-02 recovery policy
- **D-01:** Phase 8 should treat Phase 7 as the canonical verification source for `TEAM-02`, not recreate a competing Phase 4 behavioral contract.
- **D-02:** The recovered Phase 4 verification artifact should still acknowledge `TEAM-02` explicitly so the orphaned-audit gap is closed, but it should do so via a traceability note that points to the current canonical evidence in Phase 7.

### Re-verification evidence bar
- **D-03:** Re-verification should rely on current code inspection, existing test coverage, and focused reruns of the narrowest relevant commands.
- **D-04:** New tests should only be added if the recovery work uncovers a real evidence gap that current artifacts do not already prove.
- **D-05:** Manual UAT is supplemental only. It should not be required by default for Phase 8 unless automated/runtime evidence is insufficient.

### Traceability repair scope
- **D-06:** Phase 8 must recreate `04-VERIFICATION.md` and repair requirement traceability, not just add a minimal placeholder artifact.
- **D-07:** The repair scope must also include updating or rerunning milestone-audit-facing documentation so the orphaned Phase 4 gaps no longer appear after execution.
- **D-08:** The verification and audit artifacts should include explicit cross-links that make the recovered evidence chain obvious and reduce the risk of future orphaning.

### Verification report granularity
- **D-09:** The recovered verification report must provide strict requirement-by-requirement evidence for `RANK-01`, `RANK-02`, `RANK-03`, and `RANK-04`.
- **D-10:** `TEAM-02` should be documented separately as a cross-referenced traceability note rather than grouped into the ranking requirement evidence body.

### the agent's Discretion
- Exact wording and section layout of the recovered verification report, as long as the report stays requirement-level and audit-friendly.
- Exact choice of focused verification commands, as long as they are the narrowest commands that credibly prove the ranking behavior and traceability repair.
- Exact placement of anti-orphan cross-links across planning artifacts, as long as the recovered evidence chain is explicit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and audit gap
- `.planning/ROADMAP.md` — Phase 8 goal, success criteria, and current requirement assignment for `RANK-01..04`.
- `.planning/REQUIREMENTS.md` — traceability table showing `RANK-01..04` still pending and `TEAM-02` now mapped to Phase 7.
- `.planning/PROJECT.md` — current product constraints, especially no schema/package changes and dual-mode expectations.
- `.planning/STATE.md` — accumulated technical decisions and current roadmap position entering Phase 8.
- `.planning/v1.0-v1.0-MILESTONE-AUDIT.md` — exact orphaned-gap evidence motivating this recovery phase.

### Prior phase context and evidence chain
- `.planning/phases/04-ranking-team-details/04-CONTEXT.md` — locked Phase 4 ranking and team-detail decisions that the recovered verification must evaluate against.
- `.planning/phases/04-ranking-team-details/04-01-SUMMARY.md` — ranking data-foundation claims and `RANK-01..04` summary traceability.
- `.planning/phases/04-ranking-team-details/04-02-SUMMARY.md` — ranking UI claims and `RANK-01..04` summary traceability.
- `.planning/phases/04-ranking-team-details/04-03-SUMMARY.md` — team-detail claims and prior `TEAM-02` summary traceability.
- `.planning/phases/04-ranking-team-details/04-CODEX-CHECKS.md` — prior command log and note that original UAT tracking artifacts were reverted.
- `.planning/phases/04-ranking-team-details/04-VALIDATION.md` — prior validation matrix and pending evidence expectations for the Phase 4 surface.
- `.planning/phases/07-team-details-access-member-actions/07-VERIFICATION.md` — canonical current verification source for `TEAM-02`.

### Runtime ranking and team-detail surfaces
- `src/lib/ranking.ts` — live ranking aggregation contract and ordering behavior.
- `src/lib/ranking.test.ts` — existing focused evidence for ordering, filtering, and in-memory behavior.
- `src/app/(authenticated)/ranking/page.tsx` — live ranking page wiring and query-param validation.
- `src/components/ranking/ranking-view.tsx` — current ranking rendering contract for podium, standings, and empty/unavailable states.
- `src/components/ranking/ranking-view.test.tsx` — behavior tests for podium order, links, and ranking page param wiring.
- `src/lib/team-details.ts` — current team-detail assembler and current `TEAM-02` access policy surface.
- `src/lib/team-details.test.ts` — current team-detail evidence, including membership-gate behavior added after Phase 4.
- `src/app/(authenticated)/times/[id]/page.tsx` — current team-detail route branching behavior for unavailable, not-found, forbidden, and detail states.

### Verification-report patterns
- `.planning/phases/02-scoreboard-reactivation-match-recording/02-VERIFICATION.md` — reference format for requirement-level verification with observable truths and wiring tables.
- `.planning/phases/05-user-profiles-advanced-features/05-VERIFICATION.md` — reference format for a clean passed verification report over server-rendered ranking-related work.
- `.planning/phases/07-team-details-access-member-actions/07-VERIFICATION.md` — reference format for re-verification metadata and cross-phase traceability wording.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/ranking.ts`: already defines the runtime source of truth for team ranking order, stats derivation, and period-aware ranking behavior.
- `src/lib/ranking.test.ts`: already covers deterministic ranking order, type filtering, zero-match cases, and period windows; likely the primary narrow rerun target for `RANK-01..04`.
- `src/components/ranking/ranking-view.test.tsx`: already proves podium order, standings rows, links to `/times/[id]`, and current page-level query handling.
- `src/lib/team-details.ts` and `src/lib/team-details.test.ts`: provide the current evidence chain for how team detail behavior evolved after Phase 4.
- Existing `*-VERIFICATION.md` files in phases 02, 05, and 07: provide report structures that can be mirrored instead of inventing a new verification format.

### Established Patterns
- Verification artifacts in this repo use frontmatter plus structured sections for observable truths, required artifacts, wiring, data flow, and requirement coverage.
- Current ranking behavior is proven mostly through focused unit/component tests and targeted code inspection, not broad full-suite reruns.
- Later phases supersede earlier behavior contracts when product semantics changed; cross-references are the clean way to preserve traceability without duplicating truth.

### Integration Points
- `.planning/phases/04-ranking-team-details/04-VERIFICATION.md`: missing artifact that Phase 8 must recreate.
- `.planning/REQUIREMENTS.md`: requirement statuses for `RANK-01..04` and any related traceability notes must be updated during execution.
- `.planning/ROADMAP.md` and/or milestone audit artifacts: need explicit anti-orphan repair so the audit no longer flags the Phase 4 gap.
- Ranking source/test files under `src/lib/` and `src/components/ranking/`: primary evidence inputs for the recovered report.

</code_context>

<specifics>
## Specific Ideas

- Keep `TEAM-02` visible in the recovery narrative, but clearly mark Phase 7 as the canonical verification source.
- Prefer a recovered verification report that reads like a forensic repair of evidence integrity, not like a new product implementation phase.
- Make the recovered report requirement-by-requirement for `RANK-01..04` so future milestone audits can resolve each orphan directly.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-ranking-team-verification-recovery*
*Context gathered: 2026-03-26*
