# Tech Spec - Roadmap Workflow

## Objetivo

Padronizar como o planejamento do projeto e criado, refinado e transformado em trabalho executavel no GitHub.

Este documento cobre o processo operacional: milestones, issues, labels, dependencias e o fluxo de desenvolvimento a partir de uma issue.

As milestones e issues do GitHub sao a fonte de verdade do planejamento futuro. Este documento descreve o processo, nao um backlog paralelo em arquivo local.

## Quando usar

Use este fluxo quando precisar:

- criar um novo ciclo de planejamento
- reorganizar backlog em blocos entregaveis
- transformar uma direcao ampla em milestones e issues
- preparar uma sequencia clara de implementacao
- retomar planejamento futuro sem redesenhar tudo do zero

## Estrutura oficial do planejamento

O planejamento deve ser organizado em 3 niveis:

1. **Milestone**
   - agrupa um bloco coerente de entrega
   - deve representar um resultado perceptivel
   - exemplos: `M1 - Core UX e Navegacao`, `M2 - Onboarding e Ativacao`

2. **Issue**
   - representa uma entrega concreta dentro da milestone
   - cada issue deve ter um unico objetivo principal
   - a issue e a unidade padrao de planejamento e execucao

3. **Branch / PR**
   - cada issue implementada deve gerar uma branch propria
   - o PR deve permanecer focado em uma unica issue principal

## Regra de granularidade

- milestone = um bloco de resultado
- issue = uma entrega concreta
- branch = uma implementacao focada
- PR = um objetivo claro

Evitar:

- milestones genericas como `melhorias gerais`
- issues vagas como `ajustes de UX`
- branches com mais de um objetivo
- PRs que misturam produto, refactor e infra sem relacao direta

## Como criar o planejamento

### Passo 1 - mapear estado atual

Antes de criar milestones, levantar:

- rotas e fluxos principais ja existentes
- funcionalidades que ja entregam valor
- lacunas de UX, produto e engenharia
- debitos tecnicos que bloqueiam evolucao
- inconsistencias entre codigo, docs e comportamento real

### Passo 2 - agrupar por blocos de resultado

Transformar os achados em milestones que respondam a uma pergunta simples:

- qual resultado essa milestone entrega quando terminar?

Boas milestones:

- `M1 - Core UX e Navegacao`
- `M2 - Onboarding e Ativacao`
- `M3 - Base Tecnica e Confianca`

### Passo 3 - quebrar cada milestone em issues

Cada issue deve conter:

- titulo curto no formato Conventional Commits
- objetivo
- contexto
- escopo
- criterios de conclusao
- dependencias

## Formato oficial das milestones

### Nome

Padrao recomendado:

```text
M<n> - <resultado>
```

Exemplos:

- `M1 - Core UX e Navegacao`
- `M2 - Onboarding e Ativacao`
- `M3 - Base Tecnica e Confianca`

### Descricao

A descricao da milestone deve responder:

- qual problema ela resolve
- o que entra
- o que fica de fora

### Regra

Nao usar milestone como deposito de backlog. Cada uma deve ser pequena o suficiente para ser acompanhada como um ciclo de entrega real.

## Formato oficial das issues

### Titulo

Usar Conventional Commits tambem no titulo da issue:

- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `test: ...`
- `docs: ...`
- `chore: ...`

Exemplos reais do projeto:

- `fix: consolidate authenticated home and legacy route behavior`
- `refactor: simplify primary app navigation`
- `feat: add first-run onboarding checklist`
- `test: add integration coverage for critical team and match flows`

### Corpo

Padrao oficial:

```md
## Objetivo
...

## Contexto
...

## Escopo
- ...
- ...
- ...

## Dependencias
- ...

## Criterios de conclusao
- ...
- ...
- ...
```

### Regras

- a issue deve ser compreensivel sem depender de conversa anterior
- o objetivo deve focar no resultado, nao na implementacao detalhada
- o escopo delimita o que entra
- criterios de conclusao definem quando parar
- dependencias explicam ordem e relacao com outras issues

## Labels oficiais do roadmap

### Tipo

- `type: feature`
- `type: fix`
- `type: refactor`
- `type: test`
- `type: docs`
- `type: chore`

### Area

- `area: navigation`
- `area: onboarding`
- `area: teams`
- `area: ranking`
- `area: profile`
- `area: infra`
- `area: docs`
- `area: quality`

### Prioridade

- `priority: p0` - atacar primeiro
- `priority: p1` - importante no curto prazo
- `priority: p2` - follow-up util, mas nao imediato

## Como escolher labels

### Type

- `feature`: adiciona ou expande capacidade percebida pelo usuario
- `fix`: corrige comportamento ou incoerencia
- `refactor`: reorganiza fluxo ou estrutura sem nova capacidade principal
- `test`: amplia validacao automatizada
- `docs`: alinha documentacao e fonte de verdade
- `chore`: manutencao, operacao ou infraestrutura

### Area

Aplicar a area dominante da issue. Se a issue tocar 2 dominios fortemente, pode receber 2 labels de area.

Exemplo:

- onboarding que mexe em fluxo de time: `area: onboarding` + `area: teams`

### Priority

- `p0`: destrava varias outras ou corrige a estrutura principal do produto
- `p1`: importante, mas depende de algum alinhamento previo ou vem logo depois do core
- `p2`: melhora operacional ou evolucao posterior

## Dependencias entre issues

As dependencias devem ser escritas no corpo da issue, em linguagem direta.

Padroes recomendados:

- `Nenhuma. Esta issue deve vir primeiro.`
- `Idealmente apos: #95`
- `Pode ser implementada em paralelo com: #98`
- `Desbloqueia: #99, #104`

## Regra de uso das dependencias

Use dependencias para explicitar:

- o que vem antes
- o que pode andar em paralelo
- o que esta sendo destravado

Nao usar dependencias para microgerenciar detalhes de implementacao.

## Ordem de execucao

A ordem recomendada deve seguir este criterio:

1. clareza estrutural do produto
2. ativacao do usuario
3. descoberta de valor ja existente
4. confianca tecnica e operacao

No ciclo atual, isso se reflete nas issues abertas por milestone no GitHub. Revise as issues `priority: p0` primeiro e depois siga para `p1` e `p2`.

## Fluxo de desenvolvimento a partir de uma issue

### Passo 1 - escolher a issue

Ao iniciar uma milestone, comecar pela issue com maior poder de destrave, normalmente uma `priority: p0`.

### Passo 2 - criar branch propria

Padrao:

```bash
git checkout master
git pull origin master
git checkout -b <tipo>/<nome-curto>
```

Exemplos:

```bash
git checkout -b fix/authenticated-home-routing
git checkout -b fix/95-authenticated-home-routing
```

Regra:

- 1 issue = 1 branch
- 1 branch = 1 objetivo principal

### Passo 3 - implementar apenas o escopo da issue

Antes de codar:

- ler os arquivos e docs diretamente relevantes
- confirmar o comportamento atual
- definir o comportamento alvo
- evitar puxar trabalho de outras issues da mesma milestone

### Passo 4 - validar o minimo necessario

Rodar a menor bateria de validacao que cubra a mudanca.

Consultar:

- `techspec/git-conventions.md`
- `.claude/rules/safe-change.md`
- `techspec/testing-strategy.md`

### Passo 5 - commit

Usar Conventional Commits:

```text
tipo: descricao curta
```

Exemplo:

```text
fix: consolidate authenticated home routing
```

### Passo 6 - abrir PR

O PR deve:

- apontar para `master`
- manter um unico objetivo
- referenciar a issue principal
- usar corpo em portugues com secoes:
  - `## O que muda`
  - `## Como testar`

Exemplo de fechamento automatico:

```md
Closes #95
```

## Regra pratica para proximas rodadas

Quando surgir um novo ciclo de planejamento:

1. revisar estado atual do produto e da base tecnica
2. agrupar em 2 a 5 milestones de resultado
3. quebrar milestones em issues pequenas e claras
4. aplicar labels de tipo, area e prioridade
5. escrever dependencias no corpo das issues
6. ordenar execucao pelos itens que mais destravam o resto
7. iniciar desenvolvimento por uma branch dedicada por issue

## O que evitar

- criar backlog paralelo em arquivo local quando o GitHub ja e a fonte de verdade
- misturar conteudo de planejamento com processo operacional
- abrir issues sem criterio de conclusao
- usar labels sem semantica clara
- iniciar implementacao sem branch propria
- atacar varias issues na mesma branch
- deixar dependencias apenas na cabeca de quem planejou

## Relacao com outros documentos

- as milestones e issues do GitHub definem o conteudo e as prioridades do trabalho futuro
- `git-conventions.md` define branch, commit, PR e release
- `github-operations.md` define checks obrigatorios e fluxo operacional do GitHub
