# Phase 4: Ranking & Team Details - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Ranking page com standings ao vivo (todos os times ordenados por vitórias, exibindo W/L, win rate %, streak e total de partidas) + página de detalhe por time (stats, roster, histórico recente e comparação H2H). Nenhum hardcode de times — tudo via APIs dinâmicas.

Não inclui: time-based filters (Phase 5), user profiles (Phase 5), rota H2H dedicada (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Ranking — Layout e apresentação

- **D-01:** Layout: podium top 3 no topo (1º centro destacado, 2º esquerda, 3º direita com medalhas/troféu), seguido de lista compacta para #4+. Referência visual: Stitch screen "Rankings & Leaderboards" (projeto 8575820399758307798).
- **D-02:** Filtro por tipo de time: tabs "Solo" | "Duplas" (filtra por `team.type`). Sem filtro temporal nesta fase.
- **D-03:** Ordenação: por vitórias (W) decrescente. Empate desempata por win rate %.
- **D-04:** Stats exibidos por time (tanto no podium quanto na lista): Vitórias + Derrotas + Win Rate % + Streak atual.

### Times — Estrutura de páginas

- **D-05:** `/times` tem duas abas: "Meus Times" (lista dos times do usuário) e "Criar Novo Time".
- **D-06:** Clicar em um time navega para `/times/[id]` — rota dedicada de detalhe.
- **D-07:** `/times/[id]` exibe: card com avatar/iniciais + nome + botão "Convidar Membro", stats do time (Total Wins, Win Rate %, Posição no ranking), lista de membros com nome + role, histórico das últimas 3 partidas com botão "Ver histórico completo". Referência visual: Stitch screen "Gestão de Times" (projeto 8575820399758307798).
- **D-08:** Sidebar direita de `/times` (quando sem time selecionado): CTA "Criar Novo Time".

### H2H — Comparação entre times

- **D-09:** Seção H2H na página `/times/[id]`: seletor de adversário (dropdown com todos os outros times do usuário), pré-carregado com o principal rival (time com mais confrontos diretos com o time atual).
- **D-10:** Dados H2H exibidos: W/L entre os dois times + win rate do time atual nos confrontos + data da última partida entre eles.

### Data fetching

- **D-11:** Páginas de ranking e detalhe de time implementadas como Server Components (RSC). Dados buscados server-side via funções do domínio (`computeTeamStats`, `computeHeadToHead`).
- **D-12:** Cache revalidado via `revalidatePath('/ranking')` e `revalidatePath('/times')` após criação de nova partida em `POST /api/matches`. Atende SC-2 (atualização em < 1 segundo).

### Claude's Discretion

- Design exato dos avatars/iniciais do time (cor gerada por hash do nome ou aleatória).
- Número de partidas no "histórico completo" — paginar ou scroll.
- Loading/skeleton states das páginas RSC.
- Mensagens de estado vazio (sem times, sem partidas).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos e roadmap
- `.planning/ROADMAP.md` — Phase 4 success criteria (SC-1 a SC-6), requirements TEAM-02, RANK-01..04
- `.planning/REQUIREMENTS.md` — RANK-01..04, TEAM-02 detalhados

### Stats e domínio
- `src/lib/stats.ts` — `computeTeamStats()`, `computeHeadToHead()`, tipos `TeamStats`, `HeadToHeadStats` — USAR diretamente, não reimplementar
- `src/lib/types.ts` — `TeamRecord`, `MatchRecord`, tipos de resposta de API existentes
- `src/lib/teams.ts` — `listUserTeams()`, `getTeamById()`, `isTeamMember()`
- `src/lib/data.ts` — `listMatches()`, in-memory fallback pattern

### UI e padrões visuais
- `src/components/primitives/stat-tile.tsx` — Reutilizar para exibir stats no ranking e detalhe
- `src/components/primitives/section-header.tsx` — Reutilizar para cabeçalhos de seção
- `src/components/dashboard/dashboard-hero.tsx` — Referência de uso de Card + StatTile + layout grid
- `.planning/codebase/CONVENTIONS.md` — Padrões de componente, CVA, tokens de design
- `.claude/rules/ui-components.md` — Regras de hierarquia de componentes e styling

### Rotas e arquitetura
- `src/app/(authenticated)/ranking/page.tsx` — Placeholder atual a ser substituído
- `src/app/(authenticated)/times/page.tsx` — Placeholder atual a ser substituído
- `src/app/api/matches/route.ts` — Onde adicionar `revalidatePath` após POST
- `.claude/rules/architecture.md` — Constraints: in-memory fallback obrigatório, sem hardcode de times
- `.claude/rules/safe-change.md` — Checklist de mudanças seguras

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeTeamStats(teamId, allMatches)` em `stats.ts` — retorna `{ wins, losses, winRate, currentStreak, longestStreak, totalMatches }`. Pronto para usar no ranking e detalhe.
- `computeHeadToHead(teamAId, teamBId, allMatches)` em `stats.ts` — retorna `{ teamAWins, teamBWins, totalMatches, recentMatchIds }`. Base para a seção H2H.
- `StatTile` em `src/components/primitives/stat-tile.tsx` — tile de métrica com label + value + description. Usar para W, L, WR%, Streak.
- `SectionHeader` em `src/components/primitives/section-header.tsx` — eyebrow + title + description. Usar para cabeçalhos.
- `Card`, `CardContent` de `src/components/ui/card.tsx` — padrão visual já estabelecido no dashboard.
- `Badge` de `src/components/ui/` — disponível para indicadores de streak, posição, tipo de time.

### Established Patterns
- Auth guard: `if (!hasDatabaseUrl()) return getAuthUnavailableResponse()` em todas as rotas — qualquer nova rota de API segue o mesmo padrão.
- RSC pages: `src/app/(authenticated)/dashboard/page.tsx` — referência de página autenticada existente.
- Client hooks: `use-dashboard-data.ts` — padrão de hook para uso futuro se necessário (nesta fase não é usado para ranking/times, que são RSC).
- Semantic tokens only: `shadow-sm shadow-gold/35`, `bg-surface-emphasis`, `text-muted-foreground` — nenhum valor arbitrário.

### Integration Points
- `src/app/(authenticated)/ranking/page.tsx` — substituir placeholder por RSC que busca e renderiza standings
- `src/app/(authenticated)/times/page.tsx` — substituir placeholder por RSC com tabs "Meus Times" / "Criar Novo Time"
- `src/app/(authenticated)/times/[id]/page.tsx` — nova rota a criar
- `src/app/api/matches/route.ts` — adicionar `revalidatePath('/ranking')` e `revalidatePath('/times')` no handler POST
- `src/lib/teams.ts` — pode precisar de nova função para buscar todos os times de todos os usuários (para o ranking global)

</code_context>

<specifics>
## Specific Ideas

- Ranking: podium top 3 inspirado no Stitch screen "Rankings & Leaderboards" (projeto 8575820399758307798) — 1º centro com destaque maior, 2º/3º menores nas laterais.
- Times: layout de detalhe inspirado no Stitch screen "Gestão de Times" (projeto 8575820399758307798) — card do time à esquerda, histórico recente à direita, aba "Criar Novo Time" no topo.
- H2H: seletor dropdown pré-carregado com o rival principal (top adversary por número de confrontos diretos). Exibe W/L + win rate + data da última partida.

</specifics>

<deferred>
## Deferred Ideas

- Filtros por período (esta semana / este mês / geral) no ranking — Phase 5 (RANK-05)
- Rota H2H dedicada `/head-to-head?teamA=x&teamB=y` — Phase 5
- Histórico cronológico completo com paginação avançada — Phase 5

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-ranking-team-details*
*Context gathered: 2026-03-25*
