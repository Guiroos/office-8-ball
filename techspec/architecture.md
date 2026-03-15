# Tech Spec - Arquitetura

## Objetivo

Descrever a arquitetura atual do app, suas camadas principais e os pontos que devem permanecer estaveis enquanto o produto continuar no escopo v1.

## Estado atual

- Projeto unico em `Next.js` com `App Router`
- UI e API deployadas juntas
- Persistencia primaria em `Prisma + Postgres`
- Fallback em memoria para desenvolvimento local sem `DATABASE_URL`
- Autenticacao por credenciais com `Auth.js`
- `middleware.ts` na raiz protege `/scoreboard` no nivel de roteamento
- `NEXTAUTH_SECRET` e obrigatorio sempre que `DATABASE_URL` estiver configurado
- Testes automatizados com `Vitest` + Testing Library

## Rotas principais

- `/`
  - redireciona conforme estado de sessao
- `/login`
  - entrada real de login e cadastro
- `/scoreboard`
  - fluxo principal autenticado do produto
- `/api/scoreboard`
  - leitura do placar agregado
- `/api/matches`
  - leitura e criacao de partidas
- `/api/auth/register`
  - cadastro de usuario
- `/api/auth/[...nextauth]`
  - sessao e login via `Auth.js`

## Camadas principais

### UI

- `src/components/login/*`
  - fluxo visual e interacoes de login/signup
- `src/components/dashboard/*`
  - tela principal de placar, historico e registro de vitoria
- `src/components/theme/*`
  - provider, toggle e comportamento de tema
- `src/components/ui/*`
  - primitives locais reutilizaveis

### Dominio e regras

- `src/lib/constants.ts`
  - definicao fixa dos times e mensagens
- `src/lib/types.ts`
  - tipos compartilhados do dominio e da API
- `src/lib/data.ts`
  - regras de negocio, leitura/escrita, agregacao do placar e fallback
- `src/lib/auth-validation.ts`
  - schemas `zod`, normalizacao e mapeamento de erros
- `src/lib/auth.ts`
  - configuracao e helpers de auth
- `middleware.ts`
  - protecao de rota para `/scoreboard` com `withAuth`

### Persistencia

- `prisma/schema.prisma`
  - schema atual do banco
- `prisma/seed.mjs`
  - seed dos dois times fixos
- `src/lib/prisma.ts`
  - cliente Prisma compartilhado

## Regras arquiteturais

- Nao introduzir servico backend separado sem mudanca explicita de produto/arquitetura
- Nao generalizar para multi-team ou multi-league no v1
- Nao persistir counters agregados do placar
- Nao tratar times do banco como fonte unica de verdade; o v1 ainda os espelha em codigo
- Nao quebrar o fallback em memoria sem aprovacao explicita

## Gaps conhecidos

- Ainda nao ha testes integrados com Prisma real
- Ainda nao ha cobertura E2E de navegador
- O dominio continua deliberadamente estreito e nao cobre RBAC ou ligas

## Proximos passos relacionados

- Implementar protecao contra brute force no auth sem aumentar complexidade prematuramente
- Manter a documentacao tecnica sincronizada com o estado do codigo
- So considerar expansao de dominio apos fechar os gaps operacionais do v1
