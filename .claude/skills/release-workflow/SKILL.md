---
name: release-workflow
description: Guides an agent through the full production release sequence for the office-8-ball project. Triggers when the user wants to publish a new production release by creating a version tag and deploying to Vercel. Deploys are tag-triggered via GitHub Actions, which runs prisma migrate deploy before the Vercel build — wrong step order causes a broken production deploy. Does not trigger when merging a feature PR into master without releasing, or when performing local testing or CI validation only.
---

# Release Workflow

## Step 1: Verify master is ready

1. Run `git checkout master && git pull origin master` to ensure the local branch is up to date.
2. Run `gh run list --branch master --limit 5` to inspect the latest CI runs on master.
3. Confirm the three required checks are green for the latest master commit:
   - `CI`
   - `Dependency Review`
   - `CodeQL`
4. If any check is failing, stop and surface the failure to the user before proceeding.

## Step 2: Determine the next version

1. Run `git tag --sort=-version:refname | head -5` to list the most recent tags.
2. Determine the next `vX.Y.Z` version using semantic versioning:
   - `MAJOR` — breaking change (incompatible API or data model change)
   - `MINOR` — new backward-compatible feature
   - `PATCH` — backward-compatible bug fix or docs-only change
3. Confirm the chosen version with the user before continuing.

## Step 3: Create the annotated tag

1. Run the following command with the confirmed version:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```
2. Do **not** push the tag yet — verify it locally first with `git show vX.Y.Z`.

## Step 4: Push master and the tag

1. Push master first:
   ```bash
   git push origin master
   ```
2. Push the tag to trigger the deploy workflow:
   ```bash
   git push origin vX.Y.Z
   ```
3. The `Deploy Production Tag` GitHub Actions workflow starts automatically on tag push. Read `references/deploy-workflow.md` for the exact sequence the workflow executes.

## Step 5: Monitor the deploy

1. Run `gh run list --limit 5` to find the triggered `Deploy Production Tag` run.
2. Run `gh run watch <run-id>` to follow the workflow in real time.
3. Confirm the following steps complete successfully inside the workflow:
   - `Apply Prisma migrations` (`prisma migrate deploy`)
   - `Build production artifacts` (Vercel CLI build)
   - `Deploy production artifacts` (Vercel CLI deploy)
4. If the workflow fails, read `references/deploy-workflow.md` for the failure recovery procedure.

## Step 6: Create the GitHub Release

1. Run the following to create the release with notes:
   ```bash
   gh release create vX.Y.Z \
     --title "vX.Y.Z" \
     --notes "$(cat <<'EOF'
   ## What's changed

   ### Features
   - ...

   ### Fixes
   - ...

   ### Operational notes
   - ...
   EOF
   )"
   ```
2. Summarize all changes merged into master since the previous tag. Use `git log <prev-tag>..vX.Y.Z --oneline` to enumerate commits.
3. Return the GitHub Release URL to the user.

## Error Handling

- **Tag already exists:** Never move or force-overwrite a published tag. If a fix is needed after tagging, publish a new patch version.
- **Deploy workflow not triggered:** Confirm the tag matches the `v*` pattern. The workflow only runs on tags prefixed with `v`. Check `.github/workflows/deploy-production-tag.yml`.
- **Migration fails inside workflow:** The Prisma migration runs against the production `DATABASE_URL` secret. A failure here means the schema change is incompatible with the current production DB. Do not re-run until the schema issue is resolved.
- **Missing GitHub secrets:** If the workflow fails with auth or env errors, read `references/deploy-workflow.md` for the required secrets list.
- **CI not green on master:** Do not proceed with the tag. Open the failing workflow run with `gh run view <run-id> --log-failed` to diagnose.
