# Tech Spec Central

## Objetivo

Esta pasta concentra a documentacao tecnica viva do `Office 8 Ball`.

Use este indice como ponto de entrada para entender o estado tecnico atual, as invariantes do sistema e como cada dominio esta organizado. O `PRD.md` continua sendo a referencia principal de produto. Planejamento futuro agora vive no GitHub, via milestones e issues.

## Resumo tecnico atual

- App unico em `Next.js` com `App Router`
- Times sao dinamicos e criados pelos usuarios; nao existem IDs hardcoded de time
- Placar e ranking continuam derivados do historico de partidas
- Persistencia em `Prisma + Postgres`
- Auth por credenciais com `better-auth`
- Fluxo autenticado atual entra por `/times`
- `/dashboard` e `/scoreboard` permanecem como rotas legadas com redirecionamento para `/times`
- Sistema de tema compartilhado entre login e shell autenticada

## Invariantes

- Contadores agregados nao sao persistidos; o placar e calculado a partir de `matches`
- `leaderTeamId` deve ser `null` em empate
- `leadBy` e a diferenca absoluta de vitorias
- `DATABASE_URL` e obrigatorio para o runtime autenticado
- Sem `DATABASE_URL`, as rotas protegidas e APIs dependentes de auth/DB ficam indisponiveis; nao existe fallback em memoria para o fluxo autenticado
- `BETTER_AUTH_SECRET` e obrigatorio para auth real quando `DATABASE_URL` estiver presente

## Como navegar

- `architecture.md`
  - stack, rotas, persistencia, camadas e fonte de verdade tecnica
- `scoreboard.md`
  - dominio de partidas e placar, invariantes e contratos centrais
- `auth.md`
  - fluxo de autenticacao, validacao compartilhada e dependencias de ambiente
- `runtime-environments.md`
  - matriz de ambiente, combinacoes de config e comportamento esperado em auth e persistencia
- `api-contracts.md`
  - contratos atuais de payload, resposta e erro das APIs usadas pela UI
- `testing-strategy.md`
  - cobertura atual, gaps reais e validacao minima por tipo de mudanca
- `persistence-and-migrations.md`
  - relacao entre schema, seed, migrations e invariantes de persistencia
- `theme-system.md`
  - estado atual do sistema de tema, gaps e ordem recomendada de evolucao
- `sidebar-layout.md`
  - estado atual da shell autenticada, navegacao e rotas legadas
- `github-operations.md`
  - workflows, checks obrigatorios e fluxo operacional do repositorio
- `git-conventions.md`
  - branch principal, naming de branches, Conventional Commits e release por tag
- `roadmap-workflow.md`
  - processo para organizar milestones, issues, labels, dependencias e iniciar execucao

## Quando consultar cada documento

- Se a mudanca mexe em dados, historico, placar ou contratos de match:
  - leia `scoreboard.md`
- Se a mudanca mexe em login, sessao, protecao de rota ou validacao de auth:
  - leia `auth.md`
- Se a mudanca mexe em ambiente, secrets, disponibilidade de auth ou modos de runtime:
  - leia `runtime-environments.md`
- Se a mudanca mexe em payload, resposta, erro ou compatibilidade entre UI e API:
  - leia `api-contracts.md`
- Se a mudanca mexe em estrutura geral, rotas, runtime ou persistencia:
  - leia `architecture.md`
- Se a mudanca mexe em schema, seed, migrations ou invariantes de banco:
  - leia `persistence-and-migrations.md`
- Se a mudanca mexe em tokens, provider, toggle, primitives ou visual system:
  - leia `theme-system.md`
- Se a mudanca mexe em shell autenticada, navegacao lateral, layout compartilhado ou rotas legadas:
  - leia `sidebar-layout.md`
- Se a mudanca mexe em CI, GitHub Actions, checks de PR ou operacao do repositorio:
  - leia `github-operations.md`
- Se a mudanca mexe em fluxo de branch, convencao de commit, versionamento ou release:
  - leia `git-conventions.md`
- Se a mudanca precisa ser posicionada no planejamento futuro:
  - consulte as milestones e issues no GitHub e use `roadmap-workflow.md` como processo
- Se a mudanca mexe em estrategia de validacao, lacunas de cobertura ou bateria minima de checks:
  - leia `testing-strategy.md`

## Relacao com outros documentos

- `PRD.md` continua sendo a referencia de produto e escopo
- `README.md` continua sendo onboarding, setup e status geral
- `techspec/` e a fonte principal da documentacao tecnica viva do projeto
