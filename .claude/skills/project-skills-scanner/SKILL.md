---
name: project-skills-scanner
description: Scans a software project to surface reusable workflows, recurring agent tasks, and domain-specific patterns that are not yet captured as skills. Outputs structured skill candidates ready to be authored with the skill-creator skill. Does not generate skills for behaviors already documented in existing skill files, CLAUDE.md, or .claude/rules/. Do not invoke for general documentation tasks, one-off questions, code writing requests, or when the user asks to scan for rules instead of skills.
---

# Project Skills Scanner

Scan the project to discover undocumented recurring workflows, multi-step agent tasks, and domain-specific procedures worth capturing as reusable skills in `.claude/skills/`.

## Step 1: Inventory Existing Skills

1. Run `python3 .claude/skills/project-skills-scanner/scripts/list-existing-skills.py` from the project root.
2. Read `CLAUDE.md` at the project root to understand already-documented workflows.
3. Use the printed skill names and descriptions throughout the scan to avoid proposing duplicates.

## Step 2: Scan the Project for Workflow Candidates

Run each scan category below. For each, note findings NOT already covered by existing skills.

**2a — Automated task surface (package.json / Makefile)**
- Run `python3 .claude/skills/project-skills-scanner/scripts/scan-workflows.py` from the project root.
- The script prints: npm scripts grouped by category, any Makefile targets, and any scripts/ directory contents.
- Flag script groups that represent multi-step workflows an agent would need to orchestrate (e.g., "run migration then seed then build").

**2b — CI/CD and deployment workflows**
- If `.github/workflows/` exists, read each workflow YAML file.
- Look for: required step sequences, environment-specific gates, manual approval steps, and deploy prerequisites.
- Flag any workflow that an agent assisting with deploys or releases would need to follow precisely.

**2c — Development lifecycle patterns**
- Read `techspec/` directory contents (list files, then read relevant ones).
- Look for: documented procedures for adding features, architectural decision flows, naming conventions with multiple steps, or onboarding sequences.
- Flag any procedure described in more than 3 steps that an agent would repeat across sessions.

**2d — Recurring multi-step database operations**
- Read `prisma/schema.prisma` and `prisma/seed.mjs`.
- Look for: migration + seed sequences, schema change procedures, and any conditional Prisma/in-memory setup steps.
- Flag operations that require a specific command order to avoid data loss or broken state.

**2e — Testing workflow patterns**
- Read `vitest.config.ts` (or equivalent) and `playwright.config.ts` if present.
- Look for: prerequisite setup steps before tests run, environment variables required for specific test modes, and test-type-specific run sequences (unit vs E2E).
- Flag any testing flow that requires more than running a single command.

**2f — Auth and session bootstrapping**
- Read `src/lib/auth.ts` and any `.env.example` or environment documentation.
- Look for: required environment variable combinations, initialization order dependencies, and setup sequences for local vs production auth.
- Flag any setup that is non-obvious or breaks silently when done out of order.

## Step 3: Score and Filter Candidates

For each finding from Step 2, apply the filter in `references/candidate-filter.md`.
Discard any candidate that scores below the minimum threshold defined there.

## Step 4: Draft Skill Candidates

For each surviving candidate:

1. Assign a proposed skill name (lowercase, hyphens only, descriptive action verb + noun).
2. Write the candidate in this format:

```
### [Candidate Skill Name]
Trigger: [when an agent should invoke this skill]
Negative triggers: [when NOT to use it]

**What it does:**
[2–4 sentences describing the workflow. State the steps at a high level,
the tools or commands involved, and the outcome the agent produces.]

**Why it needs to be a skill:**
[1–2 sentences on what goes wrong if an agent improvises instead of following this procedure.]
```

3. Group candidates by workflow domain (e.g., Database, CI/CD, Testing, Development Setup).

## Step 5: Present and Confirm

1. Print all candidates grouped by domain.
2. Ask the user which candidates to accept, modify, or discard.
3. For accepted candidates, invoke the `skill-creator` skill to author each one fully.
4. Do not write any `.claude/skills/` directory directly — delegate authoring to `skill-creator`.

## Error Handling

- If `.claude/skills/` is empty or missing, skip Step 1 deduplication and proceed with a full scan.
- If `scripts/list-existing-skills.py` fails, list `.claude/skills/` manually and read each `SKILL.md` frontmatter directly.
- If `scripts/scan-workflows.py` fails, read `package.json` directly and list `.github/workflows/` manually.
- If no candidates survive the Step 3 filter, report that the project workflows appear well-covered and list the skills already present.
