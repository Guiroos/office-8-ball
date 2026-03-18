# Tech Spec - Theme System

## Arquitetura atual

- Tokens globais em `src/app/globals.css` com Tailwind v4 via `@theme inline`
- Provider em `src/components/theme/theme-provider.tsx`: estado, persistência e sincronização com sistema
- Script inline em `src/app/layout.tsx` evita flash de tema errado antes da hidratação
- `useTheme()` é estrito: falha explicitamente fora de `ThemeProvider`
- Lógica de resolve centralizada em helper compartilhado entre provider, testes e script de bootstrap
- Estratégia `system` por padrão com persistência local

## Tokens

### Categorias em `globals.css`

- **Foundation:** radius, shadow, font, display/label sizes
- **Semantic surfaces:** `surface`, `surface-emphasis`, `surface-strong`
- **Brand/team:** `--frontend-soft`, `--backend-soft` e variantes por estado de liderança
- **Shell autenticada:** `--app-shell-sidebar`, `--app-shell-sidebar-hover`, `--app-shell-sidebar-active`
- **Composition:** `--hero-gradient`, `--brand-gradient`, `--page-gradient` — convivem com foundations no mesmo arquivo (aceitável no volume atual)

## Primitives

- `Button`, `Card`, `Badge` consomem tokens semânticos
- `src/components/ui/*` inclui `SectionHeader`, `StatTile`, `IconCallout`, `SurfacePanel` — padrões recorrentes de composição global
- `TeamScoreCard` usa variantes por time e estado de liderança; expõe `data-team` e `data-leader` para testes

## Regras

- Preferir tokens semânticos antes de introduzir classes de cor por componente
- Manter `useTheme()` estrito em qualquer novo componente de tema
- Reutilizar a escala de `radius`, `shadow` e `type` antes de introduzir novos valores soltos
- Ajustes finos de cor e contraste devem preferir tokens da shell antes de overrides locais

## Próximos passos

- Separar tokens de composição (`--hero-gradient` etc.) em grupo próprio se o volume crescer
- Extrair o controle segmentado `Entrar / Criar conta` como primitive reutilizável quando surgir mais de um fluxo que precise dele
