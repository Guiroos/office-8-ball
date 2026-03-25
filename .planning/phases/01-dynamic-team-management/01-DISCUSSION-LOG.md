# Phase 1: Dynamic Team Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-03-24
**Phase:** 01-dynamic-team-management
**Mode:** discuss
**Areas discussed:** Times solo, Gerenciamento de membros, In-memory fallback

## Gray Areas Presented

| Gray Area | Selected for Discussion |
|-----------|------------------------|
| Times solo | Yes |
| Gerenciar membros pós-criação | Yes |
| In-memory fallback para rotas de times | Yes |

## Codebase State at Discussion Time

PR #67 (feature/dynamic-teams) foi mergeado antes da Fase 1 ser planejada no GSD. Infra já existente:
- `src/lib/teams.ts` — 7 funções de domínio (createTeam, listUserTeams, getTeamById, archiveTeam, isTeamMember, findUserByUsername, findUserById)
- GET/POST /api/teams, GET /api/teams/:id, PATCH /api/teams/:id/archive, GET /api/users?username=

Lacunas identificadas: campo `type` ausente no schema, sem suporte a solo na createTeam, sem endpoints de membros pós-criação, rotas de times retornam 503 sem DATABASE_URL.

## Decisions Made

### Times solo
- **Question:** Como o tipo solo/duo deve funcionar?
- **User chose:** Tipo fixo na criação — campo `type: 'solo' | 'duo'` no schema Prisma. Solo = só criador, sem secondMemberUserId.

### Gerenciamento de membros
- **Question:** Quem pode gerenciar membros pós-criação?
- **User chose:** Qualquer membro do time pode adicionar/remover outros membros (não apenas o criador).

### In-memory fallback
- **Question:** O que retornar sem DATABASE_URL?
- **User chose:** Lista vazia `{ teams: [] }` para GET /api/teams. POST e rotas de detalhes continuam 503.

## Corrections Made

No corrections — all initial suggestions were accepted or user chose from presented options.
