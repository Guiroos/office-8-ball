---
# No path scope — applies globally before finishing any task.
---

# Safe Change Checklist

For authenticated shell or sidebar layout changes, read `techspec/sidebar-layout.md` first.

Before finishing, verify:

1. Does the app still support both persistence modes (Prisma and in-memory)?
2. Is the scoreboard still derived from match history — no stored counters introduced?
3. Are `frontend` and `backend` still the only accepted team ids (unless the task explicitly changed that)?
4. Did `/dashboard` remain the functional route while `/scoreboard` stayed as a legacy redirect?
5. Did API response shapes stay compatible with the current UI?
6. Did login, signup, and protected routes stay consistent with the current auth model?
7. Did you update docs only where behavior actually changed — no preemptive edits?
