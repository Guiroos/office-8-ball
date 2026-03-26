---
status: resolved
phase: 04-ranking-team-details
updated: 2026-03-26T01:50:44Z
---

# Debug Session: phase-04-ranking-team-404

Symptom: sem time para clicar e abrir /times/{id}.

Root cause: não há times ativos para alimentar ranking.

Evidence:
- src/components/ranking/ranking-view.tsx empty state
- src/lib/ranking.ts depende de times ativos
- prisma/seed.mjs sem bootstrap
