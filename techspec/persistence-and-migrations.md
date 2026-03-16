# Tech Spec - Persistence And Migrations

## Objetivo

Documentar como persistencia, schema, seed e fallback em memoria se relacionam no v1.

## Modelo atual

- Com `DATABASE_URL`, partidas e usuarios usam Prisma + Postgres
- Com `DATABASE_URL`, o rate limit de auth tambem usa Prisma + Postgres
- Sem `DATABASE_URL`, apenas as partidas usam fallback em memoria
- Auth nao possui fallback em memoria

## Fonte de verdade

- Os ids de time validos continuam definidos em `src/lib/constants.ts`
- O banco espelha os times, mas nao substitui a definicao em codigo
- O placar continua sendo derivado de `matches`, nunca salvo como contador agregado

## Responsabilidades por camada

### `prisma/schema.prisma`

- define as tabelas `teams`, `matches`, `users` e `auth_rate_limits`
- preserva relacao entre `Match.winnerTeamId` e `Team.id`
- persiste o estado agregado do rate limit de auth por chave `action + email + ip`

### `prisma/seed.mjs`

- garante seed explicito dos dois times fixos
- deve continuar alinhado com as definicoes em codigo

### `src/lib/data.ts`

- seleciona entre Prisma e memoria conforme ambiente
- faz `ensureSeedData()` quando usa banco
- agrega placar a partir do historico
- normaliza `note` antes de persistir

## Regras para evolucao

- Nao transformar `teams` do banco em fonte unica de verdade no v1
- Nao introduzir counters persistidos de placar
- Nao quebrar o fallback em memoria sem mudanca de produto aprovada
- Qualquer mudanca em ids ou shape de time exige revisar codigo, schema e seed juntos

## Mudancas de schema e migration

- Mudancas em `prisma/schema.prisma` devem manter compatibilidade com o fluxo atual de `/login` e `/scoreboard`, salvo mudanca explicita de produto
- Se o schema mudar, revisar tambem `prisma/seed.mjs` e as regras em `src/lib/data.ts`
- Migrations devem preservar o modelo de dois times fixos, a relacao de `matches` com `teams` e a persistencia de `users`
- Migrations de auth devem preservar tambem a tabela `auth_rate_limits` e sua compatibilidade com login/signup

## Validacao recomendada

- validar o modo sem `DATABASE_URL` quando a regra afetar placar
- validar o modo com Prisma quando a regra afetar schema, seed ou auth
- nao assumir que teste local em memoria cobre efeitos reais de migration
