---
name: seed-reset
description: Resets and reseeds the local PostgreSQL database for development or E2E test preparation. Use when a clean database state is needed before running E2E tests or reproducing issues from a known seed. Destroys all local data and reruns all Prisma migrations before seeding. Don't use for production databases, partial data resets, or when only specific records need to be cleared.
disable-model-invocation: true
---

# Seed Reset

## Procedures

**Step 1: Warn the user**
1. Display the following warning before taking any action:

   > **AVISO: esta operação apaga todos os dados locais do banco e não pode ser desfeita.**
   > Confirme que deseja continuar.

2. Wait for explicit user confirmation ("sim", "yes", "pode", "ok", or equivalent). If the user does not confirm, abort and inform them no changes were made.

**Step 2: Run the reset**
1. Execute the following command from the project root (`/home/guiroos/Documentos/Projects/office-8-ball`):

   ```bash
   npm run prisma:reset -- --force
   ```

2. Capture the output. If the command exits with a non-zero code, read `references/troubleshooting.md` and report the error to the user.

**Step 3: Run the seed**
1. Execute:

   ```bash
   npm run prisma:seed
   ```

2. Scan the output for a success indicator (e.g., "Seeding finished", "seed completed", or "Created" entries). If found, report success to the user with the number of teams/records created.

3. If the command fails or no success indicator is found, read `references/troubleshooting.md` and report the error.

**Step 4: Confirm readiness**
1. Inform the user the database is ready. Suggest next steps based on context:
   - If the user was preparing for E2E tests: `npm run e2e`
   - If the user was debugging locally: `npm run dev`

## Error Handling

* If `prisma:reset` fails with a connection error, the `DATABASE_URL` environment variable may not be set. Instruct the user to verify it is present in their `.env.local` or shell environment.
* If `prisma:reset` fails with a migration conflict, run `npm run prisma:migrate` first, then retry.
* If `prisma:seed` fails, check `prisma/seed.mjs` for schema mismatches — a recent migration may require a seed update.
