# Tech Spec - Roadmap Tecnico

## Objetivo

Organizar os proximos passos tecnicos do projeto sem misturar backlog futuro com itens que ja fazem parte do estado atual do codigo.

## Snapshot do estado atual

- Prisma ja foi adotado
- A UI principal ja usa `Tailwind CSS` com primitives locais no estilo `shadcn/ui`
- Auth.js por credenciais ja protege `/scoreboard` e as APIs do placar
- O cadastro inicial de usuarios ja existe via Postgres
- O dominio continua fixo em dois times globais

## Proximos passos priorizados

### 1. Fechar gaps de qualidade

Prioridade: alta

- O rate limit de auth ja foi implementado com estado persistido em Prisma
- A base de configuracao segura de `NEXTAUTH_SECRET` ja esta endurecida no codigo
- A operacao sob HTTPS e cookies seguros ja esta tratada no runtime de auth
- Priorizar testes integrados com Prisma real para auth e scoreboard
- Confirmar no backend qualquer regra de permissao futura; nao depender apenas da UI

Nota:
- a base operacional de repositorio, CI, CodeQL, Dependabot e review de dependencias agora esta documentada em `github-operations.md`
- os proximos passos aqui ficam restritos a gaps ainda nao implementados no codigo ou na configuracao

### 2. Cobertura E2E minima

Prioridade: media

- Expandir a cobertura E2E alem do fluxo principal ja implementado em login e scoreboard
- Priorizar cenarios ainda nao cobertos, como rate limit de auth e variantes negativas mais profundas
- Endurecer as assercoes de placar para garantir que cada registro de vitoria representa exatamente uma nova partida
- Avaliar execucao de E2E em servidor mais proximo de producao com `next build` + `next start`
- Avaliar `SonarQube Cloud` para code smells e quality gate de maintainability
- Manter contratos de API e fluxo da UI sincronizados em qualquer evolucao

### 3. Expansao de dominio

Prioridade: futura

- So iniciar depois de fechar os gaps operacionais do v1
- Escopo potencial:
  - ligas ou workspaces
  - times proprios
  - memberships
  - RBAC simples

## Fora de escopo no curto prazo

- Generalizacao imediata para multi-team
- Painel admin
- Caching layer
- Bibliotecas extras de state management
- Contadores persistidos para o placar

## Regra de uso

Este roadmap tecnico deve refletir apenas trabalho futuro ou gaps em aberto. O que ja foi implementado deve migrar para os techspecs de estado atual, nao permanecer aqui como checklist semantico de execucao passada.
