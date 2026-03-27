# Office Sinuca Tracker

## What This Is

App de rastreamento de partidas de sinuca para o escritório. Colegas criam times (duplas ou solo), registram resultados de partidas e acompanham o ranking geral por vitórias/derrotas. A tela principal é a classificação — quem está no topo agora.

## Core Value

O ranking de times sempre atualizado — qualquer colega abre o app e vê imediatamente quem está ganhando.

## Requirements

### Validated

<!-- Já existe no codebase e funciona. -->

- ✓ Usuário pode criar conta com email e senha — existing
- ✓ Usuário pode fazer login e manter sessão via JWT — existing
- ✓ Sessão protegida por middleware (rotas autenticadas) — existing
- ✓ Rate limiting em login e registro — existing
- ✓ Usuário pode criar time do tipo duo (dupla) com nome único — existing
- ✓ Usuário pode listar seus times — existing
- ✓ Usuário pode arquivar um time — existing
- ✓ Usuário pode registrar resultado de partida (deve ser membro do time) — existing
- ✓ Shell do app com sidebar e navegação — existing
- ✓ Usuário pode criar time do tipo solo (1v1) com `type: solo` — Validated in Phase 01: dynamic-team-management
- ✓ Usuário pode adicionar e remover membros de um time com guards de permissão — Validated in Phase 01: dynamic-team-management

### Active

<!-- Scope atual. Construindo em direção a estes. -->

- ✓ Dashboard exibe times buscados dinamicamente de `/api/teams` (remover hardcode) — Validated in Phase 02: scoreboard-reactivation-match-recording
- ✓ API `/api/scoreboard` retorna W/L agregado por time (reimplementar para times dinâmicos) — Validated in Phase 02: scoreboard-reactivation-match-recording
- ✓ Módulo de stats puro (`computeTeamStats`, `computeHeadToHead`) com Zod e 21 testes — Validated in Phase 03: stats-computation-module
- ✓ Página de ranking exibe todos os times ordenados por vitórias — Validated in Phase 05: user-profiles-advanced-features
- ✓ Ranking mostra: W/L, win rate %, streak atual, total de partidas por time — Validated in Phase 05: user-profiles-advanced-features
- ✓ Ranking com filtros de período (all/month/week) com tabs e preservação de query params — Validated in Phase 05: user-profiles-advanced-features
- ✓ Página de perfil exibe stats agregadas reais (wins, losses, win rate, total) por time — Validated in Phase 05: user-profiles-advanced-features
- ✓ Head-to-head: rota dedicada `/head-to-head` com URL compartilhável e fallback robusto — Validated in Phase 05: user-profiles-advanced-features
- ✓ Acesso ao detalhe do time restrito a membros; não-membros veem tela de acesso negado — Validated in Phase 07: team-details-access-member-actions
- ✓ Convite e remoção de membros conectados às rotas reais com feedback visual — Validated in Phase 07: team-details-access-member-actions
- [ ] Página de times exibe os times do usuário com suas stats
- [ ] Registro de partida conectado aos times dinâmicos (não mais hardcoded)
- [ ] Melhorias visuais: aparência descontraída e profissional, margem sobre o tema atual

### Out of Scope

<!-- Limites explícitos com razão para não reabrir depois. -->

- App mobile — web-first; mobile pode vir depois se houver demanda
- Sistema ELO / pontuação dinâmica — W/L simples é suficiente para o contexto de escritório; complexidade desnecessária agora
- Brackets / torneios — fora do escopo de rastreamento contínuo
- Notificações em tempo real (WebSocket/push) — não necessário na escala de escritório
- Painel de moderação / admin — contexto de confiança entre colegas, desnecessário

## Context

- **Codebase existente:** Next.js 16 App Router, React 19, TypeScript, Prisma + PostgreSQL, Auth.js v4, Tailwind CSS 4, shadcn/ui
- **Times dinâmicos completos:** API `/api/teams` (GET/POST/PATCH), dashboard usa `useTeamsData()` hook para buscar times dinamicamente
- **Scoreboard API ativa:** `/api/scoreboard` retorna W/L agregado para todos os times do usuário via `getScoreboard()` (sem limite de query)
- **Schema do banco:** Modelos `User`, `Team`, `TeamMember`, `Match`, `AuthRateLimit` — teams tem `type` field disponível para distinguir `solo` vs `duo`
- **Tema visual:** Sistema de cores e tema já criado com Tailwind + shadcn/ui; tem margem para refinamento no look & feel
- **Acesso ao time:** Detalhe do time agora gated por `isTeamMember`; retorna union `not-found | forbidden | detail` antes de qualquer query pesada
- **Escala:** Uso interno de escritório — performance não é preocupação crítica; confiabilidade e clareza visual são prioridade

## Constraints

- **Tech stack:** Next.js + Prisma + PostgreSQL — não introduzir serviço backend separado
- **Dois modos:** App deve continuar funcionando em modo in-memory (sem DATABASE_URL) para dev e testes — qualquer nova rota precisa respeitar esse guard
- **Schema:** Nunca modificar `prisma/schema.prisma` sem aprovação explícita — mudanças requerem migration e seed atualizados juntos
- **Auth:** Credenciais apenas (email/senha) — sem OAuth para v1
- **Deploy:** Vercel + GitHub Actions; migrations rodadas antes do build no CI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Times como entidade única (solo e duo) com `type` field | Mantém schema uniforme; evita duplicar lógica de partidas e stats por tipo | ✓ Validated Phase 01 |
| Ranking baseado em W/L simples (sem ELO) | Contexto de escritório informal; complexidade de ELO não agrega valor | ✓ Validated Phase 03 |
| Stats como módulo puro (stats.ts) separado da camada de API | Facilita testes unitários sem DB; reutilizável por qualquer rota futura | ✓ Validated Phase 03 |
| Reativar `/api/scoreboard` para times dinâmicos | Endpoint correto já existe; precisa ser reimplementado para a nova estrutura | ✓ Validated Phase 02 |

## Evolution

Este documento evolui a cada transição de fase e milestone.

**Após cada transição de fase** (via `/gsd:transition`):
1. Requirements invalidados? → Mover para Out of Scope com razão
2. Requirements validados? → Mover para Validated com referência de fase
3. Novos requirements emergiram? → Adicionar em Active
4. Decisões a registrar? → Adicionar em Key Decisions
5. "What This Is" ainda preciso? → Atualizar se divergiu

**Após cada milestone** (via `/gsd:complete-milestone`):
1. Revisão completa de todas as seções
2. Core Value check — ainda é a prioridade certa?
3. Auditar Out of Scope — razões ainda válidas?
4. Atualizar Context com estado atual

---
*Last updated: 2026-03-27 — Phase 08 (ranking-team-verification-recovery) complete — Recovered missing Phase 4 verification artifact (RANK-01..04 documented), repaired full traceability chain, v1.0 milestone audit now passes cleanly*
