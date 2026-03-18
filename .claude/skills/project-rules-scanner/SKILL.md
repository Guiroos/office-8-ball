---
name: project-rules-scanner
description: Scans a software project to surface implicit conventions, domain invariants, and architectural patterns that are not yet documented as agent rules. Outputs structured rule candidates ready to be written into .claude/rules/. Does not generate rules for facts already captured in existing rule files, CLAUDE.md, or code comments. Do not invoke for general documentation tasks, one-off questions, or when the user asks to write code.
---

# Project Rules Scanner

Scan the project to discover undocumented conventions, invariants, and patterns worth capturing as agent rules in `.claude/rules/`.

## Step 1: Inventory Existing Rules

1. Read all files in `.claude/rules/` to understand what is already documented.
2. Read `CLAUDE.md` at the project root.
3. Run `python3 .claude/skills/project-rules-scanner/scripts/list-existing-rules.py` to print a deduplicated list of topics already covered. Use this list throughout the scan to avoid duplicates.

## Step 2: Scan the Codebase for Implicit Conventions

Run each scan category below. For each, note findings that are NOT already covered by existing rules.

**2a — Naming and structure conventions**
- Run `python3 .claude/skills/project-rules-scanner/scripts/scan-conventions.py` from the project root.
- The script prints groups of: file-naming patterns, directory layout, export conventions, and test co-location patterns.

**2b — Domain invariants hidden in code**
- Read `src/lib/constants.ts`, `src/lib/types.ts`, and `src/lib/data.ts`.
- Look for: hard-coded values that constrain behavior, type unions that enumerate a closed set, guards that reject unexpected values, and derived fields that are never stored.

**2c — API contract patterns**
- Read `src/app/api/` route files.
- Look for: consistent request shapes, error response formats, auth checks at specific layers, and HTTP method restrictions.

**2d — Testing conventions**
- Read `vitest.config.ts` (or `vitest.config.js`) and 2–3 test files.
- Look for: mock boundaries, shared setup patterns, what is always/never mocked, and naming conventions for test files.

**2e — Auth and session rules**
- Read `src/lib/auth.ts`, `src/lib/auth-validation.ts`, and `middleware.ts`.
- Look for: where session validation is enforced, what triggers a rate-limit increment, and which routes bypass auth.

**2f — Persistence mode guards**
- Read `src/lib/data.ts` focusing on the conditional blocks that switch between Prisma and in-memory.
- Look for: all places where `DATABASE_URL` presence is checked and what behavior differs per mode.

## Step 3: Score and Filter Candidates

For each finding from Step 2, apply the filter in `references/candidate-filter.md`.
Discard any candidate that scores below the minimum threshold defined there.

## Step 4: Draft Rule Candidates

For each surviving candidate:

1. Assign it to one of the existing rule files (`domain.md`, `safe-change.md`) or propose a new file name if none fits.
2. Write the candidate in this format:

```
### [Candidate Title]
File: .claude/rules/[target-file].md
Section: [section name or "new section"]

[2–5 sentences describing the invariant or convention in third-person imperative.
State what the rule requires, when it applies, and any exception.]
```

3. Group candidates by target file.

## Step 5: Present and Confirm

1. Print all candidates grouped by target file.
2. Ask the user which candidates to accept, modify, or discard.
3. For accepted candidates, write the content into the correct `.claude/rules/` file using the Edit or Write tool.
4. Do not modify `CLAUDE.md` unless the user explicitly instructs it.

## Error Handling

- If `.claude/rules/` is empty or missing, skip Step 1 deduplication and proceed with a full scan.
- If `scripts/scan-conventions.py` fails, perform the naming/structure scan manually by reading `package.json`, `tsconfig.json`, and listing `src/` directory contents.
- If `scripts/list-existing-rules.py` fails, read `.claude/rules/` files directly and build the topic list manually.
- If no candidates survive the Step 3 filter, report that the project rules appear comprehensive and list the topics already covered.
