---
name: git-worktree-flow
description: Create repository-aligned git branches and conventional commits from the current worktree. Use when Codex needs to read this repo's git rules, choose a compliant branch name, stage only relevant files, and create one or more focused commits for the changes already present in the working tree.
---

# Git Worktree Flow

Read `techspec/git-conventions.md` before any git write action. Treat that file as the source of truth for branch naming, commit format, PR flow, and release expectations in this repository.

## Workflow

1. Read `techspec/git-conventions.md`.
2. Inspect the current git state with:
   - `git branch --show-current`
   - `git status --short`
   - `git diff --stat`
   - targeted `git diff -- <file>` for changed files
3. Infer the smallest coherent objective represented by the current worktree.
4. Split unrelated changes before committing.
5. Create or keep the branch according to the repo convention.
6. Stage only files that belong to the chosen objective.
7. Create conventional commits with short imperative subjects.
8. Report exactly what branch and commit(s) were created and which validations ran.

## Branch Rules

- Prefer one objective per branch.
- Use the prefixes defined in `techspec/git-conventions.md`:
  - `feat/`
  - `fix/`
  - `docs/`
  - `refactor/`
  - `test/`
  - `chore/`
  - `ci/`
  - `hotfix/`
- Keep the suffix lowercase, short, and hyphenated.
- Avoid generic names.

When choosing the branch name, derive it from the dominant intent of the changed files, not from a single filename.

Examples:

- dashboard copy fix -> `fix/scoreboard-copy`
- auth validation cleanup -> `refactor/auth-validation`
- workflow updates -> `ci/dependency-review`
- docs-only change -> `docs/git-flow`

## Commit Rules

- Use `Conventional Commits` exactly as required by the repo.
- Keep each commit focused on one intent.
- Stage files explicitly; do not use broad staging when unrelated changes exist.
- Prefer multiple small commits over one mixed commit when the worktree contains separable concerns.
- Keep commit subjects short and descriptive.

Examples:

- `fix: silence dotenv loading in Prisma config`
- `docs: document release and versioning flow`
- `ci: update dependency review workflow`

## Decision Guide

If the worktree has one clear goal:
- create or keep one matching branch
- create one commit, or a small sequence of tightly related commits

If the worktree mixes concerns:
- separate by intent first
- commit only the files that belong together
- leave unrelated files unstaged unless the user asked to include them

If the user is already on a compliant non-`master` branch for the same objective:
- keep the current branch
- do not create a new branch just because the skill was invoked

If the user is on `master` or on a branch with a mismatched objective:
- create a new branch before committing

If there are existing user changes that conflict with the inferred objective:
- stop and ask before staging or committing files that may not belong together

## Safety Rules

- Never rewrite history unless the user explicitly asks.
- Never use destructive commands such as `git reset --hard`.
- Never stage all changes blindly.
- Never commit generated noise, lockfile churn, or unrelated formatting unless it is part of the intended objective.
- Do not create tags, releases, or merge branches unless explicitly requested.
- Respect repository-level instructions that forbid reverting unrelated user changes.

## Validation

Run the smallest useful validation set for the files being committed. Prefer commands already documented in `AGENTS.md` for the touched area.

Examples:

- app or shared TypeScript change -> `npm run typecheck`
- UI or route behavior change -> `npm run build`
- targeted test file when the touched area has focused tests

If validation cannot run, say so clearly in the final report.

## Final Report

Report:

- the git convention source that was used
- the branch created or retained
- the commit message(s)
- the files included in each commit
- the validation that ran and its outcome
- any leftover unstaged or uncommitted files
