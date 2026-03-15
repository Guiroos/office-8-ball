# Tech Spec - Git Conventions

## Objetivo

Definir o fluxo oficial de Git do repositorio para branches, commits, pull requests, versionamento e releases.

Este documento e normativo. Quando houver duvida sobre como preparar uma entrega, siga estas convencoes.

## Branch principal

- A branch principal do projeto e `master`
- `master` representa o estado integravel e liberavel do produto
- Nao deve haver push direto em `master`; o fluxo padrao e via pull request

## Naming de branches

Use nomes curtos, descritivos e em lowercase com hifens.

Padroes oficiais:

- `feat/<nome-curto>`
- `fix/<nome-curto>`
- `docs/<nome-curto>`
- `refactor/<nome-curto>`
- `test/<nome-curto>`
- `chore/<nome-curto>`
- `ci/<nome-curto>`
- `hotfix/<nome-curto>`

Exemplos:

- `feat/login-error-states`
- `fix/scoreboard-tie-copy`
- `docs/release-process`
- `hotfix/auth-session-cookie`

Regras:

- prefira um unico objetivo por branch
- evite nomes genericos como `ajustes-finais` ou `teste`
- use `hotfix/` apenas para correcoes urgentes apos uma release publicada

## Convencao de commits

O repositorio usa `Conventional Commits`.

Formato:

```text
tipo: descricao curta
```

Tipos padrao:

- `feat`: nova funcionalidade
- `fix`: correcao de bug
- `docs`: documentacao
- `refactor`: refatoracao sem mudanca funcional intencional
- `test`: testes
- `chore`: manutencao geral
- `ci`: pipeline, workflows e automacoes

Exemplos:

```text
feat: add protected scoreboard redirect
fix: prevent empty auth field errors from sticking
docs: document release and versioning flow
ci: run workflow on master pushes
```

Regras:

- use mensagens objetivas e no imperativo
- evite commits grandes com mudancas sem relacao
- prefira squash merge quando o PR tiver historico intermediario ruidoso

## Pull requests

Fluxo esperado:

1. Criar branch a partir de `master`
2. Implementar a mudanca
3. Rodar a validacao minima adequada ao escopo
4. Abrir PR para `master`
5. Aguardar checks obrigatorios e review
6. Fazer merge somente com os checks verdes

Regras operacionais:

- mantenha a branch atualizada com `master` antes do merge quando necessario
- nao use force-push em `master`
- resolva conversas pendentes antes do merge
- mantenha o PR focado em um objetivo claro

Checks obrigatorios atuais:

- `CI`
- `Dependency Review`
- `CodeQL`

## Versionamento

O projeto usa `Semantic Versioning` com tags no formato `vX.Y.Z`.

Interpretacao:

- `MAJOR`: quebra de compatibilidade
- `MINOR`: nova funcionalidade compativel
- `PATCH`: correcao compativel

Regras:

- a versao publicada e representada pela tag, nao por branch de release
- use tags anotadas
- nao reutilize nem mova tags ja publicadas
- se uma release publicada precisar de ajuste, publique uma nova versao

## Fluxo oficial de release

O fluxo padrao de release parte de `master` e nao usa branch `release/*`.

Sequencia:

1. Garantir que as mudancas desejadas ja foram mergeadas em `master`
2. Confirmar que a validacao necessaria esta verde
3. Atualizar a versao do projeto se necessario
4. Criar a tag anotada no commit aprovado
5. Enviar a tag para o remoto
6. Aguardar o workflow `Deploy Production Tag` publicar a producao na Vercel
7. Publicar um GitHub Release apontando para a tag

Comandos base:

```bash
git checkout master
git pull origin master
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin master
git push origin v1.0.0
```

Depois da tag:

- o GitHub Actions executa o deploy de producao na Vercel
- criar o GitHub Release com titulo `v1.0.0`
- resumir features, correcoes e eventuais notas operacionais

## Checklist de release v1.0.0

1. Confirmar que `master` contem apenas o que deve entrar na release
2. Rodar a validacao combinada para a entrega
3. Confirmar a versao `1.0.0` no projeto
4. Fazer o merge final em `master`
5. Criar a tag anotada `v1.0.0`
6. Enviar a tag para o remoto
7. Confirmar a execucao do workflow `Deploy Production Tag`
8. Publicar o GitHub Release com notas da versao

## Secrets e pre-requisitos de deploy

Para o workflow de producao funcionar, o repositorio precisa ter estes secrets configurados no GitHub:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Com essa estrategia:

- o workflow de producao aplica `prisma migrate deploy` antes do build na Vercel
- a Vercel nao publica automaticamente a cada commit
- a publicacao em producao fica amarrada a tags `v*`
- previews automaticos por push e PR deixam de existir ate que o time crie um fluxo dedicado para isso

## Fora do padrao

Este repositorio nao usa, por padrao:

- branch `release/*` para toda entrega
- branch nomeada como `v1.0.0`
- versionamento baseado em branch

Esses fluxos so devem ser introduzidos se houver uma necessidade operacional nova e documentada.
