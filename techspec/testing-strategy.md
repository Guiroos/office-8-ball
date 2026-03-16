# Tech Spec - Testing Strategy

## Objetivo

Definir a estrategia de validacao atual do projeto, os gaps conhecidos e a menor bateria util por tipo de mudanca.

## Cobertura atual

- `src/lib/*.test.ts`
  - valida regras de dominio e auth
- `src/app/api/**/*.test.ts`
  - valida contratos e respostas das rotas
- `src/components/**/*.test.tsx`
  - valida dashboard, login, tema e componentes globais de composicao relevantes

Ferramentas atuais:

- `Vitest`
- `Testing Library`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## O que a estrategia cobre bem hoje

- derivacao do placar a partir do historico
- validacao de payloads e erros das rotas principais
- fluxo de login/signup no nivel de componente
- integracao da dashboard com `fetch` mockado
- contrato estrutural dos componentes globais de composicao em `src/components/ui/*`

## Gaps reais

- nao ha testes integrados com Prisma real
- nao ha E2E de navegador para `/login` e `/scoreboard`

## Validacao minima por tipo de mudanca

### Documentacao apenas

- revisar consistencia entre `README.md`, `AGENTS.md` e `techspec/`

### Auth, login ou protecao de rota

- `npm run test -- src/lib/auth.test.ts`
- `npm run test -- src/lib/auth-validation.test.ts`
- `npm run test -- src/app/api/auth/register/route.test.ts`
- `npm run test -- src/components/login/login-screen.test.tsx`

### Scoreboard, matches ou dashboard

- `npm run test -- src/lib/data.test.ts`
- `npm run test -- src/app/api/matches/route.test.ts`
- `npm run test -- src/app/api/scoreboard/route.test.ts`
- `npm run test -- src/components/dashboard.test.tsx`

### Persistencia, schema ou mudanca ampla

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Sistema de tema

- `npm run test -- src/components/theme/theme-core.test.ts`
- `npm run test -- src/components/theme/theme-provider.test.tsx`
- `npm run test -- src/components/theme/theme-toggle.test.tsx`
- `npm run test -- src/components/ui/composition.test.tsx`
- `npm run test -- src/components/dashboard.test.tsx`

### Primitives ou composicao global de UI

- `npm run test -- src/components/ui/composition.test.tsx`
- `npm run test -- src/components/dashboard.test.tsx`
- `npm run test -- src/components/login/login-screen.test.tsx`

## Regras praticas

- Se o contrato de API mudar, validar tambem a UI consumidora
- Se `src/lib/data.ts` mudar, considerar sempre os modos com e sem `DATABASE_URL`
- Se auth mudar, verificar explicitamente o comportamento sem `DATABASE_URL` e sem `NEXTAUTH_SECRET`
- Nao tratar sucesso em fallback em memoria como prova de persistencia real compartilhada
