# Phase 1: Dynamic Team Management - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create teams (solo ou duo), gerenciar membros dos times, e as rotas de API funcionam em dual-mode (com e sem DATABASE_URL). Fase 1 entrega a camada de dados de times completa — sem UI de times; sem scoreboard; sem ranking.

A maior parte da infra de times (rotas CRUD, funções de domínio) já foi implementada no PR #67 (feature/dynamic-teams, mergeado). O trabalho restante é: suporte a tipo solo, gerenciamento de membros pós-criação, e in-memory fallback para as rotas de times.

</domain>

<decisions>
## Implementation Decisions

### Tipo de time (solo vs duo)

- **D-01:** Campo `type: 'solo' | 'duo'` adicionado ao modelo `Team` no schema Prisma. Campo é obrigatório e fixo na criação — não muda depois.
- **D-02:** Times `solo` têm apenas 1 membro (o criador). `POST /api/teams` com `type: 'solo'` não exige `secondMemberUserId`.
- **D-03:** Times `duo` têm exatamente 2 membros: criador + 1 membro adicional. Comportamento atual mantido para duo.
- **D-04:** `TeamRecord` em `src/lib/types.ts` recebe campo `type: 'solo' | 'duo'`. `normalizeTeam()` em `teams.ts` expõe o campo.
- **D-05:** Mudança de schema requer migration + seed atualizados juntos. Aprovado explicitamente nesta fase.

### Gerenciamento de membros pós-criação

- **D-06:** Qualquer membro do time pode adicionar ou remover outros membros (não apenas o criador).
- **D-07:** Adicionar membro: `POST /api/teams/:id/members` com body `{ userId: string }`. Valida que usuário existe e ainda não é membro.
- **D-08:** Remover membro: `DELETE /api/teams/:id/members/:userId`. Não permite remover o criador do time (`createdBy`).
- **D-09:** Mínimo de membros: time `solo` pode ficar com 1 membro; time `duo` precisa ter ao menos 2 — aplicado no DELETE.

### In-memory fallback para rotas de times

- **D-10:** Sem `DATABASE_URL`, `GET /api/teams` retorna `{ teams: [] }` (lista vazia) com status 200. Consistente com como `data.ts` trata matches.
- **D-11:** Sem `DATABASE_URL`, `POST /api/teams` retorna 503 (`getAuthUnavailableResponse()`). Criação requer banco.
- **D-12:** Sem `DATABASE_URL`, `GET /api/teams/:id` e rotas de membros retornam 503. Somente leitura simples (lista) tem fallback vazio.

### Claude's Discretion

- Enum Prisma vs string com `@db.Text` para o campo `type` — Claude decide baseado no padrão existente (TeamStatus usa enum; preferir consistência).
- Ordem dos campos na migration gerada.
- Mensagens de erro em português para as novas rotas de membros.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema e tipos
- `prisma/schema.prisma` — Modelo `Team` atual (sem campo `type`), `TeamStatus` enum, `TeamMember`
- `src/lib/types.ts` — `TeamRecord`, `TeamMemberRecord`, tipos de resposta de API
- `src/lib/teams.ts` — Funções de domínio existentes: `createTeam`, `listUserTeams`, `getTeamById`, `isTeamMember`, `archiveTeam`

### Rotas existentes (referência de padrão)
- `src/app/api/teams/route.ts` — `GET /api/teams`, `POST /api/teams` (padrão de validação Zod, dual-mode guard)
- `src/app/api/teams/[id]/route.ts` — `GET /api/teams/:id` (padrão de membership-first guard)
- `src/app/api/teams/[id]/archive/route.ts` — `PATCH /api/teams/:id/archive` (padrão de idempotência)

### Padrões de projeto
- `src/lib/data.ts` — Como in-memory fallback funciona para matches (`if (!hasDatabaseUrl()) return []`)
- `src/lib/auth.ts` — `hasDatabaseUrl()`, `getAuthUnavailableResponse()`, `getAuthRequiredResponse()`
- `.claude/rules/architecture.md` — Constraint: in-memory mode não pode ser quebrado
- `.claude/rules/safe-change.md` — Checklist de mudanças seguras

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isTeamMember(teamId, userId)` em `teams.ts` — reutilizável como guard nas novas rotas de membros
- `findUserById(userId)` em `teams.ts` — reutilizável para validar usuário antes de adicionar como membro
- `getAuthenticatedUser()` / `hasDatabaseUrl()` / `getAuthRequiredResponse()` em `auth.ts` — padrão de auth guard já estabelecido
- Zod + `safeParse()` — padrão de validação de payload já em uso nas rotas existentes

### Established Patterns
- Auth guard: `if (!hasDatabaseUrl()) return getAuthUnavailableResponse()` primeiro, depois `getAuthenticatedUser()`
- Membership guard: verificar `isTeamMember` ANTES de buscar o time (previne enumeration attack) — padrão estabelecido no `GET /api/teams/:id`
- Unique constraint: capturar `P2002` do Prisma e retornar 400 com mensagem amigável
- Todas as respostas tipadas com `NextResponse.json<T>()` usando tipos de `src/lib/types.ts`

### Integration Points
- `prisma/schema.prisma` — precisa de campo `type` no modelo `Team` + nova migration
- `src/lib/teams.ts` — `createTeam()` precisa aceitar `type` e tornar `secondMemberUserId` opcional; adicionar `addTeamMember()` e `removeTeamMember()`
- `src/lib/types.ts` — `TeamRecord` precisa de `type: 'solo' | 'duo'`
- `src/app/api/teams/route.ts` — `POST` schema Zod precisa aceitar `type` e validação condicional de `secondMemberUserId`
- Novas rotas: `src/app/api/teams/[id]/members/route.ts` (POST) e `src/app/api/teams/[id]/members/[userId]/route.ts` (DELETE)

</code_context>

<specifics>
## Specific Ideas

- In-memory fallback para `GET /api/teams` deve retornar `{ teams: [] }` — mesmo padrão que `listMatches()` em `data.ts` já faz para matches sem DATABASE_URL.
- Membro não pode ser removido se for o `createdBy` do time — proteção mínima contra times órfãos.

</specifics>

<deferred>
## Deferred Ideas

- UI para criar/gerenciar times — fora do escopo da Fase 1 (Fase 2 tem UI hint)
- Limite máximo de membros por time — não discutido; deixar em aberto para Fase 4
- Transferência de propriedade (createdBy) — complexidade desnecessária para v1

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-dynamic-team-management*
*Context gathered: 2026-03-24*
