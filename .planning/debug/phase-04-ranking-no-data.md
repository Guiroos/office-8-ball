---
status: resolved
phase: 04-ranking-team-details
updated: 2026-03-26T01:50:44Z
---

# Debug Session: phase-04-ranking-no-data

Symptom: Ranking sem dados para UAT.

Root cause: Ambiente sem times ativos; seed não cria times; /times?tab=create está placeholder.

Evidence:
- src/lib/ranking.ts filtra por status active
- prisma/seed.mjs não cria times
- src/app/(authenticated)/times/page.tsx não cria times na aba create
