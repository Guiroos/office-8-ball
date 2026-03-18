# Deploy Production Tag — Workflow Reference

## Trigger

The `Deploy Production Tag` workflow runs on:
- `push` of a tag matching `v*`
- `workflow_dispatch` (manual trigger)

Pushing to `master` does **not** trigger a deploy. Automatic Vercel previews are disabled (`vercel.json` sets `git.deploymentEnabled: false`).

## Exact step sequence inside the workflow

1. Checkout repository
2. Setup Node.js 20 with npm cache
3. `npm ci` — install dependencies
4. `npm run prisma:generate` — regenerate Prisma client
5. `prisma migrate deploy` — apply pending migrations to production DB
6. Install Vercel CLI globally
7. `vercel pull --yes --environment=production` — pull Vercel env config
8. `vercel build --prod` — build production artifacts
9. `vercel deploy --prebuilt --prod` — deploy to Vercel production

**Critical:** migrations run at step 5, before the build. If the migration fails, the build and deploy do not run.

## Required GitHub secrets

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL` | Production Postgres connection string |
| `NEXTAUTH_SECRET` | Auth.js session secret |
| `VERCEL_TOKEN` | Vercel CLI authentication |
| `VERCEL_ORG_ID` | Vercel organization identifier |
| `VERCEL_PROJECT_ID` | Vercel project identifier |

All five secrets must be present in the `production` GitHub environment. Missing any one causes the workflow to fail at the step that requires it.

## Failure recovery

### Migration failed
- Inspect the failed run: `gh run view <run-id> --log-failed`
- Fix the schema issue in a new branch, get it merged to master, then re-tag with a new version
- Never re-run the failed workflow with the same tag after a destructive schema change

### Vercel auth failed
- Confirm `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are set in the `production` environment
- Regenerate the Vercel token at vercel.com/account/tokens if expired

### Tag not triggering the workflow
- Verify the tag starts with `v` (e.g., `v1.0.0`, not `1.0.0`)
- Check `.github/workflows/deploy-production-tag.yml` — the `on.push.tags` pattern must be `v*`
