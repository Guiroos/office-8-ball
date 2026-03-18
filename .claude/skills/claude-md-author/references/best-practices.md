# CLAUDE.md Best Practices

## Tone and Formatting

- Write every rule as an **imperative command**: "Always use named exports." not "Named exports are preferred."
- Use **bullet points with headers**, not prose paragraphs.
- Put the **most critical constraints at the top** — they survive context compression better.
- Keep instructions **universally applicable** to the entire project. Task-specific instructions belong in separate files loaded on demand.

## Memory Hierarchy

| Level | File | Version Control |
|---|---|---|
| Global | `~/.claude/CLAUDE.md` | Do NOT commit — personal |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Commit to git — shared |
| Local override | `./CLAUDE.local.md` | Add to `.gitignore` |

When the same instruction appears at multiple tiers, the most specific (local) wins.

## Token Budget Rules

- Root file target: **50–150 lines**.
- Root file hard limit: **300 lines**.
- Total across all imports: **under 10,000 tokens**.
- Use `@path/to/file` imports to defer large rule sets.
- Apply the pruning test: "Would removing this line cause Claude to make a mistake?" If no, delete it.
- Do not duplicate rules already enforced by linters, formatters, or `tsconfig.json` — reference those files instead.

## Progressive Disclosure

Instead of embedding all knowledge in CLAUDE.md, tell Claude where to look:

```
# Testing conventions
@.claude/rules/testing.md

# Deployment
@.claude/rules/deployment.md
```

Use `@imports` when a section would exceed 30 lines.

## Section Guidelines

### Project Overview
- One sentence only.
- Include: primary framework, language, and key integrations.
- Bad: "This project contains the source code for our application."
- Good: "Next.js 14 e-commerce app with Stripe and Postgres, using App Router."

### Tech Stack
- List exact versions, not ranges.
- Good: `- Node 20 / TypeScript 5.4`
- Bad: `- TypeScript (latest)`

### Common Commands
- Provide exact runnable strings.
- Include: build, dev, test, lint, typecheck, and any DB migration commands.
- Never omit this section — it eliminates an entire class of mistakes.

### Directory Structure
- Only include non-obvious directories.
- Omit standard dirs: `node_modules`, `dist`, `.git`, `public`.
- Add a brief annotation: `- /src/stores  → Zustand state (see here for patterns)`.

### Architecture Decisions
- Document non-obvious decisions that affect where and how code is written.
- Examples: "Use named exports, never default exports", "API routes follow /src/api/[resource]/route.ts", "Use repository pattern for DB access".

### Behavior Rules
- Define Claude's decision rights explicitly.
- What Claude can do freely: e.g., "Refactor within a single file without asking."
- What requires approval: e.g., "Never modify the DB schema without asking first."
- Common critical rules:
  - "Never skip tests."
  - "Do not install new packages without asking."
  - "Do not reformat files unrelated to the current issue."
  - "Only read files relevant to the current task."

### Testing
- Specify the test framework and runner.
- State what to mock vs. what to call for real.
- State when tests must be run (e.g., "Run npm run test before marking any task done").

### Warnings
- Document specific gotchas that have caused issues before.
- Example: "The /api/webhooks route must remain unprotected — do not add auth middleware to it."
- Example: "legacy-utils.ts is deprecated — do not add new calls to it."

## Lifecycle

- Review CLAUDE.md when Claude consistently makes the same mistake.
- Prune when a rule is no longer needed or Claude already follows it naturally.
- Commit project-level CLAUDE.md to git so the entire team benefits.
- Personal preferences belong in `~/.claude/CLAUDE.md`, not the project file.
