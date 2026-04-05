# Tech Spec - Authenticated Shell Layout

## Estado atual

- `/times` e a entrada autenticada principal atual
- `/dashboard` e `/scoreboard` existem como rotas legadas com redirecionamento para `/times`
- `proxy.ts` protege a area autenticada no nivel de roteamento
- shell compartilhada em `src/app/(authenticated)/layout.tsx`
- `ThemeToggle` e `logout` vivem no menu do usuario da sidebar
- `times`, `ranking` e `profile` ja sao rotas funcionais
- `/settings` continua placeholder

## Estrutura de rotas

```text
src/app/(authenticated)/
  layout.tsx           ← shell compartilhada (sidebar + area de conteudo)
  dashboard/page.tsx   ← legado, redireciona para /times
  times/page.tsx       ← home autenticada atual
  ranking/page.tsx     ← pagina funcional de ranking
  profile/page.tsx     ← pagina funcional de perfil
  settings/page.tsx    ← placeholder
```

## Componentes centrais

- `src/components/authenticated/app-shell.tsx` — sidebar + layout
- `src/app/page.tsx` — redireciona por estado de sessao
- `src/app/(authenticated)/dashboard/page.tsx` — redirecionamento legado para `/times`
- `src/app/scoreboard/page.tsx` — redirecionamento legado para `/times`

## Sidebar

- navegacao principal: `Times`, `Ranking`, `Partida`
- menu do usuario: `Ver perfil`, `Alternar tema`, `Sair`
- item ativo baseado no pathname atual
- mobile: drawer lateral com os mesmos itens
- tokens visuais proprios da shell vivem em `globals.css`

## Decisoes fechadas

- navegacao principal e para fluxo de produto; acoes de conta ficam no menu do usuario
- avatar usa fallback textual quando nao ha imagem
- so `/settings` segue como placeholder visivel
- protecao de rota nao se restringe a um unico ponto: `proxy.ts` + server-side em `layout.tsx`

## Invariantes

- nao quebrar o redirecionamento legado de `/dashboard` e `/scoreboard`
- novos itens de navegacao principal so entram quando a rota tiver conteudo real
- manter consistencia entre a navegacao da sidebar e o comportamento real das rotas autenticadas
