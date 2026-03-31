# Deploy Production Tag — Workflow Reference

## Trigger

The `Deploy Production Tag` workflow runs on:
- `push` of a tag matching `v*`
- `workflow_dispatch` (manual trigger)

Pushing to `master` does **not** trigger a deploy.

## Exact step sequence inside the workflow

1. Checkout repository
2. Setup Node.js 20 with npm cache
3. `npm ci` — install dependencies
4. `npm run prisma:generate` — regenerate Prisma client
5. `npm run prisma:deploy` — apply pending migrations to production DB
6. `npm run build` — build production bundle (via vinext)
7. Sync Cloudflare runtime secrets via `npx wrangler secret put` for each of: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_ENV
8. `npm run deploy:cloudflare` (which runs `wrangler deploy`) — deploy to Cloudflare Workers

**Critical:** migrations run at step 5, before the build. If the migration fails, build and deploy do not run.

## Required GitHub secrets

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL` | Production Postgres connection string |
| `BETTER_AUTH_SECRET` | better-auth session secret |
| `BETTER_AUTH_URL` | better-auth base URL |
| `CLOUDFLARE_API_TOKEN` | Cloudflare CLI authentication |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier |

All five secrets must be present in the `production` GitHub environment. Missing any one causes the workflow to fail at the step that requires it.

## Failure recovery

### Migration failed
- Inspect the failed run: `gh run view <run-id> --log-failed`
- Fix the schema issue in a new branch, get it merged to master, then re-tag with a new version
- Never re-run the failed workflow with the same tag after a destructive schema change

### Cloudflare auth failed
- Confirm `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set in the `production` environment
- Regenerate the token at dash.cloudflare.com if expired

### Tag not triggering the workflow
- Verify the tag starts with `v` (e.g., `v1.0.0`, not `1.0.0`)
- Check `.github/workflows/deploy-production-tag.yml` — the `on.push.tags` pattern must be `v*`
