# Office 8 Ball

Aplicacao interna para acompanhar partidas de sinuca no escritorio com autenticacao, criacao de times dinamicos e ranking por historico de partidas.

O projeto deixou de ser o `v1` de dois times fixos (`Frontend vs Backend`) e hoje opera em outro escopo: usuarios criam times `solo` ou `duo`, gerenciam membros, registram partidas entre times ativos e acompanham ranking, perfil e confronto direto dentro de uma shell autenticada.

## Escopo Atual

- App unico em `Next.js` com `App Router`
- Autenticacao por credenciais com `better-auth`
- Persistencia principal em `Prisma + PostgreSQL`
- Times criados em runtime pelos usuarios; o seed nao cria mais times
- Tipos de time suportados:
  - `solo`
  - `duo`
- Dominio atual inclui:
  - criacao de time
  - listagem dos times do usuario
  - detalhe do time com membros, ultimas partidas e head-to-head por rival
  - convite/adicao e remocao de membros
  - arquivamento de time
  - registro de partidas entre times ativos
  - ranking geral com filtros por tipo e periodo
  - perfil do usuario com estatisticas agregadas
- A area autenticada principal hoje fica em `/dashboard`, `/times`, `/ranking`, `/head-to-head`, `/profile` e `/settings`

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- componentes locais no estilo `shadcn/ui`
- `Prisma`
- `PostgreSQL`
- `better-auth`
- `Zod`
- `Vitest` + Testing Library
- `Playwright`

## Rotas Principais

- `/`
  - redireciona para `/dashboard` ou `/login` conforme a sessao
- `/login`
  - login e cadastro
- `/dashboard`
  - visao principal autenticada com placar e historico recente
- `/times`
  - listagem e criacao de times
- `/times/[id]`
  - detalhe do time, membros, estatisticas e confrontos diretos
- `/ranking`
  - ranking geral com filtros por tipo de time e periodo
- `/head-to-head`
  - comparacao entre dois times acessiveis ao usuario
- `/profile`
  - perfil do usuario e estatisticas derivadas do historico
- `/settings`
  - placeholder para configuracoes futuras
- `/scoreboard`
  - redirect legado para `/dashboard`

## APIs Atuais

Todas as rotas abaixo dependem de `DATABASE_URL`.
Exceto `POST /api/auth/register`, elas tambem exigem sessao valida.

- `GET /api/scoreboard`
  - retorna o placar agregado dos times do usuario autenticado
- `GET /api/matches`
  - lista partidas ligadas aos times do usuario
- `POST /api/matches`
  - cria uma partida com `{ teamAId, teamBId, winnerTeamId, note? }`
- `GET /api/teams`
  - lista os times do usuario; aceita `?includeArchived=true`
- `POST /api/teams`
  - cria um time `solo` ou `duo`
- `GET /api/teams/[id]`
  - retorna detalhes de um time acessivel ao usuario
- `PATCH /api/teams/[id]/archive`
  - arquiva um time
- `POST /api/teams/[id]/members`
  - adiciona membro ao time
- `DELETE /api/teams/[id]/members/[userId]`
  - remove membro do time
- `GET /api/users?username=...`
  - resolve usuario por `username` para fluxos de time
- `GET /api/profile`
  - retorna o perfil do usuario autenticado
- `PUT /api/profile`
  - atualiza `displayName`, `email`, `avatarUrl` e `bio`
- `POST /api/auth/register`
  - cria usuario para login por credenciais

## Regras Importantes

- Login usa `username + password`
- `email` nao e obrigatorio no cadastro inicial
- Times sao criados pelos usuarios em runtime; nao existe seed de times fixos
- Partidas so podem ser registradas entre times ativos
- O usuario precisa pertencer a pelo menos um dos times da partida para registra-la
- O fallback em memoria continua existindo para desenvolvimento isolado e testes, mas nao reabre a area autenticada nem substitui o fluxo real com banco

## Desenvolvimento Local

1. Copie `.env.example` para `.env.local`.
2. Para subir o app com o fluxo real, configure:

```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=algum-segredo-local
NEXT_PUBLIC_APP_ENV=development
```

3. Aplique as migrations e rode o seed:

```bash
npm run prisma:deploy
npm run prisma:seed
```

4. Suba a aplicacao:

```bash
npm run dev
```

5. Abra `http://localhost:3000`.

Se `DATABASE_URL` estiver vazio, o app ainda sobe para desenvolvimento de UI e execucao de parte dos testes, mas login, shell autenticada e APIs protegidas ficam indisponiveis.

## Variaveis De Ambiente

- `DATABASE_URL`
  - conexao com PostgreSQL; obrigatoria para auth e dominio de times
- `BETTER_AUTH_SECRET`
  - segredo usado pelo `better-auth`; obrigatorio sempre que `DATABASE_URL` estiver definido
- `BETTER_AUTH_URL`
  - opcional em desenvolvimento; recomendado quando necessario para callbacks/sessoes
- `NEXT_PUBLIC_APP_ENV`
  - label exibida na UI (`development`, `preview`, `production`)

## Comandos Uteis

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run test:coverage
npm run e2e
npm run e2e:ui
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
```

## Testes

Cobertura atual:

- regras de dominio em `src/lib/*.test.ts`
- contratos de API em `src/app/api/**/*.test.ts`
- componentes e fluxos principais em `src/components/**/*.test.tsx`
- cenarios E2E com `Playwright`

Comandos mais usados:

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run e2e`

## Banco E Seed

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/*`
- Seed: `prisma/seed.mjs`

O seed atual apenas garante que o ambiente esteja pronto; os times passam a existir somente quando usuarios os criam pela aplicacao.

## Documentacao

- `PRD.md`
  - registra a intencao original do `v1`, ainda centrada em times fixos; use como contexto historico, nao como retrato fiel do produto atual
- `techspec/techspec.md`
  - indice da documentacao tecnica viva
- `techspec/testing-strategy.md`
  - estrategia minima de validacao por tipo de mudanca
- `techspec/github-operations.md`
  - CI, checks obrigatorios e fluxo operacional
- `techspec/git-conventions.md`
  - convencoes de branch, commit e release
- `CLAUDE.md`
  - onboarding rapido para agentes/assistentes trabalhando no repositorio
