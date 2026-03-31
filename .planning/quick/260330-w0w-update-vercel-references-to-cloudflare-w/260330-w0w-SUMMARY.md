---
phase: quick
plan: 260330-w0w
subsystem: docs
tags: [docs, cloudflare, deploy]
dependency_graph:
  requires: []
  provides: [accurate-deploy-docs]
  affects: [techspec/git-conventions.md, .claude/skills/release-workflow/references/deploy-workflow.md, .claude/rules/architecture.md, CLAUDE.md]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - .claude/skills/release-workflow/references/deploy-workflow.md
    - .claude/rules/architecture.md
    - techspec/git-conventions.md
    - CLAUDE.md
decisions:
  - "NEXTAUTH_SECRET and NEXTAUTH_URL removed from CLAUDE.md env docs (better-auth migration complete)"
metrics:
  duration: ~8min
  completed: "2026-03-31T02:08:00Z"
---

# Quick Task 260330-w0w: Update Vercel References to Cloudflare Workers Summary

Replaced all stale Vercel deployment references across four doc files with correct Cloudflare Workers equivalents, matching the actual `deploy-production-tag.yml` workflow.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite deploy-workflow.md and update architecture.md | f424319 | `.claude/skills/release-workflow/references/deploy-workflow.md`, `.claude/rules/architecture.md` |
| 2 | Update techspec/git-conventions.md and CLAUDE.md | d69dd1f | `techspec/git-conventions.md`, `CLAUDE.md` |

## What Changed

### deploy-workflow.md
- Rewrote entirely to match actual wrangler-based workflow (8 steps instead of 9 Vercel steps)
- Updated secrets table: removed NEXTAUTH_SECRET, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID; added BETTER_AUTH_SECRET, BETTER_AUTH_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
- Updated failure recovery section: Cloudflare auth instructions instead of Vercel

### architecture.md
- Updated CI/Deploy constraint: "keep Vercel as deployment platform" → "keep Cloudflare Workers as deployment platform"

### techspec/git-conventions.md
- Updated step 6 of release flow: Vercel → Cloudflare Workers
- Updated post-tag paragraph: Vercel → Cloudflare Workers
- Replaced entire secrets list: removed NEXTAUTH_SECRET/VERCEL_* secrets, added BETTER_AUTH_SECRET, BETTER_AUTH_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
- Updated explanatory paragraph to reference Cloudflare Workers (not Vercel CLI)

### CLAUDE.md
- Constraints section: "Vercel + GitHub Actions" → "Cloudflare Workers + GitHub Actions"
- Runtime section: "Node.js (via Next.js/Vercel)" → "Node.js (via Next.js/Cloudflare Workers)"
- Key Dependencies: removed `@vercel/speed-insights 2.0.0` entry
- Platform Requirements: "Vercel (primary deployment platform)" → "Cloudflare Workers (primary deployment platform)"
- Environment Variables sections: NEXTAUTH_SECRET/NEXTAUTH_URL → BETTER_AUTH_SECRET/BETTER_AUTH_URL (deviation — these were also stale from the better-auth migration)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical update] NEXTAUTH_SECRET still in CLAUDE.md env docs**
- **Found during:** Task 2 verification
- **Issue:** `grep -rn "NEXTAUTH_SECRET"` caught two occurrences in CLAUDE.md that the plan's explicit task actions didn't enumerate: the `## Environment Variables` code block and the GSD:stack-start `## Environment Variables` list
- **Fix:** Updated both sections to use BETTER_AUTH_SECRET and BETTER_AUTH_URL (matching the completed Phase 09 better-auth migration)
- **Files modified:** `CLAUDE.md`
- **Commit:** d69dd1f

## Self-Check: PASSED

Files exist:
- FOUND: `.claude/skills/release-workflow/references/deploy-workflow.md`
- FOUND: `.claude/rules/architecture.md`
- FOUND: `techspec/git-conventions.md`
- FOUND: `CLAUDE.md`
- FOUND: `.planning/quick/260330-w0w-update-vercel-references-to-cloudflare-w/260330-w0w-SUMMARY.md`

Commits exist:
- FOUND: f424319 (deploy-workflow.md + architecture.md)
- FOUND: d69dd1f (git-conventions.md + CLAUDE.md)
