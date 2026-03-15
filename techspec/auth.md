# Tech Spec - Auth

## Objetivo

Registrar como o fluxo de autenticacao funciona hoje, quais dependencias ele tem e quais limites do v1 precisam permanecer claros.

## Estado atual

- Auth via `Auth.js` com credenciais
- Login com `email + password`
- Cadastro com `username + email + password`
- Usuarios persistidos via Prisma em `users`
- Rotas de scoreboard e APIs relacionadas exigem sessao autenticada

## Fluxo funcional

- `/login` concentra os modos `entrar` e `criar conta`
- O frontend valida os campos localmente antes de chamar `signIn` ou `POST /api/auth/register`
- Os schemas `zod` sao compartilhados entre frontend e backend
- Erros locais aparecem por blur ou tentativa de submit
- Erros remotos continuam aparecendo como field errors ou erro geral de submit
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

## Pontos tecnicos relevantes

- `src/lib/auth-validation.ts` e a referencia para regras de campos
- `src/lib/auth.ts` centraliza configuracao e helpers de sessao
- `middleware.ts` protege o acesso a `/scoreboard`
- `src/app/api/auth/register/route.ts` persiste o usuario
- `src/app/api/auth/[...nextauth]/route.ts` executa o login por credenciais

## Gaps conhecidos

- Nao ha rate limit para tentativas de login
- Nao ha papeis ou permissoes de backend alem da exigencia de sessao

## Proximos passos relacionados

- Monitorar o auth endurecido em preview/producao com `NEXTAUTH_SECRET` obrigatorio
- Definir se o produto precisara de RBAC antes de expandir o dominio
- Evitar qualquer extensao de auth que complique o v1 sem necessidade real
