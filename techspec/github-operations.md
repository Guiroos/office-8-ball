# Tech Spec - GitHub Operations

## Objetivo

Definir a camada operacional minima do repositorio para manter qualidade, reduzir risco de supply chain e integrar os checks do GitHub com o fluxo de preview e build da Vercel.

O GitHub valida codigo, dependencias e seguranca. A Vercel continua sendo a plataforma de deploy e preview.

## Estado atual

### Workflows ativos

- `CI`
  - roda em `pull_request` e `push` para `master`
  - executa `npm ci`, `prisma generate`, `lint`, `typecheck`, `test:coverage` e `build`
- `Dependency Review`
  - roda em `pull_request`
  - analisa dependencias novas ou alteradas no PR
- `CodeQL`
  - roda em `pull_request`, `push` para `master` e agenda semanal
  - faz code scanning para `javascript-typescript`
- `Deploy Production Tag`
  - roda em `push` de tags `v*` e por `workflow_dispatch`
  - aplica `prisma migrate deploy` usando `DATABASE_URL` antes do build
  - usa `Vercel CLI` para publicar em producao a partir da tag liberada

### Automacao de updates

- `Dependabot` atualiza dependencias `npm` semanalmente
- `Dependabot` tambem atualiza `github-actions` semanalmente

### Publicacao na Vercel

- `vercel.json` define `git.deploymentEnabled: false`
- commits e merges nao geram deploy automatico na Vercel
- a publicacao de producao acontece apenas pelo workflow `Deploy Production Tag`
- o fluxo de preview automatico por branch/PR deixa de existir com essa configuracao

## Contratos operacionais

Os nomes dos checks abaixo sao parte do contrato operacional do repositorio:

- `CI`
- `Dependency Review`
- `CodeQL`

Se algum nome mudar, o ruleset do GitHub e os Deployment Checks da Vercel tambem precisam ser atualizados.

## Fluxo esperado de PR

1. O autor abre um PR.
2. O GitHub executa `CI`, `Dependency Review` e `CodeQL`.
3. O merge em `master` so deve ocorrer com os checks obrigatorios verdes.
4. Quando a release estiver pronta, o time cria uma tag `vX.Y.Z`.
5. O GitHub executa `Deploy Production Tag`.
6. A Vercel publica a producao a partir da tag liberada.

## Configuracoes manuais recomendadas

### GitHub

Configurar ruleset ou branch protection para `master` com:

- PR obrigatorio para merge
- checks obrigatorios:
  - `CI`
  - `Dependency Review`
  - `CodeQL`
- branch atualizada antes do merge
- conversations resolvidas
- bloqueio de force-push

Ativar tambem:

- secret scanning
- push protection

As convencoes de branch naming, commits e releases ficam centralizadas em `techspec/git-conventions.md`.

### Vercel

Manter:

- projeto conectado ao repositorio
- build/deploy de producao acionado por GitHub Actions com `Vercel CLI`

Configurar:

- `DATABASE_URL`, `NEXTAUTH_SECRET`, `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` como secrets do GitHub Actions
- automatic Git deployments desabilitados no projeto via `vercel.json`

## Limites e proximos passos

Esta camada cobre validacao basica, SAST inicial e review de dependencias. Ela ainda nao cobre:

- analise formal de code smells e maintainability por plataforma dedicada
- E2E gates
- testes integrados com Prisma real no CI

Proxima fase recomendada:

- avaliar `SonarQube Cloud` para code smells, maintainability e quality gates
- avaliar `Semgrep` apenas se surgir necessidade de reforco adicional de AppSec
- revisitar pinagem por SHA completo nas actions caso o time queira endurecimento maior de supply chain
