# Tech Spec - Auth

## Objetivo

Registrar como o fluxo de autenticacao funciona hoje, quais dependencias ele tem e quais limites do v1 precisam permanecer claros.

## Estado atual

- Auth via `Auth.js` com credenciais
- Login com `email + password`
- Cadastro com `username + email + password`
- Usuarios persistidos via Prisma em `users`
- Rate limit persistido via Prisma para `login` e `signup`
- O fluxo autenticado real e `/scoreboard`
- As APIs de scoreboard exigem sessao autenticada quando auth esta disponivel

## Fluxo funcional

- `/login` concentra os modos `entrar` e `criar conta`
- O frontend mantem as acoes de submit habilitadas enquanto auth estiver disponivel, mas valida os campos localmente antes de chamar `signIn` ou `POST /api/auth/register`
- Os schemas `zod` sao compartilhados entre frontend e backend
- Erros locais aparecem por blur ou tentativa de submit
- Erros remotos continuam aparecendo como field errors ou erro geral de submit
- Login e cadastro usam protecao por `email + ip` com janela progressiva de bloqueio
- `/` redireciona para `/scoreboard` quando ha sessao e para `/login` quando nao ha
- `middleware.ts` na raiz protege `/scoreboard` com `withAuth` quando `DATABASE_URL` esta configurado
- `/scoreboard` tambem redireciona para `/login` quando nao existe usuario autenticado
- Apos login bem-sucedido, o usuario segue para `/scoreboard`

## Dependencias de ambiente

Para auth funcionar de verdade, o ambiente precisa de:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`

Sem `DATABASE_URL`:

- o fallback em memoria continua sendo apenas do placar
- login e signup permanecem indisponiveis

Com `DATABASE_URL` e sem `NEXTAUTH_SECRET`:

- o ambiente passa a ser tratado como configuracao invalida de auth
- o app nao deve cair em secret implicito para cookies ou sessao

## Regras e limites atuais

- Nao ha provedores sociais
- Nao ha recuperacao de senha
- Nao ha verificacao de email
- Nao ha perfil de usuario alem do cadastro basico
- Nao ha RBAC implementado
- O rate limit usa `email + ip`, bloqueia apos `5` falhas em `10` minutos e dobra `15 -> 30 -> 60` minutos ate sucesso resetar o estado

## Pontos tecnicos relevantes

- `middleware.ts` protege `/scoreboard` no nivel de roteamento e usa `/login` como `signIn`
- `src/lib/auth-validation.ts` e a referencia para regras de campos
- `src/lib/auth.ts` centraliza configuracao e helpers de sessao
- `src/app/page.tsx` decide o redirecionamento inicial por sessao
- `src/app/scoreboard/page.tsx` reforca a protecao do fluxo principal por redirecionamento server-side
- `src/app/api/auth/register/route.ts` persiste o usuario
- `src/app/api/auth/[...nextauth]/route.ts` executa o login por credenciais
- `src/app/api/scoreboard/route.ts` e `src/app/api/matches/route.ts` retornam `401` sem sessao valida

## Gaps conhecidos

- Nao ha papeis ou permissoes de backend alem da exigencia de sessao

## Proximos passos relacionados

- Monitorar o auth endurecido em preview/producao com `NEXTAUTH_SECRET` obrigatorio
- Adicionar testes integrados com Prisma real para validar o rate limit fora de mocks
- Definir se o produto precisara de RBAC antes de expandir o dominio
- Evitar qualquer extensao de auth que complique o v1 sem necessidade real
