# Tech Spec Central

## Objetivo

Esta pasta concentra a documentacao tecnica viva do `Office 8 Ball`.

Use este indice como ponto de entrada para entender o estado tecnico atual, as invariantes do sistema e os proximos passos por dominio. O `PRD.md` continua sendo a referencia principal de produto.

## Resumo tecnico atual

- App unico em `Next.js` com `App Router`
- Dominio v1 fixo em dois times: `frontend` e `backend`
- Placar sempre derivado do historico de partidas
- Persistencia em `Prisma + Postgres` com fallback em memoria para desenvolvimento local
- Autenticacao por credenciais com `Auth.js` e usuarios salvos via Prisma
- Fluxo principal atual em `/login` -> `/scoreboard`
- Sistema de tema compartilhado entre login e dashboard

## Invariantes

- Apenas `frontend` e `backend` sao ids de time validos em v1
- Contadores agregados nao sao persistidos; o placar e calculado a partir de `matches`
- `leaderTeamId` deve ser `null` em empate
- `leadBy` e a diferenca absoluta de vitorias
- `currentStreak` considera as vitorias consecutivas mais recentes do ultimo vencedor
- O fallback em memoria nao substitui persistencia real compartilhada
- Login e signup dependem de `DATABASE_URL` e `NEXTAUTH_SECRET`

## Como navegar

- `architecture.md`
  - stack, rotas, persistencia, camadas e fonte de verdade tecnica
- `scoreboard.md`
  - dominio, invariantes de placar, APIs e fluxo de atualizacao
- `auth.md`
  - fluxo de autenticacao, validacao compartilhada e dependencias de ambiente
- `theme-system.md`
  - estado atual do sistema de tema, gaps e ordem recomendada de evolucao
- `github-operations.md`
  - workflows, checks obrigatorios, integracao com Vercel e endurecimento operacional do repositorio
- `git-conventions.md`
  - branch principal, naming de branches, Conventional Commits e fluxo oficial de release por tag
- `roadmap.md`
  - proximos passos tecnicos e evolucao planejada

## Quando consultar cada documento

- Se a mudanca mexe em dados, historico, placar ou contratos de match:
  - leia `scoreboard.md`
- Se a mudanca mexe em login, sessao, middleware ou validacao de auth:
  - leia `auth.md`
- Se a mudanca mexe em estrutura geral, rotas, runtime ou persistencia:
  - leia `architecture.md`
- Se a mudanca mexe em tokens, provider, toggle, primitives ou visual system:
  - leia `theme-system.md`
- Se a mudanca mexe em CI, GitHub Actions, checks de PR, Dependabot ou integracao operacional com Vercel:
  - leia `github-operations.md`
- Se a mudanca mexe em fluxo de branch, convencao de commit, versionamento ou release:
  - leia `git-conventions.md`
- Se a mudanca precisa ser posicionada na evolucao tecnica futura:
  - leia `roadmap.md`

## Relacao com outros documentos

- `PRD.md` continua sendo a referencia de produto e escopo
- `README.md` continua sendo onboarding, setup e status geral
- `techspec/` e a fonte unica da documentacao tecnica viva do projeto
