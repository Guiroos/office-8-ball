# Tech Spec - Authenticated Sidebar Layout

## Objetivo

Registrar a implementacao atual da area autenticada com layout compartilhado, sidebar persistente e menu de conta, preparada para suportar novas rotas sem espalhar navegacao e acoes de conta por cada pagina.

Esta spec registra a base implementada da shell autenticada, incluindo o ajuste local de paleta e contraste entre sidebar, menu do usuario e paginas renderizadas.

## Motivacao

Antes desta evolucao, o produto autenticado girava em torno de uma unica tela em `/scoreboard`. Isso funcionava para o v1 inicial, mas nao escalava bem para novas areas, porque:

- a navegacao ainda nao existe como shell do app
- acoes de conta e preferencias estao acopladas a tela da dashboard
- qualquer nova rota autenticada tenderia a repetir estrutura visual e controles globais

A implementacao atual entrega uma shell autenticada unica para o app, com:

- sidebar para navegacao principal do produto
- area de conteudo compartilhada entre paginas
- card do usuario no rodape da sidebar
- menu de conta para perfil, configuracoes, tema e logout

## Estado atual relevante

- `/login` e a entrada real de autenticacao
- `/dashboard` e a home autenticada oficial
- `/scoreboard` existe como rota legada com redirecionamento para `/dashboard`
- `middleware.ts` protege a area autenticada completa
- existe uma shell compartilhada em `src/app/(authenticated)/layout.tsx`
- `ThemeToggle` e `logout` vivem no menu do usuario da sidebar
- `Times`, `Ranking`, `Perfil` e `Configuracoes` existem como placeholders seguros

## Decisoes fechadas

- A home autenticada oficial e `/dashboard`
- `/scoreboard` continua existindo como rota legada com redirecionamento para `/dashboard`
- A sidebar vale para todas as rotas autenticadas atuais
- A navegacao principal da sidebar contem apenas areas de produto
- `Perfil`, `Configuracoes`, `Tema` e `Sair` ficam no menu do usuario, nao na navegacao principal
- Nesta fase, apenas `Dashboard` precisa estar funcional
- `Times` e `Ranking` existem hoje como placeholders seguros

## Escopo desta evolucao

Inclui:

- shell autenticada compartilhada no App Router
- sidebar principal da area logada
- dashboard atual consolidada em `/dashboard`
- compatibilidade de acesso mantida com `/scoreboard`
- card do usuario no rodape da sidebar
- menu de conta acionado pelo card do usuario
- placeholders minimos para rotas autenticadas adjacentes

Nao inclui:

- novo dominio de usuarios
- upload de avatar
- persistencia de preferencias do usuario
- ranking funcional novo
- CRUD real de times
- mudancas em contratos de API
- mudancas em schema Prisma
- RBAC ou papeis adicionais

## Estrutura de rotas atual

### Shell autenticada

O grupo autenticado atual no App Router e:

- `src/app/(authenticated)/layout.tsx`
- `src/app/(authenticated)/dashboard/page.tsx`
- `src/app/(authenticated)/times/page.tsx`
- `src/app/(authenticated)/ranking/page.tsx`
- `src/app/(authenticated)/profile/page.tsx`
- `src/app/(authenticated)/settings/page.tsx`

Beneficios atuais da estrutura:

- centralizar sidebar, area principal e controles globais
- evitar duplicacao de layout entre paginas autenticadas
- permitir evolucao incremental de novas areas sem refazer navegacao

### Fluxo de entrada

- `/` redireciona para `/dashboard` quando ha sessao
- `/` redireciona para `/login` quando nao ha sessao
- `/dashboard` e a entrada principal da experiencia autenticada
- `/scoreboard` redireciona para `/dashboard`

### Protecao de rotas

A protecao nao fica restrita a `/scoreboard`.

Implementacao atual:

- `middleware.ts` cobre a area autenticada completa
- paginas protegidas continuam reforcando validacao server-side de sessao
- `/login` permanece fora da shell autenticada
- o comportamento sem `DATABASE_URL` continua respeitando o modo atual em que auth fica indisponivel

## Sidebar principal

### Papel da sidebar

A sidebar deve representar navegacao de produto, e nao mistura de navegacao com conta do usuario.

Itens principais nesta fase:

- `Dashboard`
- `Times`
- `Ranking`

Itens fora da navegacao principal:

- `Perfil`
- `Configuracoes`
- `Alternar tema`
- `Sair`

### Comportamento esperado

- destacar o item ativo com base na rota atual
- manter ordem fixa dos itens
- permitir expansao futura sem reformular a estrutura
- funcionar em desktop e mobile sem duplicar logica de navegacao
- manter a area de conteudo com a atmosfera visual ja existente do app; a sidebar pode ter identidade propria sem forcar um novo fundo global
- usar uma coluna lateral compacta e continua, baseada em tokens proprios da shell para manter contraste consistente em claro e escuro, inspirada no prototipo de referencia em `.stitch/sidebar/sidebar.html`

### Comportamento mobile

No mobile, a sidebar colapsa para uma variante compacta, em formato de drawer lateral.

Requisitos:

- manter os mesmos itens e estado ativo
- preservar acesso ao menu do usuario
- nao criar uma navegacao separada com conteudo divergente

## Card do usuario e menu de conta

### Card do usuario

No rodape da sidebar, exibir um card persistente com:

- avatar ou fallback textual por inicial
- nome do usuario autenticado
- email completo ou abreviado

Esse card deve comunicar que existe uma area de conta acessivel por clique.
Na implementacao atual, o card usa a mesma familia visual da shell autenticada, com indicador simples de sessao ativa e tokens semanticos alinhados entre card, menu, hover, ativo e foco.

### Menu de conta

Ao clicar no card, abrir um menu ou popover com:

- `Ver perfil`
- `Configuracoes`
- `Alternar tema`
- `Sair`

### Regras do menu

- o menu concentra acoes de conta e preferencia global
- `ThemeToggle` vive no menu do usuario, e nao mais na dashboard
- `logout` vive no menu do usuario, e nao mais na dashboard
- `Perfil` e `Configuracoes` existem hoje como placeholders seguros antes de ganharem conteudo real

## Dashboard dentro da nova shell

### Papel de `/dashboard`

`/dashboard` reutiliza a experiencia atual do scoreboard como ponto de partida.

Nesta fase:

- o conteudo atual de placar, historico e registro de vitoria e preservado
- a mudanca principal e estrutural, nao de dominio
- o foco foi encaixar a tela dentro da nova shell autenticada

### Compatibilidade

- a dashboard continua consumindo `/api/scoreboard` e `/api/matches`
- o fluxo de registrar vitoria continua sem update otimista
- o placar continua derivado de `matches`
- os unicos times validos continuam sendo `frontend` e `backend`

## Rotas placeholder atuais

### `Times`

Hoje existe como placeholder seguro, com mensagem curta deixando claro que a area ainda nao foi expandida funcionalmente.

### `Ranking`

Hoje existe como placeholder seguro, sem criar ranking real nem novos calculos de dominio nesta fase.

### `Perfil`

E acessivel pelo menu do usuario e hoje existe como pagina minima baseada nos dados da sessao atual, sem perfil persistido extra.

### `Configuracoes`

E acessivel pelo menu do usuario e hoje existe como pagina minima, sem sistema completo de preferencias.

## APIs e contratos

Nenhuma mudanca de API e necessaria nesta fase.

Continuam iguais:

- `GET /api/scoreboard`
- `GET /api/matches`
- `POST /api/matches`
- `POST /api/auth/register`

Tambem permanecem iguais:

- tipos de dominio do placar
- invariantes de `leaderTeamId`, `leadBy` e `currentStreak`
- validacao de `winnerTeamId`
- suporte opcional a `note`

## Impactos em codigo

Areas centrais da implementacao atual:

- `src/app/(authenticated)/layout.tsx`
- `src/app/page.tsx`
- `src/app/scoreboard/page.tsx`
- `src/components/authenticated/app-shell.tsx`
- `src/components/dashboard/index.tsx`
- `middleware.ts`

Artefatos introduzidos:

- layout autenticado compartilhado
- componente de sidebar
- componente de card/menu do usuario
- paginas placeholder autenticadas adjacentes

## Regras de UX

- navegacao principal deve permanecer simples e curta
- acoes de conta nao devem competir visualmente com as areas do produto
- o usuario precisa conseguir entender rapidamente onde esta e para onde pode ir
- placeholders devem parecer honestos, sem prometer funcionalidade pronta
- a shell deve respeitar a linguagem visual atual do app
- a shell deve manter contraste suficiente entre navegacao, conteudo e estados interativos em claro e escuro

## Riscos e cuidados

- nao transformar a shell em pretexto para expandir dominio cedo demais
- nao quebrar a compatibilidade de acesso atual a `/scoreboard`
- nao duplicar protecao de rota de forma inconsistente entre middleware e paginas
- nao mover controles globais de forma que piore usabilidade no mobile
- nao introduzir itens de navegacao que levem a erro ou tela vazia sem contexto

## Testes e cenarios de aceitacao

### Navegacao e autenticacao

- usuario autenticado acessa `/` e e redirecionado para `/dashboard`
- usuario nao autenticado acessa rota protegida e e redirecionado para `/login`
- `/scoreboard` redireciona para `/dashboard`
- a sidebar aparece em todas as rotas autenticadas previstas

### Sidebar

- o item ativo acompanha o pathname atual
- a navegacao principal exibe apenas `Dashboard`, `Times` e `Ranking`
- `Perfil` e `Configuracoes` nao aparecem como itens principais da sidebar
- sidebar, menu do usuario e drawer mobile usam a mesma familia de tokens da shell autenticada

### Menu do usuario

- o card do usuario renderiza nome e identificacao basica
- o clique no card abre e fecha o menu corretamente
- o menu exibe `Ver perfil`, `Configuracoes`, `Alternar tema` e `Sair`
- `logout` continua funcional a partir do menu
- os estados de hover, ativo e foco permanecem legiveis em claro e escuro

### Dashboard migrada

- `/dashboard` continua registrando vitorias normalmente
- o registro de vitoria ainda dispara refetch de scoreboard e matches
- historico recente continua exibindo `note` quando presente
- o dominio do scoreboard continua suportando Prisma e fallback em memoria, sem reabrir a dashboard autenticada quando nao ha sessao real

### Mobile

- a navegacao colapsada permanece utilizavel
- o menu do usuario continua acessivel
- a area de conteudo principal nao perde legibilidade
- o drawer mobile preserva a mesma paleta e contraste da sidebar desktop

## Validacao recomendada

- `npm run test -- src/components/dashboard.test.tsx`
- `npm run test -- src/components/login/login-screen.test.tsx`
- `npm run test -- src/app/api/scoreboard/route.test.ts`
- `npm run test -- src/app/api/matches/route.test.ts`
- `npm run typecheck`

## Assumptions e defaults

- `Dashboard` e a nomenclatura oficial da home autenticada
- `/scoreboard` e rota legada compatível por redirecionamento
- a sidebar serve para produto; o menu do usuario serve para conta
- avatar pode comecar como fallback textual, sem upload
- `Times` e `Ranking` permanecem placeholders sem efeito em dominio
- `Perfil` e `Configuracoes` permanecem leves, sem exigir schema ou API nova
- ajustes finos de cor e contraste devem preferir tokens da shell e de superficies antes de overrides locais
- a documentacao correlata deve ser atualizada sempre que a implementacao mudar o comportamento real
