# Phase 5: User Profiles & Advanced Features - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar perfil do usuário com métricas agregadas (wins, losses, win rate geral, total de partidas e times do usuário com stats), adicionar filtros temporais no ranking (geral, mês, semana) e tornar o histórico H2H acessível por rota dedicada.

Não inclui mudanças de schema, ELO, notificações em tempo real, nem novas capacidades fora de PROF-01..03 e RANK-05.

</domain>

<decisions>
## Implementation Decisions

### Perfil do usuário
- **D-01:** [auto] Calcular stats do perfil a partir de histórico de partidas + memberships (dados derivados), sem contadores persistidos.
- **D-02:** [auto] Exibir lista de times do usuário com métricas por time (W/L, win rate, total), com ordenação por vitórias desc.
- **D-03:** [auto] Total de partidas do usuário conta qualquer partida em que o usuário seja membro de pelo menos um dos dois times.

### Ranking com filtros por período
- **D-04:** [auto] Filtros no ranking: `all` (geral), `month` (mês atual), `week` (semana atual).
- **D-05:** [auto] Filtro temporal e filtro por tipo coexistem via query params (ex.: `/ranking?type=solo&period=month`).
- **D-06:** [auto] Âncoras temporais usam timezone do servidor/app (`new Date()`), sem configuração por usuário nesta fase.

### Head-to-head dedicado
- **D-07:** [auto] Criar rota dedicada `/head-to-head?teamA=x&teamB=y`, reaproveitando `computeHeadToHead()`.
- **D-08:** [auto] Team detail continua com seção H2H local; rota dedicada complementa para comparação direta e compartilhável.

### the agent's Discretion
- Visual exato dos controles de período (tabs, segmented control, ou chips) mantendo padrões de UI já usados no projeto.
- Estratégia de empty/loading states para perfil e H2H dedicado.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos e fase
- `.planning/ROADMAP.md` — Phase 5, objetivo, dependências e success criteria (RANK-05, PROF-01..03, H2H dedicado)
- `.planning/REQUIREMENTS.md` — requisitos pendentes de perfil e ranking temporal
- `.planning/STATE.md` — posição atual do roadmap e decisões acumuladas

### Contexto prévio obrigatório
- `.planning/phases/04-ranking-team-details/04-CONTEXT.md` — decisões de ranking/team-detail já estabelecidas
- `.planning/phases/01-dynamic-team-management/01-CONTEXT.md` — decisões base de times dinâmicos e dual-mode

### Domínio e dados
- `src/lib/stats.ts` — `computeTeamStats()` e `computeHeadToHead()` (fonte de verdade para derivação)
- `src/lib/ranking.ts` — pipeline de ranking atual e ordenação
- `src/lib/team-details.ts` — montagem server-side de detalhe de time e H2H por rival
- `src/lib/data.ts` — acesso a partidas (sem limitar query de histórico)
- `src/lib/teams.ts` — memberships e recuperação de times por usuário
- `src/lib/types.ts` — contratos de tipos compartilhados

### Superfícies de UI/API já existentes
- `src/app/(authenticated)/profile/page.tsx` — rota de perfil atual
- `src/components/profile/profile-page.tsx` — UI atual com TODO de times dinâmicos
- `src/app/api/profile/route.ts` — API de perfil existente
- `src/app/(authenticated)/ranking/page.tsx` — ranking atual com filtro de tipo
- `src/components/ranking/type-tabs.tsx` — componente de tabs de filtro
- `src/app/(authenticated)/times/[id]/page.tsx` — integração atual de detalhe de time
- `src/components/teams/h2h-section.tsx` — seção H2H já implementada

### Regras e guardrails
- `.claude/rules/api-patterns.md` — padrões de rotas e erros
- `.claude/rules/testing.md` — padrões de testes unitários/rotas
- `.claude/rules/ui-components.md` — padrões de composição UI
- `AGENTS.md` — constraints ativos (dual-mode, statuses protegidos, sem hardcode)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/stats.ts` já entrega agregações necessárias para profile e H2H.
- `src/lib/ranking.ts` já centraliza ordenação e pode ser estendido para período.
- `src/components/ranking/type-tabs.tsx` já define padrão de filtro navegável por query.
- `src/components/teams/h2h-section.tsx` já resolve UX base de comparação entre times.
- `src/components/primitives/stat-tile.tsx` já cobre cartões de métrica para perfil/ranking.

### Established Patterns
- Rotas protegidas seguem `hasDatabaseUrl` + `getAuthenticatedUser` antes de qualquer query.
- Páginas de ranking e time details usam Server Components para fetch server-side.
- Erros e validações em PT-BR, contratos tipados em `src/lib/types.ts`.

### Integration Points
- Perfil: evoluir `src/components/profile/profile-page.tsx` para dados agregados reais e times dinâmicos.
- Ranking: estender `src/app/(authenticated)/ranking/page.tsx` + `src/lib/ranking.ts` para `period`.
- H2H dedicado: adicionar nova rota autenticada em `src/app/(authenticated)/head-to-head/page.tsx`.
- API/serviço: considerar função de domínio para perfil agregado sem quebrar dual-mode.

</code_context>

<specifics>
## Specific Ideas

- Manter linguagem visual atual (cards + stat tiles) para reduzir atrito cognitivo.
- Em perfil, destacar primeiro as métricas globais do usuário e depois a lista de times.
- Em ranking, período deve ser visível no topo junto dos filtros por tipo.
- Em H2H dedicado, manter seleção explícita de Team A/Team B e permitir deep-link por querystring.

</specifics>

<deferred>
## Deferred Ideas

- Filtro customizado por intervalo de datas (from/to) — fase futura.
- Timezone por usuário/perfil — fase futura.
- Analytics avançado por jogador (histórico cronológico completo com drill-down) — fase futura.

</deferred>

---

*Phase: 05-user-profiles-advanced-features*
*Context gathered: 2026-03-25*
