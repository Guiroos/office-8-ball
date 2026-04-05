# Tech Spec - Runtime Environments

## Objetivo

Centralizar como o app se comporta em cada combinacao relevante de ambiente, com foco em auth, persistencia e fluxo funcional.

## Matriz oficial

### Sem `DATABASE_URL`

- auth fica indisponivel
- `getAuthenticatedUser()` retorna `null`
- `proxy.ts` atua como no-op
- `/` redireciona para `/login`
- rotas protegidas server-side redirecionam para `/login` quando tentadas sem sessao
- `/api/scoreboard` e `/api/matches` retornam `503`
- `POST /api/auth/register` retorna `503`
- nao existe fallback em memoria para persistencia compartilhada nem para reabrir o fluxo autenticado

Uso esperado:

- desenvolvimento isolado de componentes e partes do dominio puro
- nao valida persistencia compartilhada
- nao valida auth real

### Com `DATABASE_URL` e sem `BETTER_AUTH_SECRET`

- persistencia de dados segue apontando para Prisma + Postgres
- auth e tratado como configuracao invalida
- `getAuthUnavailableResponse()` retorna `500` nas rotas de auth/DB que dependem de configuracao completa de auth
- o app nao deve usar secret implicito para cookies ou sessao
- `proxy.ts` continua verificando cookie de sessao, mas auth real permanece indisponivel

Uso esperado:

- estado invalido de ambiente
- deve ser corrigido antes de usar login real

### Com `DATABASE_URL` e `BETTER_AUTH_SECRET`

- persistencia usa Prisma + Postgres
- login e signup ficam disponiveis
- `proxy.ts` protege a area autenticada por cookie de sessao
- `src/app/(authenticated)/layout.tsx` reforca a validacao de sessao no server component
- `/dashboard` e `/scoreboard` so preservam redirecionamento legado para `/times`
- as APIs protegidas validam sessao e retornam `401` sem autenticacao
- `/` redireciona por estado de sessao
- cookies seguros sao usados em producao

Uso esperado:

- preview ou producao com auth real
- desenvolvimento local conectado a banco real

## Regras de runtime

- ausencia de `DATABASE_URL` inviabiliza o runtime autenticado
- ausencia de `BETTER_AUTH_SECRET` com banco presente e erro de configuracao, nao modo degradado aceitavel
- `/times` e a entrada autenticada atual do produto
- `/dashboard` e `/scoreboard` sao rotas legadas de compatibilidade
- nao documentar fallback em memoria para partidas/auth, porque ele nao existe no estado atual

## Fontes de verdade

- `proxy.ts`
- `src/lib/auth.ts`
- `src/lib/data.ts`
- `src/app/page.tsx`
- `src/app/(authenticated)/layout.tsx`
- `src/app/(authenticated)/dashboard/page.tsx`
- `src/app/scoreboard/page.tsx`
- `src/app/api/scoreboard/route.ts`
- `src/app/api/matches/route.ts`
- `src/app/api/auth/register/route.ts`
