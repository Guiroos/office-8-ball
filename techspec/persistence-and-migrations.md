# Tech Spec - Persistence And Migrations

## Objetivo

Documentar como persistencia, schema, seed e migrations se relacionam no estado atual do projeto.

## Modelo atual

- com `DATABASE_URL`, dominio, auth e rate limit usam Prisma + Postgres
- sem `DATABASE_URL`, o runtime autenticado e as rotas protegidas ficam indisponiveis
- nao existe fallback em memoria para persistencia compartilhada de partidas, usuarios ou auth

## Fonte de verdade

- o banco e a fonte de verdade para times, memberships, partidas e usuarios
- `src/lib/constants.ts` nao define mais IDs fixos de time
- o placar continua sendo derivado de `matches`, nunca salvo como contador agregado

## Responsabilidades por camada

### `prisma/schema.prisma`

- define as tabelas de usuarios, times, membros, partidas e rate limit de auth
- preserva as relacoes entre `Match`, `Team` e `TeamMember`
- sustenta auth por credenciais e o estado persistido de rate limit

### `prisma/seed.mjs`

- cria usuarios UAT
- cria times solo e duo de exemplo
- sincroniza memberships
- insere partidas marcadas com prefixo de seed
- nao existe mais seed de dois times globais fixos

### `src/lib/data.ts`

- le o historico do usuario a partir das memberships
- cria partidas via Prisma
- agrega placar a partir do historico
- normaliza `note` antes de persistir
- retorna vazio/indisponibilidade quando o banco nao esta configurado, sem manter estado em memoria

## Regras para evolucao

- nao introduzir counters persistidos de placar
- nao reintroduzir IDs fixos de time no codigo
- qualquer mudanca estrutural em `Team` ou `TeamMember` exige revisar schema, seed, dominio e rotas relacionadas juntos
- mudancas de schema devem preservar compatibilidade com auth, memberships e leitura derivada do placar

## Mudancas de schema e migration

- mudancas em `prisma/schema.prisma` devem manter compatibilidade com o fluxo autenticado atual e com as rotas legadas que redirecionam para `/times`
- se o schema mudar, revisar tambem `prisma/seed.mjs`, `src/lib/teams.ts`, `src/lib/data.ts` e as rotas afetadas
- migrations devem preservar a relacao entre `matches`, `teams`, `team_members` e `users`
- migrations de auth devem preservar tambem a tabela `auth_rate_limits` e sua compatibilidade com login/signup

## Validacao recomendada

- validar com Prisma real quando a mudanca afetar schema, seed, auth ou memberships
- validar respostas `503`/`500` quando a mudanca mexer em disponibilidade de auth/DB
- nao assumir que testes puros do dominio cobrem efeitos reais de migration
