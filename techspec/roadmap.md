# Tech Spec - Roadmap Tecnico

## Objetivo

Organizar os proximos passos tecnicos do projeto sem misturar backlog futuro com itens que ja fazem parte do estado atual do codigo.

## Snapshot do estado atual

- Prisma ja foi adotado
- A UI principal ja usa `Tailwind CSS` com primitives locais no estilo `shadcn/ui`
- `better-auth` por credenciais ja protege a shell autenticada em `/dashboard`, `/times`, `/ranking`, `/profile`, `/settings` e as APIs do placar
- O cadastro inicial de usuarios ja existe via Postgres
- A pagina de perfil ja existe com edicao de `displayName`, `email`, `avatarUrl` e `bio`; avatar exibe identicon via Gravatar como fallback
- Login migrou de email para username como identificador principal; email e opcional no cadastro
- O campo `note` ja e exposto na UI tanto na criacao de partida quanto no historico
- O dominio continua fixo em dois times globais

## Proximos passos priorizados

### 1. Fechar gaps de qualidade

Prioridade: alta

- Priorizar testes integrados com Prisma real para auth e scoreboard
- Confirmar no backend qualquer regra de permissao futura; nao depender apenas da UI

Nota:
- a base operacional de repositorio, CI, CodeQL, Dependabot e review de dependencias agora esta documentada em `github-operations.md`
- os proximos passos aqui ficam restritos a gaps ainda nao implementados no codigo ou na configuracao

### 2. Rate limit na API de matches

Prioridade: alta

- A rota `POST /api/matches` nao tem protecao contra spam — multiplos registros podem ser enviados rapidamente
- O modelo `AuthRateLimit` e o padrao de rate limit ja existem no projeto e podem ser reaproveitados
- Implementar por IP ou por usuario autenticado, alinhado com o padrao do auth

### 3. Cobertura E2E minima

Prioridade: media

- Expandir a cobertura E2E alem do fluxo principal ja implementado em login, shell autenticada e dashboard
- Priorizar cenarios ainda nao cobertos, como rate limit de auth e variantes negativas mais profundas
- Endurecer as assercoes de placar para garantir que cada registro de vitoria representa exatamente uma nova partida
- Avaliar execucao de E2E em servidor mais proximo de producao com `next build` + `next start`
- Avaliar `SonarQube Cloud` para code smells e quality gate de maintainability
- Manter contratos de API e fluxo da UI sincronizados em qualquer evolucao

### 4. Exclusao ou desfazer de partida

Prioridade: media

- Nao existe forma de remover um registro incorreto; uma vez registrada, a partida e permanente
- Opcao recomendada: soft delete com janela curta de tempo (ex: 30 segundos com botao "desfazer")
- Nao abrir CRUD completo de partidas — apenas reverter o ultimo registro do usuario autenticado
- Requer nova rota de API e verificacao de ownership da partida no backend

### 5. ~~Adocao de times~~ — implementado

Times sao totalmente dinamicos e criados pelos usuarios. Cada usuario pode criar times solo ou duo, gerenciar membros e visualizar estatisticas em `/times` e `/times/[id]`. O modelo de memberships substitui a associacao fixa de usuario a time.

### 6. Troca de senha

Prioridade: baixa

- Funcionalidade natural para o `/settings`, que hoje e placeholder
- Nao requer mudanca de schema — apenas nova rota de API com validacao de senha atual e hash da nova
- Pode ser implementado de forma independente antes do `/settings` estar totalmente funcional

### 7. Paginacao no historico de partidas

Prioridade: baixa

- `getScoreboard()` busca todas as partidas sem limite — com o tempo o volume cresce
- Introducir paginacao ou limite com "ver mais" no `RecentMatchesCard` seria preventivo
- O calculo do placar deve continuar derivado de todas as partidas; apenas a exibicao e paginada

### 8. ~~Pagina /times funcional~~ — implementado

`/times` exibe times do usuario com filtro por parceiro, estatisticas de cada time e criacao de novos times. `/times/[id]` mostra detalhe com historico e head-to-head.

### 9. Paginas /ranking e /settings funcionais

Prioridade: futura

- `/ranking`: implementado com ranking dinamico por periodo e tipo; filtros de evolucao historica sao ainda futuros
- `/settings`: ainda placeholder; troca de senha pode ser implementada de forma independente via item 6

### 10. Expansao de dominio

Prioridade: futura

- So iniciar depois de fechar os gaps operacionais do v1 e apos os itens anteriores
- Escopo potencial:
  - ligas ou workspaces
  - times proprios
  - memberships
  - RBAC simples

## Fora de escopo no curto prazo

- Generalizacao imediata para multi-team
- Painel admin
- Caching layer
- Bibliotecas extras de state management
- Contadores persistidos para o placar

## Regra de uso

Este roadmap tecnico deve refletir apenas trabalho futuro ou gaps em aberto. O que ja foi implementado deve migrar para os techspecs de estado atual, nao permanecer aqui como checklist semantico de execucao passada.
