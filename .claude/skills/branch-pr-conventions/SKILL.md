---
name: branch-pr-conventions
description: Guides an agent through branch naming, conventional commits, and pull request creation for the office-8-ball project. Use when creating a new branch, writing commit messages, or opening a pull request. Ensures compliance with git-conventions.md and github-operations.md, including required CI checks and merge rules. Does not trigger when already on an implementation branch doing feature work, or when the user is not yet ready to open a PR.
---

# Branch and PR Conventions

## Step 1: Create a correctly named branch

1. Identify the change type and pick the matching prefix. Read `references/branch-and-commit-rules.md` for the full prefix table and examples.
2. Keep the branch name short, lowercase, and hyphen-separated. A single clear objective per branch.
3. Create and switch to the branch from an up-to-date master:
   ```bash
   git checkout master && git pull origin master
   git checkout -b <prefix>/<short-name>
   ```
4. Reject generic names like `ajustes`, `teste`, or `fixes`. Use `hotfix/` only for urgent corrections after a published release.

## Step 2: Write conventional commits

1. Use the format: `tipo: descricao curta` (imperative, lowercase, no period).
2. Match the type to the change. Read `references/branch-and-commit-rules.md` for the allowed types and examples.
3. Keep each commit focused on a single logical change. Avoid bundling unrelated edits.

## Step 3: Run the minimal validation for the change type

1. Before opening a PR, run the smallest set of checks that covers what changed.
2. Read `.claude/rules/safe-change.md` — the "Validation Commands" section lists the exact commands per change type (auth, scoreboard, persistence, theme, UI primitives).
3. Fix any lint, typecheck, test, or build failure before proceeding.

## Step 4: Open the pull request

1. Push the branch:
   ```bash
   git push -u origin <branch-name>
   ```
2. Open the PR targeting `master`:
   ```bash
   gh pr create \
     --base master \
     --title "<tipo>: <descricao curta>" \
     --body "$(cat <<'EOF'
   ## O que muda

   - ...

   ## Como testar

   - ...
   EOF
   )"
   ```
3. Keep the PR title in the same Conventional Commits format as commit messages.
4. Keep the PR focused on a single objective. Split unrelated changes into separate PRs.

## Step 5: Verify required checks pass

1. Run `gh pr checks <pr-number>` to monitor CI status.
2. The three required checks are: `CI`, `Dependency Review`, `CodeQL`. All must be green before merge.
3. Resolve all open review conversations before merging.
4. Do not force-push to `master`. Do not bypass checks with `--no-verify`.
5. If the branch diverged from master, rebase or merge master in before the final merge.

## Error Handling

- **Branch name rejected by convention:** Rename with `git branch -m <old> <new>`, then re-push.
- **CI failing on the PR:** Run `gh run view <run-id> --log-failed` to read the failing step. Fix the root cause — do not skip hooks.
- **Merge blocked by unresolved conversations:** Address each open comment. Do not merge with unresolved threads.
- **Wrong base branch:** Close the PR and reopen with `--base master`. Do not retarget a merged PR.
- **Hotfix after a release:** Use `hotfix/<short-name>`, follow the same PR flow, then follow the `release-workflow` skill to publish a new patch version.
