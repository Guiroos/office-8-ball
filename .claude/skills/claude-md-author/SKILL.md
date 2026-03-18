---
name: claude-md-author
description: Guides the authoring of an excellent CLAUDE.md file for any Claude Code project. Analyzes project context, applies best practices for memory hierarchy, sections, and token budget, then generates or refactors a CLAUDE.md that gives Claude persistent, project-specific context. Use when creating a new CLAUDE.md, improving an existing one, or auditing a CLAUDE.md for anti-patterns. Do not use for general markdown documentation, README files, or non-Claude Code projects.
---

# CLAUDE.md Author

## Phase 1: Determine the Mode

Identify which mode applies before proceeding:

- **CREATE**: No CLAUDE.md exists at the project root — generate one from scratch.
- **REFACTOR**: A CLAUDE.md exists — audit it for anti-patterns and improve it.
- **AUDIT-ONLY**: The user wants a report of issues without applying changes.

If a `CLAUDE.md` already exists, read it before proceeding.

---

## Phase 2: Analyze Project Context

Execute the following discovery steps in parallel to gather signals:

1. Read `package.json` (or `Cargo.toml`, `go.mod`, `pyproject.toml`, etc.) to identify the language, framework, and exact versions.
2. Read `references/discovery-checklist.md` for the full list of files to inspect.
3. Identify the build, test, lint, and typecheck commands from the manifest scripts section.
4. Scan the root directory listing to detect key folders (`src/`, `app/`, `tests/`, `docs/`, `.github/`, etc.).
5. Check for existing config files: `.eslintrc`, `tsconfig.json`, `prettier.config.js`, `.env.example`, `docker-compose.yml`.

Record findings compactly — do not read files that are not listed in the discovery checklist unless explicitly needed.

---

## Phase 2b: Deep Codebase Search

Launch a **subagent_type=Explore** agent with thoroughness `"very thorough"` to surface patterns that are invisible from manifests alone. Run this in **parallel** with any remaining Phase 2 reads.

Instruct the agent to investigate and return findings on each of the following:

### Source Patterns
- Glob `src/**/*.{ts,tsx,js,jsx}` (or `app/`) — list unique directory names and count files per folder to map the module layout.
- Sample 2–3 files from each major folder (`components/`, `hooks/`, `services/`, `utils/`, `stores/`, `api/`, etc.) to detect:
  - Export style: named vs. default exports.
  - Import style: relative paths vs. path aliases (`@/`, `~/`, `~app/`).
  - Naming convention: PascalCase components, camelCase functions, kebab-case filenames.
  - TypeScript strictness signals: `as any`, non-null assertions, `unknown` usage.

### Testing Patterns
- Glob `**/*.{test,spec}.{ts,tsx,js}` — list a few representative files.
- Sample 1–2 test files to identify: test runner API (`describe`/`it`/`test`), mock strategy (`vi.mock`, `jest.mock`, `msw`), and whether integration or unit tests dominate.

### Architecture Signals
- Grep for common pattern markers: `createSlice`, `useQuery`, `prisma.`, `trpc.`, `createContext`, `zustand`, `jotai` — their presence signals state/data-fetching architecture.
- Check `src/` or `app/` for `_middleware.ts`, `layout.tsx`, `route.ts` — signals Next.js App Router vs Pages Router.
- Grep for `TODO`, `FIXME`, `DEPRECATED`, `@deprecated` to identify fragile areas worth a **Warnings** section.

### Git History (compact)
- Run `git log --oneline -20` to find the most-touched areas recently.
- Run `git diff --stat HEAD~5 HEAD` to surface hot files — good candidates for Warnings or Architecture notes.

### Output Contract
The Explore agent MUST return a structured summary with these keys:
```
module_layout: <list of directories with file counts>
export_style: <named | default | mixed>
import_style: <relative | alias (prefix) | mixed>
naming_convention: <PascalCase | camelCase | kebab-case | mixed>
test_runner: <vitest | jest | unknown>
mock_strategy: <vi.mock | jest.mock | msw | unknown>
state_libraries: <list>
data_fetching: <list>
router_type: <app-router | pages-router | other | unknown>
deprecated_areas: <list of files or patterns>
hot_files: <list from git diff>
```

Use these findings to populate **Architecture Decisions**, **Testing**, **Directory Structure**, and **Warnings** in Phase 3. Do not repeat information already captured in Phase 2.

---

## Phase 3: Draft or Refactor the CLAUDE.md

Read `references/best-practices.md` before writing any content. Apply all rules found there.

### Section Order (canonical)

Compose the CLAUDE.md using the following sections in order, omitting any section where no meaningful content exists:

1. **Project Overview** — one sentence: stack, purpose, key integrations.
2. **Tech Stack** — bullet list with exact versions.
3. **Common Commands** — build, dev, test, lint, typecheck, migrate. Use exact command strings.
4. **Directory Structure** — only non-obvious directories. Skip `/node_modules`, `/dist`, etc.
5. **Architecture Decisions** — naming conventions, patterns, where state lives, API structure.
6. **Behavior Rules** — what Claude must always or never do in this project.
7. **Testing** — framework, patterns, what to mock, when to run tests.
8. **Environment Setup** — required env vars, secrets, local tooling.
9. **Warnings** — known gotchas, deprecated code areas, fragile integrations.

Use `@path/to/file` imports for any section that would exceed 30 lines. Store the imported content in a `.claude/rules/` subdirectory.

### Token Budget Enforcement

- Root CLAUDE.md: 50–150 lines.
- Hard limit: 300 lines. If the draft exceeds this, move the largest section to a `.claude/rules/` file and add an `@` import.
- Total across all imported files: under 10,000 tokens.
- Apply the pruning test to every line: "Would removing this line cause Claude to make a mistake?" If no, delete it.

---

## Phase 4: Anti-Pattern Check

Run `python3 scripts/audit-claudemd.py --file CLAUDE.md` to detect anti-patterns automatically.

If the script is unavailable, manually verify against `references/anti-patterns.md`.

Fix every error returned. Re-run until the script exits with code 0.

---

## Phase 5: Output

For **CREATE** and **REFACTOR** modes:
- Write the final content to `CLAUDE.md` at the project root.
- Report a one-line summary of what was added, changed, or removed.

For **AUDIT-ONLY** mode:
- Output a structured report listing each issue found, the affected line or section, and the recommended fix. Do not write to disk.

---

## Error Handling

- **Missing manifest file:** If no `package.json` or equivalent is found, skip Phase 2 steps 1–3 and ask the user for the stack and commands.
- **CLAUDE.md exceeds 300 lines after refactor:** Extract the largest section into `.claude/rules/[section-name].md` and replace it with `@.claude/rules/[section-name].md`.
- **Anti-pattern audit script fails:** Read `references/anti-patterns.md` and apply checks manually.
- **Imported file (@) path not found:** Create the file before adding the import reference.
