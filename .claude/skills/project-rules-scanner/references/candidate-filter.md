# Candidate Filter

Score each finding on the three criteria below. Accept candidates with a total score of **3 or higher**. Discard the rest.

## Criteria

| # | Criterion | 0 pts | 1 pt | 2 pts |
|---|-----------|-------|------|-------|
| 1 | **Recurrence** — How often would an agent encounter this pattern? | Unlikely, one-off | Occasionally | Every session |
| 2 | **Blast radius** — What breaks if this is violated? | Nothing visible | Test failure or lint error | Incorrect runtime behavior or data corruption |
| 3 | **Discoverability** — How obvious is this convention from the code alone? | Immediately obvious | Requires careful reading | Requires understanding history or domain context |

## Automatic Discard Conditions

Discard a candidate immediately if any of the following is true:

- The fact is already stated verbatim in `CLAUDE.md`, an existing `.claude/rules/` file, or a code comment at the relevant site.
- The rule only applies to a single file and can be derived by reading that file.
- The candidate describes a preference or style choice with no behavioral consequence.
- The candidate is a restatement of a language/framework default (e.g., "TypeScript files use `.ts` extension").

## Automatic Accept Conditions

Accept a candidate immediately (skip scoring) if any of the following is true:

- Violating it would produce silently incorrect data (e.g., derived fields written as stored counters).
- It describes a closed enumeration that an agent might otherwise extend incorrectly.
- It guards a dual-mode behavior (e.g., Prisma vs in-memory) that is not obvious from a single file.
