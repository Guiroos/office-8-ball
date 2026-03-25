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

- [ ] Dashboard exibe times buscados dinamicamente de `/api/teams` (remover hardcode)
- [ ] API `/api/scoreboard` retorna W/L agregado por time (reimplementar para times dinâmicos)
- [ ] Página de ranking exibe todos os times ordenados por vitórias
- [ ] Ranking mostra: W/L, win rate %, streak atual, total de partidas por time
- [ ] Página de times exibe os times do usuário com suas stats
- [ ] Registro de partida conectado aos times dinâmicos (não mais hardcoded)
- [ ] Head-to-head: histórico de confrontos diretos entre dois times
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
- **Times dinâmicos parcialmente implementados:** API `/api/teams` (GET/POST/PATCH) já existe; dashboard ainda usa hardcode de `frontend`/`backend`
- **Scoreboard API desativada:** `/api/scoreboard` retorna 503 — foi suspensa durante o refactor de times dinâmicos e precisa ser reimplementada
- **Schema do banco:** Modelos `User`, `Team`, `TeamMember`, `Match`, `AuthRateLimit` — teams tem `type` field disponível para distinguir `solo` vs `duo`
- **Tema visual:** Sistema de cores e tema já criado com Tailwind + shadcn/ui; tem margem para refinamento no look & feel
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
| Ranking baseado em W/L simples (sem ELO) | Contexto de escritório informal; complexidade de ELO não agrega valor | — Pending |
| Reativar `/api/scoreboard` para times dinâmicos | Endpoint correto já existe; precisa ser reimplementado para a nova estrutura | — Pending |

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
*Last updated: 2026-03-24 — Phase 01 (dynamic-team-management) complete*
