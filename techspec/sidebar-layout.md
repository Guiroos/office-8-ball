# Tech Spec - Authenticated Shell Layout

## Estado atual

- `/dashboard` é a home autenticada oficial
- `/scoreboard` existe como rota legada com redirecionamento para `/dashboard`
- `middleware.ts` protege a área autenticada completa
- Shell compartilhada em `src/app/(authenticated)/layout.tsx`
- `ThemeToggle` e `logout` vivem no menu do usuário da sidebar
- `Times`, `Ranking`, `Perfil` e `Configurações` existem como placeholders

## Estrutura de rotas

```
src/app/(authenticated)/
  layout.tsx           ← shell compartilhada (sidebar + área de conteúdo)
  dashboard/page.tsx   ← home autenticada funcional
  times/page.tsx       ← placeholder
  ranking/page.tsx     ← placeholder
  profile/page.tsx     ← placeholder (dados da sessão atual)
  settings/page.tsx    ← placeholder
```

## Componentes centrais

- `src/components/authenticated/app-shell.tsx` — sidebar + layout
- `src/app/page.tsx` — redireciona por estado de sessão
- `src/app/scoreboard/page.tsx` — redirecionamento legado para `/dashboard`

## Sidebar

- Navegação principal: `Dashboard`, `Times`, `Ranking`
- Menu do usuário (rodapé): `Ver perfil`, `Configurações`, `Alternar tema`, `Sair`
- Item ativo baseado no pathname atual
- Mobile: drawer lateral com mesmos itens e acesso ao menu do usuário
- Tokens visuais próprios da shell em `globals.css` (`--app-shell-sidebar`, `--app-shell-sidebar-hover`, `--app-shell-sidebar-active`)

## Decisões fechadas

- Navegação principal é para produto; ações de conta ficam no menu do usuário
- Avatar inicia como fallback textual por inicial, sem upload
- `Times` e `Ranking` permanecem placeholders sem efeito no domínio
- Proteção de rota não se restringe a um único ponto: `middleware.ts` + server-side em `layout.tsx`

## Invariantes

- Não duplicar proteção de rota de forma inconsistente entre middleware e páginas
- Não quebrar o redirecionamento legado de `/scoreboard`
- Novos itens de navegação principal só entram quando a rota tiver conteúdo real
