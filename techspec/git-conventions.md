# Tech Spec - Git Conventions

## Objetivo

Padronizar branch, commit, PR e release do repositório para manter previsibilidade no fluxo de trabalho.

## Branch principal

- a branch principal do repositório é `master`
- toda branch de trabalho parte de `master`
- PRs devem apontar para `master`

## Naming de branches

Padrão recomendado:

```text
<tipo>/<nome-curto>
```

Exemplos:

- `feat/first-run-onboarding`
- `fix/authenticated-home-routing`
- `docs/align-product-flow`
- `test/critical-team-match-integration`

Quando fizer sentido vincular a branch a uma issue, o número pode entrar no nome:

```text
<tipo>/<issue>-<nome-curto>
```

Exemplos:

- `fix/95-authenticated-home-routing`
- `feat/101-first-recorded-match-flow`

## Commits

Usar Conventional Commits:

- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `test: ...`
- `docs: ...`
- `chore: ...`

Regras:

- escrever em inglês
- ser curto e específico
- refletir o resultado principal da mudança
- evitar commits genéricos como `update stuff`

Exemplos:

- `fix: redirect authenticated home to teams`
- `feat: add duo team partner filter`
- `docs: align techspecs with current runtime behavior`

## Pull requests

Regras:

- PR deve manter um único objetivo principal
- PR deve referenciar a issue correspondente quando existir
- título do PR segue Conventional Commits em inglês
- corpo do PR deve ser em português

Estrutura recomendada do corpo:

```md
## O que muda
- ...
- ...

## Como testar
- ...
- ...
```

Fechamento automático recomendado:

```md
Closes #123
```

## Validação antes do PR

Rodar a menor bateria que cubra a mudança.

Exemplos comuns:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run e2e`

A seleção depende do tipo de alteração.

## Releases

O fluxo oficial de release é por tag anotada `v*` na `master`.

Sequência base:

1. garantir que `master` contém apenas o que deve entrar na release
2. rodar a validação combinada apropriada para a entrega
3. conferir a versão atual em `package.json`
4. criar a tag anotada da versão atual
5. enviar a tag para o remoto
6. aguardar o workflow `Deploy Production Tag` publicar no Cloudflare Workers
7. publicar um GitHub Release apontando para a tag

Comandos base:

```bash
git checkout master
git pull origin master
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin master
git push origin vX.Y.Z
```

Depois da tag:

- o GitHub Actions executa o deploy de produção no Cloudflare Workers
- criar o GitHub Release com título `vX.Y.Z`
- resumir features, correções e eventuais notas operacionais

## Checklist de release

1. confirmar que `master` contém apenas o que deve entrar na release
2. rodar a validação combinada da entrega
3. confirmar a versão atual em `package.json`
4. criar a tag anotada `vX.Y.Z`
5. enviar a tag para o remoto
6. confirmar a execução do workflow `Deploy Production Tag`
7. publicar o GitHub Release com notas da versão

## Secrets e pré-requisitos de deploy

Para o workflow de produção funcionar, o repositório precisa ter estes secrets configurados no GitHub:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Com essa estratégia:

- o workflow de produção aplica `prisma migrate deploy` antes do build
- o Cloudflare Workers não publica automaticamente a cada commit
- a publicação em produção fica amarrada a tags `v*`

## Fora do padrão

Este repositório não usa, por padrão:

- branch `release/*` para toda entrega
- branch nomeada como versão
- versionamento baseado em branch

Esses fluxos só devem ser introduzidos se houver necessidade operacional nova e documentada.
