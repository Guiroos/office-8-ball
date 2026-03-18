# Skill Candidate Filter

Score each finding on the three criteria below. Accept candidates with a total score of **3 or higher**. Discard the rest.

## Criteria

| # | Criterion | 0 pts | 1 pt | 2 pts |
|---|-----------|-------|------|-------|
| 1 | **Recurrence** — How often would an agent need to execute this workflow? | Rarely, one-off | Occasionally (e.g., per feature) | Every session or every PR |
| 2 | **Step count / ordering risk** — What breaks if an agent improvises the steps? | Nothing visible | Minor inefficiency or extra work | Silent failure, data corruption, or broken state |
| 3 | **Discoverability** — How obvious is the correct procedure from existing docs? | Fully documented in CLAUDE.md or rules | Partially documented, requires inference | Undocumented or spread across multiple files |

## Automatic Discard Conditions

Discard a candidate immediately if any of the following is true:

- The workflow is already fully captured in an existing skill file.
- The workflow is a single command with no ordering risk (e.g., `npm run lint`).
- The candidate describes a one-time setup step that no agent would repeat.
- The candidate is a restatement of a framework default with no project-specific nuance.
- The behavior is already documented verbatim in `CLAUDE.md` or a `.claude/rules/` file with enough detail that no skill adds value.

## Automatic Accept Conditions

Accept a candidate immediately (skip scoring) if any of the following is true:

- The workflow has a required step order where doing it out of order causes silent data loss or broken state.
- The workflow involves conditional branching based on environment variables or runtime state that is non-obvious.
- The workflow orchestrates multiple tools or commands where the agent must validate intermediate output before proceeding.
- The procedure has known gotchas or failure modes that an agent would reliably fall into without guidance.
