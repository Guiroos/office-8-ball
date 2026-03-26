# Phase 5: User Profiles & Advanced Features - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar perfil do usuário com métricas agregadas (wins, losses, win rate geral, total de partidas e times do usuário com stats), adicionar filtros temporais no ranking (geral, mês, semana) e tornar o histórico H2H acessível por rota dedicada.

Não inclui mudanças de schema, ELO, notificações em tempo real, nem novas capacidades fora de PROF-01..03 e RANK-05.

</domain>

<decisions>
## Implementation Decisions

### Profile data architecture
- **D-01:** Perfil será montado server-side por assembler de domínio (RSC em `/profile`) com payload consolidado (user + stats agregadas + stats por time).
- **D-02:** `GET/PUT /api/profile` permanece focado em campos editáveis da conta (identidade/bio/avatar/email), sem agregar métricas de jogo.
- **D-03:** `/profile` adota renderização server-first com estados de rota (sem fluxo principal de loading por fetch client).
- **D-04:** Agregação de perfil ficará em módulo dedicado (ex.: `src/lib/profile-stats.ts`), não em `team-details.ts` e não no page component.

### Profile aggregation semantics
- **D-05:** "Partidas jogadas" conta partida quando usuário pertence a pelo menos um dos dois times da partida.
- **D-06:** Contagem usa membership atual (snapshot atual), sem janela histórica de membership nesta fase.
- **D-07:** Partidas de times arquivados continuam contando para agregados históricos do usuário.
- **D-08:** Se usuário pertencer aos dois times da mesma partida (edge case), a partida conta 1 vez.

### Ranking time filters
- **D-09:** Filtros temporais são `all`, `month`, `week`.
- **D-10:** `week` usa semana ISO (segunda a domingo) ancorada em `America/Sao_Paulo` (UTC-3).
- **D-11:** `month` usa mês calendário ancorado em `America/Sao_Paulo` (UTC-3).
- **D-12:** Filtro de período e filtro de tipo coexistem e são preservados em query params (ex.: `/ranking?type=solo&period=month`).
- **D-13:** Sem partidas no período/categoria exibe empty state explícito mantendo filtros visíveis (sem fallback automático para all-time).

### Dedicated head-to-head route
- **D-14:** Criar rota dedicada `/head-to-head?teamA=x&teamB=y`, complementar à seção H2H em `/times/[id]`.
- **D-15:** Sem query params, página auto-seleciona o primeiro par válido acessível pelo usuário.
- **D-16:** Query params inválidos/não autorizados não derrubam a página: mostrar mensagem de validação e recuperar com fallback válido.
- **D-17:** UI dedicada usa dois seletores explícitos (`Team A` e `Team B`) com prevenção de seleção do mesmo time nos dois lados.
- **D-18:** Alteração de seleção sincroniza imediatamente `teamA`/`teamB` na URL sem full reload, mantendo deep-link compartilhável.

### the agent's Discretion
- Detalhes visuais dos controles (tabs/chips/segmented) preservando linguagem UI existente.
- Texto final das mensagens de validação/empty state em PT-BR.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — objetivo e success criteria da Phase 5
- `.planning/REQUIREMENTS.md` — PROF-01..03 e RANK-05
- `.planning/PROJECT.md` — constraints de produto e princípios ativos
- `.planning/STATE.md` — contexto acumulado e decisões técnicas vigentes

### Prior locked context
- `.planning/phases/01-dynamic-team-management/01-CONTEXT.md` — dual-mode, guardrails de API e times dinâmicos
- `.planning/phases/04-ranking-team-details/04-CONTEXT.md` — contrato de ranking atual, H2H existente e padrões de páginas autenticadas

### Active code contracts
- `src/lib/stats.ts` — `computeTeamStats()` e `computeHeadToHead()` (fonte de verdade de derivação)
- `src/lib/ranking.ts` — agregação/ordenação de ranking atual, ponto de extensão para `period`
- `src/lib/team-details.ts` — contratos e montagem atual de H2H por rival
- `src/lib/teams.ts` — memberships e listagem de times por usuário
- `src/lib/types.ts` — contratos de tipos compartilhados e shape atual de `ProfileResponse`

### UI/API surfaces to evolve
- `src/app/(authenticated)/profile/page.tsx` — rota autenticada de perfil (migrar para assembler server-side)
- `src/components/profile/profile-page.tsx` — UI atual com fetch client e TODO de hardcode
- `src/app/api/profile/route.ts` — manter escopo de edição de perfil
- `src/app/(authenticated)/ranking/page.tsx` — parsing atual de query params (estender para `period`)
- `src/components/ranking/type-tabs.tsx` — padrão atual de filtros por query
- `src/components/ranking/ranking-view.tsx` — empty state e composição de filtros/standings
- `src/components/teams/h2h-section.tsx` — baseline UX de H2H existente
- `src/app/(authenticated)/times/[id]/page.tsx` — integração com detalhe de times e H2H atual

### Rules and guardrails
- `AGENTS.md` — constraints operacionais (dual-mode, statuses protegidos, sem agregados persistidos)
- `.claude/rules/api-patterns.md` — padrões de resposta/erros de API
- `.claude/rules/testing.md` — estratégia de testes para data layer e rotas
- `.claude/rules/ui-components.md` — composição UI e tokens

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/stats.ts`: funções puras já prontas para agregação de perfil e H2H dedicado.
- `src/lib/ranking.ts`: pipeline de ranking existente com filtros por tipo e ordenação estável.
- `src/lib/team-details.ts`: resumo H2H e lógica de rival primário reaproveitáveis na rota dedicada.
- `src/components/ranking/type-tabs.tsx`: padrão atual de filtros navegáveis por query string.
- `src/components/primitives/stat-tile.tsx`: bloco visual reutilizável para métricas de perfil.

### Established Patterns
- Auth/DB guard em rotas protegidas: `hasDatabaseUrl` + `getAuthenticatedUser` antes de query.
- Páginas autenticadas em App Router com server components por padrão.
- Erros e validações em PT-BR; tipos compartilhados centralizados em `src/lib/types.ts`.

### Integration Points
- Novo módulo de domínio para agregação de perfil (`src/lib/profile-stats.ts`).
- Evolução da página `/profile` para consumo server-side do assembler.
- Extensão do ranking para `period` mantendo coexistência com `type` em query params.
- Nova rota autenticada `/head-to-head` com sincronização de query params e fallback robusto.

</code_context>

<specifics>
## Specific Ideas

- Priorizar leitura rápida no perfil: primeiro métricas globais, depois breakdown por time.
- Semântica temporal deve refletir calendário BR (`America/Sao_Paulo`) para evitar discrepâncias de borda.
- Rota H2H dedicada deve ser plenamente compartilhável via URL em qualquer estado válido.

</specifics>

<deferred>
## Deferred Ideas

- Filtro de intervalo customizado (`from`/`to`) no ranking.
- Timezone por usuário/perfil.
- Analytics avançado por jogador com histórico cronológico completo e drill-down.

</deferred>

---

*Phase: 05-user-profiles-advanced-features*
*Context gathered: 2026-03-26*
