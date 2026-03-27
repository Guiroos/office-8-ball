# Phase 7: Team Details Access & Member Actions - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 7 reforca a protecao de acesso da pagina `/times/[id]` para que apenas membros atuais do time vejam os detalhes, e conecta as acoes de gerenciamento de membros da UI aos endpoints ja existentes de adicionar/remover membros.

Esta fase nao amplia o escopo funcional da pagina de detalhe. Roster, stats, historico recente e H2H ja fazem parte da experiencia; o trabalho aqui e fechar autorizacao, UX previsivel para acesso negado e wiring runtime de convite/remocao de membros.

</domain>

<decisions>
## Implementation Decisions

### Access control behavior
- **D-01:** A pagina `/times/[id]` deve exibir um estado explicito de acesso negado quando um usuario autenticado, mas nao membro, tentar abrir o detalhe do time por URL direta.
- **D-02:** O estado de acesso negado deve ser previsivel e orientar retorno para `/times`, em vez de redirecionar silenciosamente ou mascarar o caso como 404 na UI.
- **D-03:** A protecao deve seguir o contrato membership-first ja existente na API: validar membership antes de devolver payload de detalhe do time.

### Invite flow
- **D-04:** O CTA `Convidar Membro` em `/times/[id]` deve abrir um dialog simples baseado em username.
- **D-05:** O fluxo de convite usa lookup por username via `GET /api/users?username=...` para validar o alvo antes de chamar `POST /api/teams/:id/members`.
- **D-06:** O convite permanece dentro da propria pagina de detalhe do time; nao vira tela separada nem fluxo de gerenciamento mais amplo nesta fase.

### Member removal UX
- **D-07:** A lista de membros deve expor acao inline de `Remover` para membros removiveis.
- **D-08:** A remocao exige confirmacao antes do `DELETE /api/teams/:id/members/:userId`.
- **D-09:** As restricoes de dominio da Phase 1 permanecem ativas sem reinterpretacao de UX: qualquer membro atual pode remover outros membros, o criador nao pode ser removido e times `duo` nao podem cair abaixo de 2 membros.

### Runtime update feedback
- **D-10:** Acoes de adicionar/remover membro devem usar feedback por toast e atualizar o estado atual da pagina de detalhe no proprio lugar.
- **D-11:** O comportamento preferido e refresh da pagina atual/estado server-side apos sucesso, nao redirect completo e nao optimistic UI agressivo.

### the agent's Discretion
- Copy final em PT-BR para estado de acesso negado, validacao do dialog e confirmacao de remocao.
- Escolha exata entre `IconCallout`, `RouteStateScreen` ou composicao equivalente para o estado de acesso negado, desde que o resultado seja explicito e consistente com o shell atual.
- Detalhes visuais do dialog e da acao inline de remocao, preservando a linguagem de componentes existente.

</decisions>

<specifics>
## Specific Ideas

- Estado de acesso negado deve ser explicito, nao esconder o motivo na UI.
- Convite deve ser simples: informar `@username`/username, validar e adicionar sem sair da pagina.
- Remocao deve acontecer direto na lista de membros, mas sempre com confirmacao.
- Sucesso/erro de member actions deve seguir o padrao de toast + refresh ja usado em fluxos client-side do app.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and locked decisions
- `.planning/ROADMAP.md` — Goal e success criteria da Phase 7, especialmente member-only access, runtime member actions e cobertura E2E de acesso negado.
- `.planning/REQUIREMENTS.md` — `TEAM-02` como requirement atendido por esta fase.
- `.planning/PROJECT.md` — constraints ativos: dual-mode, sem mudanca de schema, sem novos agregados persistidos.
- `.planning/STATE.md` — contexto acumulado e decisoes tecnicas vigentes para paginas autenticadas e data derivation.

### Prior context to carry forward
- `.planning/phases/01-dynamic-team-management/01-CONTEXT.md` — D-06..D-12 sobre permissoes de membros, creator guard, minimo de membros e guardrails dual-mode.
- `.planning/phases/04-ranking-team-details/04-CONTEXT.md` — D-06..D-10 sobre estrutura de `/times/[id]`, CTA `Convidar Membro`, roster, historico recente e H2H.
- `.planning/phases/05-user-profiles-advanced-features/05-CONTEXT.md` — padrao recente de paginas autenticadas server-first e mensagens PT-BR consistentes.

### Active authorization and member API contracts
- `src/app/api/teams/[id]/route.ts` — contrato atual de membership-first guard com `403` para nao membros.
- `src/app/api/teams/[id]/members/route.ts` — contrato de `POST` para adicionar membro, validacao e mensagens de erro.
- `src/app/api/teams/[id]/members/[userId]/route.ts` — contrato de `DELETE` para remocao de membro.
- `src/app/api/users/route.ts` — lookup autenticado por username para suportar o dialog de convite.
- `src/lib/teams.ts` — `isTeamMember`, `findUserByUsername`, `addTeamMember`, `removeTeamMember` e regras de dominio aplicadas no runtime.

### Team detail page surfaces
- `src/app/(authenticated)/times/[id]/page.tsx` — pagina RSC atual do detalhe de time; ponto de entrada do gate de acesso.
- `src/lib/team-details.ts` — assembler atual do payload de detalhe; precisa respeitar o boundary member-only antes de expor dados.
- `src/components/teams/team-detail-view.tsx` — view atual com CTA stubado de convite.
- `src/components/teams/member-list.tsx` — superficie atual do roster; ponto natural para inline remove action.
- `src/components/teams/h2h-section.tsx` — componente client existente na mesma pagina; referencia de split RSC/client.

### UI and testing guardrails
- `src/components/primitives/icon-callout.tsx` — padrao leve de estado informativo ja usado em rotas autenticadas.
- `src/components/route-state-screen.tsx` — alternativa mais estruturada para estados de erro/acesso, se o planner optar por tela dedicada.
- `src/components/teams/team-create-form.tsx` — padrao client de fetch + toast + `router.refresh()` reutilizavel para member actions.
- `.claude/rules/api-patterns.md` — statuses e shape de resposta de API protegida.
- `.claude/rules/testing.md` — estrategia obrigatoria para mocks de auth e testes de rotas/data layer.
- `.claude/rules/ui-components.md` — composicao de UI e reutilizacao de primitives/shadcn.
- `AGENTS.md` — constraints operacionais do repo, inclusive dual-mode, `/dashboard` preservado e proibicoes de schema/package.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/api/users/route.ts`: lookup autenticado por username pronto para sustentar o dialog de convite sem criar nova API.
- `src/lib/teams.ts`: funcoes de dominio e regras de permissao/remocao ja existem; a fase precisa principalmente conectar UI e reforcar gating de leitura.
- `src/components/teams/team-detail-view.tsx`: layout principal de detalhe ja existe com CTA de convite e secoes de roster/historico/H2H.
- `src/components/teams/member-list.tsx`: lista atual do roster e o lugar mais natural para expor acao inline de remocao.
- `src/components/route-state-screen.tsx` e `src/components/primitives/icon-callout.tsx`: componentes existentes para representar acesso negado de forma clara.
- `src/components/teams/team-create-form.tsx`: referencia direta para submit client-side com toast, `router.push`/`router.refresh` e mensagens PT-BR.

### Established Patterns
- API protegida usa `hasDatabaseUrl()` + `getAuthenticatedUser()` e membership-first guard antes de expor recursos sensiveis.
- Paginas autenticadas novas tendem a ser server-first, com comportamento client limitado aos controles interativos necessarios.
- Erros e validacoes sao comunicados em PT-BR; sucesso/fracasso de acoes client-side usa `sonner` toast.
- O codigo ja separa assembler server (`src/lib/team-details.ts`) de componentes client pontuais (`h2h-section.tsx`), o que favorece adicionar um manage-members client island sem mover a pagina inteira para client.

### Integration Points
- `src/app/(authenticated)/times/[id]/page.tsx`: decidir e implementar o estado de acesso negado para nao membros.
- `src/lib/team-details.ts`: reforcar membership/authorization antes de montar e devolver payload de detalhe.
- `src/components/teams/team-detail-view.tsx` e/ou novo componente dedicado de member actions: adicionar dialog de convite, confirmacao de remocao e refresh da tela.
- `src/components/teams/member-list.tsx`: evoluir de lista passiva para roster com acao inline de remocao quando permitido.
- `e2e/`: adicionar cenarios cobrindo `manage team members` e `team details authorization`.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-team-details-access-member-actions*
*Context gathered: 2026-03-26*
