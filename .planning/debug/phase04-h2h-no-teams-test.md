---
status: resolved
phase: 04-ranking-team-details
updated: 2026-03-26T01:50:44Z
---

# Debug Session: phase04-h2h-no-teams-test

Symptom: impossível testar H2H por falta de times/rivais.

Root cause: ambiente sem dados de times e confrontos.

Evidence:
- src/components/teams/h2h-section.tsx depende de rivals/h2hByRival
- src/lib/team-details.ts deriva rivals de listUserTeams(viewer)
- prisma/seed.mjs sem times iniciais
