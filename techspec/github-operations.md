# Tech Spec - GitHub Operations

## Objetivo

Definir a camada operacional minima do repositorio para manter qualidade, reduzir risco de supply chain e integrar os checks do GitHub com o fluxo de preview e build da Vercel.

O GitHub valida codigo, dependencias e seguranca. A Vercel continua sendo a plataforma de deploy e preview.

## Estado atual

### Workflows ativos

- `CI`
  - roda em `pull_request` e `push` para `main`
  - executa `npm ci`, `prisma generate`, `lint`, `typecheck`, `test:coverage` e `build`
- `Dependency Review`
  - roda em `pull_request`
  - analisa dependencias novas ou alteradas no PR
- `CodeQL`
  - roda em `pull_request`, `push` para `main` e agenda semanal
  - faz code scanning para `javascript-typescript`

### Automacao de updates

- `Dependabot` atualiza dependencias `npm` semanalmente
- `Dependabot` tambem atualiza `github-actions` semanalmente

## Contratos operacionais

Os nomes dos checks abaixo sao parte do contrato operacional do repositorio:

- `CI`
- `Dependency Review`
- `CodeQL`

Se algum nome mudar, o ruleset do GitHub e os Deployment Checks da Vercel tambem precisam ser atualizados.

## Fluxo esperado de PR

1. O autor abre um PR.
2. O GitHub executa `CI`, `Dependency Review` e `CodeQL`.
3. A Vercel cria o preview deploy do PR.
4. O merge em `main` so deve ocorrer com os checks obrigatorios verdes.
5. A Vercel promove a branch aprovada de acordo com a configuracao do projeto.

## Configuracoes manuais recomendadas

### GitHub

Configurar ruleset ou branch protection para `main` com:

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

### Vercel

Manter:

- preview deploy automatico por PR
- build/deploy gerenciado pela propria Vercel

Configurar:

- Deployment Checks dependentes dos checks obrigatorios do GitHub

## Limites e proximos passos

Esta camada cobre validacao basica, SAST inicial e review de dependencias. Ela ainda nao cobre:

- analise formal de code smells e maintainability por plataforma dedicada
- E2E gates
- testes integrados com Prisma real no CI

Proxima fase recomendada:

- avaliar `SonarQube Cloud` para code smells, maintainability e quality gates
- avaliar `Semgrep` apenas se surgir necessidade de reforco adicional de AppSec
- revisitar pinagem por SHA completo nas actions caso o time queira endurecimento maior de supply chain
