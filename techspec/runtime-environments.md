# Tech Spec - Runtime Environments

## Objetivo

Centralizar como o app se comporta em cada combinacao relevante de ambiente, com foco em auth, persistencia e fluxo funcional.

## Matriz oficial

### Sem `DATABASE_URL`

- Persistencia de partidas usa fallback em memoria
- Login e signup ficam indisponiveis
- `getAuthenticatedUser()` retorna `null`
- `middleware.ts` atua como no-op
- `/` redireciona para `/login`
- `/scoreboard` redireciona para `/login`
- `/api/scoreboard` e `/api/matches` retornam `401`
- `POST /api/auth/register` retorna indisponibilidade de auth

Uso esperado:

- desenvolvimento local de UI e dominio do placar
- nao valida persistencia compartilhada
- nao valida auth real

### Com `DATABASE_URL` e sem `NEXTAUTH_SECRET`

- Persistencia de partidas usa Prisma + Postgres
- Auth e tratado como configuracao invalida
- `middleware.ts` falha na inicializacao para impedir secret implicito
- `/` continua resolvendo sessao como ausente e redireciona para `/login`
- `/scoreboard` redireciona para `/login`
- `/api/scoreboard` e `/api/matches` retornam `401`
- `POST /api/auth/register` retorna erro de configuracao de auth
- o app nao deve usar secret implicito para cookies ou sessao

Uso esperado:

- estado invalido de ambiente
- deve ser corrigido antes de usar login real

### Com `DATABASE_URL` e `NEXTAUTH_SECRET`

- Persistencia de partidas usa Prisma + Postgres
- Login e signup ficam disponiveis
- `middleware.ts` protege `/scoreboard` com `withAuth`
- `src/app/scoreboard/page.tsx` reforca a validacao de sessao no server component
- As APIs do placar validam sessao e retornam `401` sem autenticacao
- `/` redireciona por estado de sessao
- cookies seguros sao usados em producao ou quando `NEXTAUTH_URL` comeca com `https://`

Uso esperado:

- preview ou producao com auth real
- desenvolvimento local conectado a banco real

## Regras de runtime

- O fallback em memoria existe apenas para desenvolvimento local
- A ausencia de `DATABASE_URL` nao desabilita apenas o banco; ela inviabiliza auth real
- A presenca de `DATABASE_URL` sem `NEXTAUTH_SECRET` e erro de configuracao, nao modo degradado aceitavel
- `/scoreboard` permanece o fluxo funcional principal do produto

## Fontes de verdade

- `middleware.ts`
- `src/lib/auth.ts`
- `src/lib/data.ts`
- `src/app/page.tsx`
- `src/app/scoreboard/page.tsx`
- `src/app/api/scoreboard/route.ts`
- `src/app/api/matches/route.ts`
- `src/app/api/auth/register/route.ts`
