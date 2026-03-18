# CLAUDE.md Anti-Patterns

Each entry lists the pattern, why it hurts, and how to fix it.

## AP-01: Style Rules That Belong in a Linter
- **Pattern:** Listing code style rules (indentation, semicolons, quote style) in CLAUDE.md.
- **Why it hurts:** Linters are deterministic and free. LLMs are slow and expensive. Duplicating linter rules wastes context budget.
- **Fix:** Remove style rules. Use ESLint, Prettier, or equivalent. Add a reference: "See `.eslintrc` for code style rules."

## AP-02: File Too Long (300+ lines)
- **Pattern:** A root CLAUDE.md file that exceeds 300 lines.
- **Why it hurts:** Claude silently ignores content past its effective attention range. Critical rules get lost in noise.
- **Fix:** Extract the largest section to `.claude/rules/[section].md` and replace with `@.claude/rules/[section].md`.

## AP-03: Vague Instructions
- **Pattern:** "Write clean code", "Follow best practices", "Be careful with the database."
- **Why it hurts:** Claude cannot act on imprecise instructions. These lines waste tokens without changing behavior.
- **Fix:** Replace with specific, actionable rules: "Use named exports. Never use `any`. Run `npx prisma validate` before committing schema changes."

## AP-04: Treating It Like Documentation
- **Pattern:** Long paragraphs explaining the history or rationale of the codebase.
- **Why it hurts:** CLAUDE.md is a context injection file, not a wiki. Paragraphs dilute signal-to-noise ratio.
- **Fix:** Rewrite as bullet-point imperatives. Move narrative context to a separate docs file if needed.

## AP-05: Not Committing to Git
- **Pattern:** CLAUDE.md in `.gitignore` or not tracked.
- **Why it hurts:** Team members work with different contexts. Behavior diverges between engineers.
- **Fix:** Commit `CLAUDE.md` to git. Move personal preferences to `~/.claude/CLAUDE.md` or `CLAUDE.local.md` (gitignored).

## AP-06: Mixing Personal and Team Preferences
- **Pattern:** Personal habits ("I prefer single quotes", "Always use my custom alias") in the project CLAUDE.md.
- **Why it hurts:** Forces personal style on all team members. Causes conflicts.
- **Fix:** Personal preferences → `~/.claude/CLAUDE.md`. Team rules → `./CLAUDE.md`.

## AP-07: Duplicating What's in Config Files
- **Pattern:** Repeating settings already enforced by `tsconfig.json`, `.eslintrc`, `prettier.config.js`.
- **Why it hurts:** Pure noise. Wastes token budget.
- **Fix:** Delete duplicates. Add a one-line reference: "TypeScript config in `tsconfig.json`."

## AP-08: Authorizing Broad File Audits
- **Pattern:** Not scoping Claude's investigations; allowing it to read hundreds of files per task.
- **Why it hurts:** Fills context window quickly, slows responses, increases cost.
- **Fix:** Add an explicit rule: "Only read files directly related to the current task. Do not audit the entire codebase unless explicitly asked."

## AP-09: Missing Common Commands Section
- **Pattern:** Omitting build, test, lint, and dev commands from CLAUDE.md.
- **Why it hurts:** Claude guesses commands, often incorrectly (e.g., `npm test` vs `bun run test`).
- **Fix:** Always include a `## Common Commands` section with exact, copy-pasteable strings.

## AP-10: Overly Permissive Behavior Rules
- **Pattern:** No rules about when Claude needs approval (e.g., schema changes, package installs).
- **Why it hurts:** Claude may make irreversible changes autonomously.
- **Fix:** Add explicit decision rights: "Never modify the database schema without asking. Do not install new packages without approval."
