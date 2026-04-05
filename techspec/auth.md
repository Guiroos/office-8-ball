# Tech Spec - Auth

## Objetivo

Registrar como o fluxo de autenticacao funciona hoje, quais dependencias ele tem e quais limites do produto precisam permanecer claros.

## Estado atual

- auth via `better-auth` com credenciais
- login com `username + password`
- cadastro com `username + password`
- usuarios persistidos via Prisma em `users`
- rate limit persistido via Prisma para `login` e `register`
- a entrada autenticada principal do produto hoje e `/times`
- `/dashboard` e `/scoreboard` existem apenas como rotas legadas com redirecionamento para `/times`
- APIs protegidas exigem sessao autenticada quando auth esta disponivel

## Fluxo funcional

- `/login` concentra os modos `entrar` e `criar conta`
- o frontend valida campos localmente antes de chamar `signIn` ou `POST /api/auth/register`
- os schemas `zod` sao compartilhados entre frontend e backend
- erros locais aparecem por blur ou tentativa de submit
- erros remotos continuam aparecendo como field errors ou erro geral de submit
- login e cadastro usam protecao por `action + username + ip` com janela progressiva de bloqueio
- `/` redireciona para `/times` quando ha sessao e para `/login` quando nao ha
- `proxy.ts` protege a area autenticada no nivel de roteamento quando `DATABASE_URL` esta configurado
- `src/app/(authenticated)/layout.tsx` reforca a protecao da shell autenticada por redirecionamento server-side
- apos login bem-sucedido, o usuario segue para `/times`

## Dependencias de ambiente

Para auth funcionar de verdade, o ambiente precisa de:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`

Sem `DATABASE_URL`:

- login e signup ficam indisponiveis
- `getAuthenticatedUser()` retorna `null`
- rotas protegidas e APIs dependentes retornam indisponibilidade
- nao existe fallback em memoria para reabrir o fluxo autenticado

Com `DATABASE_URL` e sem `BETTER_AUTH_SECRET`:

- o ambiente passa a ser tratado como configuracao invalida de auth
- rotas e APIs de auth devem responder erro de configuracao apropriado
- o app nao deve cair em secret implicito para cookies ou sessao

## Regras e limites atuais

- nao ha provedores sociais
- nao ha recuperacao de senha
- nao ha verificacao de email
- nao ha RBAC implementado alem da exigencia de sessao
- o rate limit usa `action + username + ip`, bloqueia apos `5` falhas em `10` minutos e dobra `15 -> 30 -> 60` minutos ate sucesso resetar o estado

## Pontos tecnicos relevantes

- `proxy.ts` protege `/dashboard`, `/scoreboard`, `/times`, `/ranking`, `/profile`, `/settings` e `/head-to-head`
- `src/lib/auth-validation.ts` e a referencia para regras de campos
- `src/lib/auth.ts` centraliza configuracao, disponibilidade e helpers de sessao
- `src/app/page.tsx` decide o redirecionamento inicial por sessao
- `src/app/(authenticated)/layout.tsx` reforca a protecao da shell autenticada por redirecionamento server-side
- `src/app/(authenticated)/dashboard/page.tsx` preserva compatibilidade por redirecionamento legado
- `src/app/scoreboard/page.tsx` preserva compatibilidade por redirecionamento legado
- `src/app/api/auth/register/route.ts` persiste o usuario
- `src/app/api/auth/[...all]/route.ts` executa login e sessao via `better-auth`
- `src/app/api/scoreboard/route.ts` e `src/app/api/matches/route.ts` retornam `503` sem `DATABASE_URL` e `401` sem sessao valida

## Gaps conhecidos

- nao ha recuperacao/troca de senha ainda
- nao ha papeis ou permissoes de backend alem da exigencia de sessao
- `POST /api/matches` ainda nao reaproveita o rate limit existente de auth

## Proximos cuidados

- monitorar o auth em preview/producao com `BETTER_AUTH_SECRET` obrigatorio
- adicionar mais testes integrados com Prisma real para validar o rate limit fora de mocks
- evitar qualquer extensao de auth que complique o produto sem necessidade real
