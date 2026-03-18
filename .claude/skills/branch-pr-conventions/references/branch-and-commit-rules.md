# Branch and Commit Rules

## Branch prefixes

| Prefix | Use for |
|--------|---------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | Refactoring without intentional functional change |
| `test/` | Tests only |
| `chore/` | General maintenance |
| `ci/` | Pipeline, workflows, and automations |
| `hotfix/` | Urgent fix after a published release |

**Examples:**
- `feat/login-error-states`
- `fix/scoreboard-tie-copy`
- `docs/release-process`
- `hotfix/auth-session-cookie`

**Rules:**
- One clear objective per branch
- Reject generic names: `ajustes-finais`, `teste`, `fixes`
- Use `hotfix/` only for corrections after a release tag; for pre-release fixes, use `fix/`

## Commit types and format

Format: `tipo: descricao curta`

| Type | Use for |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Refactoring without intentional functional change |
| `test` | Tests |
| `chore` | General maintenance |
| `ci` | Pipeline, workflows, automations |

**Examples:**
```
feat: add protected scoreboard redirect
fix: prevent empty auth field errors from sticking
docs: document release and versioning flow
ci: run workflow on master pushes
refactor: extract score derivation into helper
test: cover scoreboard tie edge case
```

**Rules:**
- Imperative mood, lowercase, no trailing period
- No large commits mixing unrelated changes
- Prefer squash merge when the PR has noisy intermediate history

## PR merge rules

Required passing checks before merge:
- `CI`
- `Dependency Review`
- `CodeQL`

Operational constraints:
- No direct push to `master`
- No force-push to `master`
- Branch must be up to date with `master` before merge when required
- All review conversations must be resolved before merge
