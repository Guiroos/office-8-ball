---
# No path scope — applies globally before finishing any task.
---

# Safe Change Checklist

For authenticated shell or sidebar layout changes, read `techspec/sidebar-layout.md` first.

Before finishing, verify:

1. Does `DATABASE_URL` absence still return 503 — no new routes that skip the DB guard?
2. Is the scoreboard still derived from match history — no stored counters introduced?
3. Are teams fully dynamic (no hardcoded team IDs crept back in)?
4. Did `/dashboard` remain the functional route while `/scoreboard` stayed as a legacy redirect?
5. Did API response shapes stay compatible with the current UI?
6. Did login, signup, and protected routes stay consistent with the current auth model?
7. Did you update docs only where behavior actually changed — no preemptive edits?
