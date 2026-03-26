---
phase: 4
reviewers: [codex]
reviewed_at: 2026-03-25T00:00:00Z
plans_reviewed: [04-01-PLAN.md, 04-02-PLAN.md, 04-03-PLAN.md]
---

# Cross-AI Plan Review — Phase 4

## Codex Review

### Plan 04-01: Data Foundation

**Summary**

Boa base para destravar o ranking global. O plano encaixa com a necessidade real de separar leitura global de times da leitura atual filtrada por usuário em `src/lib/data.ts:28`, mas ainda está incompleto em invalidation, semântica de filtro por tipo e cobertura de testes.

**Strengths**

- Separa corretamente o domínio de ranking em `src/lib/ranking.ts`, sem distorcer `listMatches()` atual.
- Reaproveita `computeTeamStats()` em vez de duplicar regra de vitórias/derrotas em outro lugar.
- Mantém o fallback `[]` sem banco, coerente com o padrão atual do projeto.
- A ordenação `wins desc` + `winRate desc` bate com D-03.
- `RankedTeam = TeamRecord + TeamStats + rank` é um shape prático para a UI.

**Concerns**

- `HIGH`: `revalidatePath('/times')` não garante atualização de rotas `/times/[id]`; o plano pode resolver só parte da invalidação.
- `MEDIUM`: `computeTeamStats()` filtra o array inteiro de partidas para cada time, virando custo `O(times * matches)`.
- `MEDIUM`: o filtro por `team.type` não define se estatísticas devem incluir partidas contra times de outro tipo. O `POST /api/matches` também não impede `solo` vs `duo`, então a semântica do ranking fica ambígua.
- `LOW`: os testes listados parecem faltar exclusão de times arquivados, times sem partidas, empate total de critérios e verificação explícita das chamadas de revalidação.
- `LOW`: retornar `[]` sem `DATABASE_URL` ajuda o domínio, mas não torna a feature realmente usável em modo in-memory.

**Suggestions**

- Revalidar também os detalhes afetados, por exemplo `/times/[id]` dos dois times da partida, ou migrar para `revalidateTag`.
- Agrupar partidas por `teamId` antes de chamar `computeTeamStats()` para evitar re-scan completo por time.
- Definir explicitamente a regra para partidas entre tipos diferentes.
- Adicionar testes para arquivados, zero matches, empate de ordenação e side effect de revalidation.

**Risk Assessment**

`MEDIUM` — o núcleo está correto, mas há risco real de cache stale e de comportamento ambíguo no filtro por tipo.

---

### Plan 04-02: Ranking Page

**Summary**

A decomposição de UI está boa e segue as decisões de produto. O plano deve entregar a tela principal com baixo risco técnico, mas está leve demais em acessibilidade, estados de erro e testes de integração do fluxo RSC + query param.

**Strengths**

- Mantém `/ranking` como Server Component, alinhado com D-11.
- Separa bem responsabilidade entre `RankingView`, `PodiumCard`, `StandingsRow` e `TypeTabs`.
- O split `top 3` vs `4+` implementa D-01 de forma direta.
- O link para `/times/[id]` cobre D-06.
- O empty state está previsto.

**Concerns**

- `MEDIUM`: não há plano de teste para ordem visual do pódio `2 | 1 | 3`, troca de aba por query param, empty state e links.
- `MEDIUM`: falta definir um terceiro critério de ordenação quando `wins` e `winRate` empatam; sem isso o pódio pode oscilar.
- `MEDIUM`: o plano não fala de estado auth-unavailable/in-memory, só de lista vazia.
- `LOW`: `TypeTabs` pode virar um controle visual sem semântica de tabs ou navegação acessível por teclado.
- `LOW`: em Next App Router recente, `searchParams` em páginas RSC costuma exigir cuidado de tipagem/assinatura; o plano não menciona isso.

**Suggestions**

- Adicionar testes de página para `?type=solo|duo`, ordem do pódio e linkagem para detalhes.
- Definir desempate estável adicional, como `name asc`.
- Preferir tabs baseadas em links/query string com semântica acessível clara.
- Definir copy distinta para "sem dados" vs "indisponível sem banco".

**Risk Assessment**

`LOW-MEDIUM` — a UI em si é simples; o maior risco é faltar acabamento comportamental e testes.

---

### Plan 04-03: Teams Pages

**Summary**

É o plano mais arriscado. Ele tenta fechar bastante UI, mas subestima o trabalho de domínio, autorização e shape de dados. Do jeito descrito, há boa chance de entregar uma tela bonita porém incompleta ou incoerente com os requisitos.

**Strengths**

- Introduz a rota dedicada `/times/[id]`, necessária para a fase.
- Mantém a composição principal em RSC, coerente com D-11.
- Inclui H2H, recentes e roster, que são os blocos certos de produto.
- Já pensa em "primary rival", o que cobre D-09.

**Concerns**

- `HIGH`: há conflito com a política atual de acesso. Hoje leitura de time por id exige membership em `src/app/api/teams/[id]/route.ts:23`. Se o ranking global linkar para `/times/[id]`, muitos usuários podem cair em 403. O plano não resolve isso.
- `HIGH`: `computeHeadToHead()` não fornece a data da última partida exigida por D-10. O plano não fecha o requisito como escrito.
- `HIGH`: passar `allMatches` para um componente client e recalcular H2H no browser é payload desnecessário e enfraquece a escolha por RSC.
- `HIGH`: exibir `userId` truncado não atende "roster" de forma útil. O schema já tem `username` e `displayName`; adiar isso para Phase 5 parece descasado do objetivo desta fase.
- `MEDIUM`: D-05 e D-08 não estão realmente cobertos; há botão em `/times`, mas não a estrutura com abas "Meus Times" / "Criar Novo Time" nem o estado de sidebar/CTA sem seleção.
- `MEDIUM`: D-07 pede posição no ranking no detalhe do time, mas o plano não define de onde isso vem.
- `MEDIUM`: falta tratar times sem partidas, sem rivais, time arquivado e estados de indisponibilidade.
- `MEDIUM`: se houver cache de rota, revalidar só `/times` não basta para manter `/times/[id]` fresco.
- `LOW`: hash de cor do avatar parece scope creep enquanto contratos de dados e acesso ainda estão indefinidos.

**Suggestions**

- Criar antes um helper server-side tipo `getTeamDetailData(teamId, viewerId)` que resolva autorização, membros com nomes, stats, ranking position, recentes e H2H.
- Decidir explicitamente se detalhe de time é público para qualquer usuário autenticado ou restrito a membros.
- Manter H2H no servidor e enviar ao client só a lista de oponentes + summaries.
- Incluir display names/usernames agora, não IDs truncados.
- Separar o plano de `/times` list page do plano de `/times/[id]` detail page se necessário.
- Adicionar testes para rival primário, empty states, 403/404/notFound, ranking position e `lastMatchDate`.

**Risk Assessment**

`HIGH` — é o plano com maior chance de não cumprir os requisitos completos ou de bater de frente com o modelo atual de autorização.

---

**Cross-Plan Note (Codex)**

A sequência `04-01 -> 04-02` está boa. O problema está em `04-03`, que precisa de uma mini "data foundation" própria antes da UI. Sem isso, a implementação tende a inventar contratos no componente e acumular retrabalho.

---

## Consensus Summary

*(Synthesized from Codex review + Claude analysis of the plans)*

### Agreed Strengths

- **Plan 01 data architecture is sound:** separating `listAllTeamsWithStats()` into `src/lib/ranking.ts`, reusing `computeTeamStats()`, and returning `[]` in in-memory mode correctly follows the project's established patterns.
- **Plans 02 and 03 component decomposition is correct:** `PodiumCard`, `StandingsRow`, `TypeTabs`, `RankingView`, `TeamCard`, `TeamDetailView` — the split of responsibility is appropriate and testable.
- **RSC-first approach is right:** keeping ranking and team detail pages as Server Components with data fetched server-side satisfies D-11 and avoids client-side waterfall.
- **TDD approach in Plan 01** is a genuine strength for the data foundation layer.

### Agreed Concerns

These concerns were raised by the reviewer and confirmed by independent analysis:

1. **`revalidatePath('/times')` does not revalidate `/times/[id]`** (HIGH) — Dynamic segments require either `revalidatePath('/times/[id]', 'layout')` or per-path revalidation of affected team IDs, or migrating to `revalidateTag`. The current plan leaves `/times/[id]` stale after match creation.

2. **Authorization gap on `/times/[id]`** (HIGH) — The plan links from the public ranking page to `/times/[id]` but doesn't specify whether this page is member-only or open to any authenticated user. Current API guards (`src/app/api/teams/[id]/route.ts`) require membership. The RSC page must explicitly decide its access policy.

3. **H2H `lastMatchDate` is missing from `computeHeadToHead()`** (HIGH) — D-10 requires the last match date in the H2H section, but `HeadToHeadStats` only provides `recentMatchIds`. Plan 03's workaround (look up the match from `allMatches` by ID) works but is implicit — the plan should make this explicit.

4. **Passing `allMatches` to the H2H client component** (HIGH) — Sending the full match array to the browser just to compute H2H client-side defeats the RSC strategy. H2H should be computed server-side and passed as a pre-computed summary, with the client component only handling the opponent selection and re-fetching via a lightweight API call or server action.

5. **Missing stable tie-break** (MEDIUM) — Plans 01 and 02 define `wins desc` then `winRate desc` but don't specify a third stable tie-break (e.g., `name asc` or `createdAt asc`). Without it, equal teams can swap positions on re-render.

6. **Plan 03 missing edge states** (MEDIUM) — Team with no matches, team with no rivals, archived team accessed by direct URL, and database-unavailable state are all unaddressed.

### Divergent Views

- **Displaying userId vs. username in MemberList:** Codex flags showing truncated `userId` as blocking (argues `username`/`displayName` is already in schema). The plan explicitly defers this to Phase 5. This is a product decision — confirm whether Phase 4 success criteria (SC-3: "team name, roster, W/L stats") requires real names or IDs are acceptable for now.
- **Avatar color hash:** Codex calls it scope creep; the plan treats it as low-cost polish. Acceptable either way, but should not block delivery.

### Priority Actions Before Execution

1. **Fix cache revalidation for `/times/[id]`** — either use `revalidatePath('/times', 'layout')` (revalidates all subtrees), call `revalidatePath` for each affected team's detail path, or adopt `revalidateTag('teams')`.
2. **Decide access policy for `/times/[id]`** — member-only or any authenticated user. Update Plan 03 with explicit auth guard.
3. **Move H2H computation server-side** — Pass `HeadToHeadStats` summaries (one per rival) from RSC to client; client only manages selection state.
4. **Add stable sort tie-break** to `listAllTeamsWithStats()` (Plan 01).
5. **Add `lastMatchDate` derivation** explicitly to the H2H data contract in Plan 03.
