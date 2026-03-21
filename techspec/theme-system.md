# Tech Spec - Theme System

## Arquitetura atual

Dois arquivos, dois papéis:

| Arquivo | Papel | Regra |
|---------|-------|-------|
| `src/app/tokens.css` | Tier 1 — primitivos brutos | Apenas valores literais: hex, rgba, clamp(), strings de sombra |
| `src/app/globals.css` | Tier 2/3 — aliases semânticos + Tailwind | Apenas `var()` apontando para tokens.css |

Nenhuma exceção. Literal em `globals.css` é bug.

Tailwind v4 em três camadas:

- `@theme {}` — tokens estáticos (radius, tracking, font families); gera classes nativas (`rounded-xl`, `tracking-label`, `font-display`)
- `@theme inline {}` — mapeia variáveis semânticas para classes Tailwind (`bg-surface`, `text-foreground`, `shadow-sm`, etc.)
- `:root` / `.dark` — aliases do shadcn/ui

Outros:

- Provider em `src/components/theme/theme-provider.tsx`: estado, persistência e sincronização com sistema
- Script inline em `src/app/layout.tsx` evita flash de tema errado antes da hidratação
- `useTheme()` é estrito: falha explicitamente fora de `ThemeProvider`
- Lógica de resolve centralizada em helper compartilhado entre provider, testes e script de bootstrap
- Estratégia `system` por padrão com persistência local
- shadcn/ui instalado (`components.json`); componentes base em `src/components/ui/`

## Tokens

### Categorias em `globals.css`

- **Foundation (estáticos em `@theme`):** radius (`--radius-xs` → `--radius-pill`), tracking (`--tracking-label`, `--tracking-label-wide`), font families (`--font-body`, `--font-display`), scale (`--scale-98`)
- **Foundation (em `:root`):** shadow values (`--shadow-xs-value` → `--shadow-xl-value`), font sizes (`--fz-label`, `--fz-title`, `--fz-display`, etc.) — prefixo `--fz-*` evita colisão com o namespace `--text-*` do Tailwind v4
- **Semantic surfaces:** `surface`, `surface-muted`, `surface-emphasis`, `surface-strong`, `surface-strong-muted`
- **Backgrounds:** `background`, `background-subtle`, `background-strong`
- **Brand/team:** `--team-alpha`, `--team-alpha-light`, `--team-alpha-soft`, `--team-beta`, `--team-beta-light`, `--team-beta-soft` — todos com overrides de dark mode (alpha/beta ficam mais claros em dark para manter contraste)
- **Shell autenticada:** tokens com prefixo `--app-shell-sidebar-*` em tokens.css; mapeados como `--color-sidebar-*` em `@theme inline` para classes Tailwind `sidebar-*`
- **shadcn aliases:** `--primary`, `--card`, `--popover`, `--accent`, `--destructive`, `--input` — apontam para tokens existentes, sem duplicar valores
- **Composition:** `--hero-gradient`, `--brand-gradient`, `--page-gradient` — convivem com foundations no mesmo arquivo (aceitável no volume atual)

### Escala de sombras

Sistema de duas camadas (key light + ambient) em `tokens.css`. Todos os valores usam `var(--tw-shadow-color, rgba(0,0,0,N))` — composição de cor via classe Tailwind separada:

| Token | Blur | Uso típico |
|-------|------|------------|
| `shadow-xs` | 1px | Elevação mínima, active/press |
| `shadow-sm` | 3px | Cards, botões em repouso |
| `shadow-md` | 8px | Hover, ícones destacados |
| `shadow-lg` | 16px | Dropdowns, popovers |
| `shadow-xl` | 28px | Overlays, drawers mobile |

**Composição:** `shadow-sm shadow-gold/35` — tamanho e cor são classes independentes. O modificador de opacidade (`/N`) é obrigatório ao usar cores semânticas — sólidas resultam em sombras saturadas demais.

**Opacidades calibradas por variante:**

| Cor de sombra | Opacidade |
|---------------|-----------|
| `shadow-gold` | `/35` |
| `shadow-team-alpha` | `/30` |
| `shadow-team-beta` | `/28` |

**Mapeamento de estados interativos:**

| Estado | Tamanho |
|--------|---------|
| repouso | `shadow-sm` |
| hover | `shadow-md` |
| active/press | `shadow-xs` |

**Por que composição e não tokens nomeados por componente?**
Tokens como `shadow-brand` ou `shadow-sidebar-menu` criam acoplamento entre token e componente. A escala primitiva + modificador de cor cobre todos os casos sem proliferação de tokens.

**Por que `/35` e não `shadow-gold` sólido?**
`--color-gold` é calibrado para texto e backgrounds. Como cor de sombra sólida resulta em saturação excessiva. O modificador de opacidade Tailwind v4 (`/N`) corrige isso sem criar tokens adicionais.

### Escala de radius

Definida em `@theme {}`, gera classes `rounded-{size}`:

```
xs: 12px   sm: 18px   md: 20px
lg: 22px   xl: 28px   2xl: 32px   pill: 999px
```

> Backlog: A progressão xs→sm→md→lg não é linear (12→18→20→22). Revisar quando houver necessidade de novo componente com radius intermediário.

### Utilitários globais (`@utility`)

Definidos em `globals.css` para valores compostos que não têm classe nativa no Tailwind:

| Classe | Uso |
|--------|-----|
| `bg-gold-gradient` | Gradiente dourado dos botões padrão |
| `bg-brand-gradient` | Fundo da identidade da marca (sidebar brand icon, etc.) |
| `bg-content-gradient` | Gradiente sutil da área de conteúdo |
| `bg-avatar-gradient` | Overlay do avatar na sidebar |
| `transition-interactive` | `transform + box-shadow + background-color + opacity` em 150ms ease-out |

## Primitives

- `src/components/ui/*` — componentes base shadcn/ui com variantes CVA customizadas: `Button`, `Card`, `Badge`, `Input`, `Label`, `Separator`, `ScrollArea`
- `src/components/primitives/*` — padrões de composição específicos do domínio: `SectionHeader`, `StatTile`, `IconCallout`, `Field`, `FieldError`
- `Card` absorve os casos de uso de `SurfacePanel` via variantes (`default`, `muted`, `strong`, `brand`)
- `TeamScoreCard` usa variantes por time e estado de liderança; expõe `data-team` e `data-leader` para testes

## Regras

- Preferir tokens semânticos antes de introduzir classes de cor por componente
- Usar classes nativas (`rounded-xl`, `shadow-sm shadow-gold/35`) em vez de `[var(--...)]` arbitrários — os tokens já estão mapeados em `@theme` / `@theme inline`
- Sombras: compor tamanho (`shadow-xs/sm/md/lg/xl`) + cor com opacidade (`shadow-gold/35`, `shadow-team-alpha/30`) como classes separadas — não criar tokens `shadow-brand` ou similares por componente
- Novos componentes shadcn instalar via `npx shadcn@latest add <componente>` e sobrescrever variantes conforme o padrão dos existentes
- Manter `useTheme()` estrito em qualquer novo componente de tema
- Reutilizar a escala de `radius`, `shadow` e `type` antes de introduzir novos valores soltos
- Ajustes finos de cor e contraste devem preferir tokens da shell antes de overrides locais

## Acessibilidade

```css
@media (prefers-reduced-motion: reduce) {
  button { transition: none; transform: none; }
}
```

Definido globalmente em `globals.css`. Novos componentes interativos que usam `transition-interactive` ou transforms são cobertos automaticamente — sem necessidade de override por componente.

## Backlog

- **Prefixo interno app-shell:** tokens `--app-shell-sidebar-*` em `tokens.css` usam prefixo `app-shell-` internamente, mas as classes Tailwind já expõem `sidebar-*` via `--color-sidebar-*` em `@theme inline`. O prefixo é cosmético e não afeta o uso — candidato a renomear em refactor futuro.
- **Letter-spacing semântico:** `tracking-label-sm / tracking-label / tracking-label-wide` descrevem uso (label), não valor. Funcional para o volume atual; revisar se novos componentes precisarem de tracking fora do contexto de labels.
- **Radius não-linear:** progressão xs→sm→md→lg é 12→18→20→22px (não uniforme). Revisar se surgir necessidade de radius intermediário.
