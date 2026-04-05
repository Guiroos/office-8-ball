# Tech Spec - Arquitetura

## Objetivo

Descrever a arquitetura atual do app, suas camadas principais e os pontos que devem permanecer estaveis enquanto o produto continuar no escopo atual.

## Estado atual

- projeto unico em `Next.js` com `App Router`
- UI e API deployadas juntas
- persistencia em `Prisma + Postgres`
- autenticacao por credenciais com `better-auth`
- protecao contra brute force em auth persistida via Prisma
- `proxy.ts` na raiz protege a area autenticada no nivel de roteamento quando `DATABASE_URL` existe
- `BETTER_AUTH_SECRET` e obrigatorio para auth real quando `DATABASE_URL` estiver configurado
- testes automatizados com `Vitest`, Testing Library e `Playwright`

## Rotas principais

- `/`
  - redireciona para `/times` quando ha sessao e para `/login` quando nao ha
- `/login`
  - entrada real de login e cadastro
- `/times`
  - home autenticada atual para listagem, filtro e criacao de times
- `/partida`
  - fluxo autenticado de registro de partidas
- `/ranking`
  - ranking funcional com filtros por tipo e periodo
- `/profile`
  - pagina funcional de perfil e estatisticas pessoais
- `/settings`
  - placeholder autenticado para futuras acoes de conta/preferencias
- `/dashboard`
  - rota legada que redireciona para `/times`
- `/scoreboard`
  - rota legada que redireciona para `/times`
- `/api/scoreboard`
  - leitura do placar agregado
- `/api/matches`
  - leitura e criacao de partidas
- `/api/auth/register`
  - cadastro de usuario
- `/api/auth/[...all]`
  - sessao e login via `better-auth`
- `/api/profile`
  - leitura e atualizacao do perfil

## Camadas principais

### UI

- `src/components/login/*`
  - fluxo visual e interacoes de login/signup
- `src/components/dashboard/*`
  - componentes herdados/compartilhados ligados a scoreboard e historico
- `src/components/teams/*`
  - listagem, criacao, detalhe e gestao de membros dos times
- `src/components/ranking/*`
  - ranking, podium e filtros
- `src/components/profile/*`
  - hero, estatisticas e edicao de perfil
- `src/components/authenticated/*`
  - shell compartilhada, sidebar e menu de conta
- `src/components/theme/*`
  - provider, toggle e bootstrap de tema
- `src/components/ui/*`
  - primitives locais reutilizaveis

### Dominio e regras

- `src/lib/types.ts`
  - tipos compartilhados do dominio e da API
- `src/lib/data.ts`
  - leitura/escrita de partidas e agregacao do placar
- `src/lib/teams.ts`
  - operacoes principais de times e memberships
- `src/lib/team-details.ts`
  - montagem de dados detalhados de time
- `src/lib/ranking.ts`
  - agregacao e filtros do ranking
- `src/lib/profile.ts` e `src/lib/profile-stats.ts`
  - montagem do perfil e stats pessoais
- `src/lib/auth-validation.ts`
  - schemas `zod`, normalizacao e mapeamento de erros
- `src/lib/auth.ts`
  - configuracao e helpers de auth
- `src/lib/auth-rate-limit.ts`
  - estado e regras de rate limit por `action + username + ip`
- `proxy.ts`
  - protecao de rota para a area autenticada no nivel de roteamento

### Persistencia

- `prisma/schema.prisma`
  - schema atual do banco, incluindo `auth_rate_limits`
- `prisma/seed.mjs`
  - seed UAT com usuarios, times, memberships e partidas de exemplo
- `src/lib/prisma.ts`
  - cliente Prisma compartilhado

## Regras arquiteturais

- nao introduzir servico backend separado sem mudanca explicita de produto/arquitetura
- nao persistir counters agregados do placar
- nao reintroduzir times hardcoded no codigo
- times, memberships e partidas devem continuar vindo do banco como fonte de verdade
- `getScoreboard()` deve continuar derivando o placar a partir do historico completo relevante
- ausencia de `DATABASE_URL` nao abre modo degradado autenticado; as rotas dependentes ficam indisponiveis

## Gaps conhecidos

- ainda nao ha testes integrados suficientes com Prisma real para todos os fluxos criticos
- a cobertura E2E ainda nao cobre rate limit de auth nem o fluxo completo de registrar partida e refletir no placar
- `/settings` segue sem funcionalidade propria

## Proximos cuidados

- manter a documentacao tecnica sincronizada com o estado do codigo
- priorizar testes integrados com Prisma real para auth e fluxos de partidas/times
- evitar expandir o dominio sem necessidade concreta de produto
