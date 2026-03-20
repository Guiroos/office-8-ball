# Tech Spec - Theme System

## Arquitetura atual

- Dois arquivos de tokens:
  - `src/app/tokens.css` — Tier 1: escalas de cores brutas, shadow values, font sizes, e literais de surface/border/gradient/app-shell
  - `src/app/globals.css` — Tier 2-3: tokens semânticos e aliases de componentes; importa tokens.css e usa apenas referências `var()`
  - Regra: literais em tokens.css; referências `var()` em globals.css
- Tailwind v4 em três camadas:
  - `@theme {}` — tokens estáticos (radius, tracking, font families); gera classes nativas (`rounded-xl`, `tracking-label`, `font-display`)
  - `@theme inline {}` — mapeia variáveis semânticas para classes Tailwind (`bg-surface`, `text-foreground`, `shadow-brand`, etc.)
  - `:root` / `.dark` — aliases do shadcn/ui
- Utilitários de tipografia via `@utility`: escala de 10 papéis — `display`, `headline`, `title`, `subtitle`, `body`, `body-sm`, `label`, `label-sm`, `label-wide`, `caption`
- Provider em `src/components/theme/theme-provider.tsx`: estado, persistência e sincronização com sistema
- Script inline em `src/app/layout.tsx` evita flash de tema errado antes da hidratação
- `useTheme()` é estrito: falha explicitamente fora de `ThemeProvider`
- Lógica de resolve centralizada em helper compartilhado entre provider, testes e script de bootstrap
- Estratégia `system` por padrão com persistência local
- shadcn/ui instalado (`components.json`); componentes base em `src/components/ui/`

## Tokens

### Categorias em `globals.css`

- **Foundation (estáticos em `@theme`):** radius (`--radius-sm` → `--radius-pill`), tracking (`--tracking-label`, `--tracking-label-wide`), font families (`--font-body`, `--font-display`)
- **Foundation (em `:root`):** shadow values (`--shadow-sm-value` etc.), font sizes (`--fz-label`, `--fz-title`, `--fz-display`, etc.) — prefixo `--fz-*` evita colisão com o namespace `--text-*` do Tailwind v4
- **Semantic surfaces:** `surface`, `surface-emphasis`, `surface-strong`
- **Brand/team:** `--team-alpha`, `--team-alpha-soft`, `--team-beta`, `--team-beta-soft` e variantes por estado de liderança
- **Shell autenticada:** `--app-shell-sidebar`, `--app-shell-sidebar-hover`, `--app-shell-sidebar-active`
- **shadcn aliases:** `--primary`, `--card`, `--popover`, `--accent`, `--destructive`, `--input` — apontam para tokens existentes, sem duplicar valores
- **Composition:** `--hero-gradient`, `--brand-gradient`, `--page-gradient` — convivem com foundations no mesmo arquivo (aceitável no volume atual)

## Primitives

- `src/components/ui/*` — componentes base shadcn/ui com variantes CVA customizadas: `Button`, `Card`, `Badge`, `Input`, `Label`, `Separator`, `ScrollArea`
- `src/components/primitives/*` — padrões de composição específicos do domínio: `SectionHeader`, `StatTile`, `IconCallout`, `Field`, `FieldError`
- `Card` absorve os casos de uso de `SurfacePanel` via variantes (`default`, `muted`, `strong`, `brand`)
- `TeamScoreCard` usa variantes por time e estado de liderança; expõe `data-team` e `data-leader` para testes

## Regras

- Preferir tokens semânticos antes de introduzir classes de cor por componente
- Usar classes nativas (`rounded-xl`, `shadow-brand`) em vez de `[var(--...)]` arbitrários — os tokens já estão mapeados em `@theme` / `@theme inline`
- Novos componentes shadcn instalar via `npx shadcn@latest add <componente>` e sobrescrever variantes conforme o padrão dos existentes
- Manter `useTheme()` estrito em qualquer novo componente de tema
- Reutilizar a escala de `radius`, `shadow` e `type` antes de introduzir novos valores soltos
- Ajustes finos de cor e contraste devem preferir tokens da shell antes de overrides locais

## Próximos passos

- Separar tokens de composição (`--hero-gradient` etc.) em grupo próprio se o volume crescer
