# Design Spec — Theme Token Restructure

**Date:** 2026-03-19
**Status:** Approved
**Scope:** CSS theme layer only — domain team IDs (`"frontend"`, `"backend"`) unchanged

---

## Problem

The current `globals.css` has three issues:

1. **`--primary` aponta para texto, não para a cor de ação.** `--primary: var(--foreground)` significa que componentes shadcn (Button primary, etc.) usam a cor de texto escuro como cor de ação — semanticamente incorreto.
2. **Tokens de cor acoplados aos nomes dos times.** `--frontend`, `--backend`, `--frontend-soft`, `--backend-soft` misturam domínio de negócio com design system. Se a aplicação evoluir para times customizáveis, o CSS quebra conceitualmente.
3. **Primitivos e semânticos convivem misturados em `:root`.** Valores hex brutos, aliases semânticos e tokens de componente ficam no mesmo escopo sem separação clara.

---

## Decisões

- **Abordagem:** separar primitivos em `tokens.css`; semânticos e componentes ficam em `globals.css`
- **Escala de cores:** completa (50–950) para cada paleta — verde, azul, vermelho, gold, neutros quentes
- **`--primary`:** aponta para o verde da aplicação (desvinculado dos times)
- **Times:** tokens genéricos `--team-alpha` (azul sutil) e `--team-beta` (vermelho sutil) como fallback
- **CVA variants:** renomear `frontend`/`backend` → `team-alpha`/`team-beta` em button e badge
- **IDs de domínio:** `"frontend"` e `"backend"` em `src/lib/constants.ts` e banco **não mudam** nesta spec

---

## Arquitetura de Arquivos

```
src/app/
  tokens.css     ← TIER 1: escala de cores brutas (apenas hex/rgb/valores literais)
  globals.css    ← TIER 2 + 3: semânticos e componentes (apenas var(), nunca hex direto)
```

**Regra de ouro:**
- Valor literal (`#166657`, `rgba(...)`, `0 20px 45px ...`) → `tokens.css`
- Referência a outro token (`var(--green-700)`) → `globals.css`

`globals.css` importa `tokens.css`:
```css
@import "./tokens.css";
```

---

## Tier 1 — Escala de Primitivos (`tokens.css`)

Cada paleta com escala completa 50–950. Só valores que existem no CSS atual são definidos — a escala é preenchida com valores interpolados consistentes.

### Paletas

**Green** — identidade da aplicação
```css
--green-50 → --green-950
/* âncoras atuais: --green-100 ≈ #d2e9e0, --green-700 = #166657 */
```

**Blue** — fallback cor do time alpha
```css
--blue-50 → --blue-950
/* âncora principal light: --blue-700 = azul sutil/dessaturado (~#2a5f9c) */
/* âncora principal dark:  --blue-400 = azul mais claro (~#5b9bd5) */
```

> **Nota de dark mode:** O token atual `--frontend` em dark mode é teal (`#3fc49d`), não azul. A migração para `--team-alpha` → blue é uma **mudança visual intencional** em dark mode — o time alpha passa de teal para azul. Isso foi decidido durante o brainstorming.

**Red** — fallback cor do time beta
```css
--red-50 → --red-950
/* âncora light: --red-700 = #9f3d31 (atual --backend) */
/* âncora dark:  --red-400 = vermelho sutil mais claro (~#d86f61) */
```

**Gold** — destaques, rings, ícones
```css
--gold-50 → --gold-950
/* âncora atual: --gold-500 = #c7951f */
```

**Warm Neutral** — backgrounds, foregrounds, superfícies
```css
--neutral-50 → --neutral-950
/* âncoras atuais: light #f1e8d8 → dark #07110d */
```

Além das paletas de cor, `tokens.css` também centraliza os shadow values e font sizes brutos que hoje vivem em `:root`.

---

## Tier 2 — Tokens Semânticos (`:root` / `.dark` em `globals.css`)

### Correção crítica: `--primary`

```css
/* antes */
--primary: var(--foreground);

/* depois */
--primary: var(--green-700);
--primary-foreground: var(--foreground-inverse);
```

### Tokens de time (renomeação)

| Antes | Depois |
|---|---|
| `--frontend` | `--team-alpha` → `var(--blue-700)` |
| `--frontend-soft` | `--team-alpha-soft` → `var(--blue-100)` |
| `--backend` | `--team-beta` → `var(--red-700)` |
| `--backend-soft` | `--team-beta-soft` → `var(--red-100)` |

Esses tokens servem como **fallback de cor**. Quando times customizáveis forem implementados, a cor do time virá de dados — esses valores continuam como padrão para quando não há cor definida.

### Tokens mantidos sem mudança

Todos os outros tokens semânticos existentes são mantidos:
- `--background`, `--foreground`, `--muted-foreground`
- `--surface-*`, `--border-*`, `--ring`
- `--gold`, `--gold-soft`, `--danger`
- `--app-shell-*`
- Gradients (`--hero-gradient`, `--brand-gradient`, `--page-gradient`)
- Aliases shadcn (`--card`, `--popover`, `--accent`, `--destructive`, `--input`, `--secondary`)

---

## Tier 3 — Tokens de Componente e Classes Tailwind

### Classes geradas via `@theme inline`

Adicionadas ao mapeamento existente:
```css
--color-team-alpha: var(--team-alpha);
--color-team-alpha-soft: var(--team-alpha-soft);
--color-team-beta: var(--team-beta);
--color-team-beta-soft: var(--team-beta-soft);
```

Isso gera as classes: `bg-team-alpha`, `text-team-alpha`, `border-team-alpha`, `bg-team-alpha-soft`, `bg-team-beta`, `text-team-beta`, `border-team-beta`, `bg-team-beta-soft`.

As classes `bg-frontend`, `bg-frontend-soft`, `bg-backend`, `bg-backend-soft`, `text-frontend`, `text-backend`, `border-frontend`, `focus:ring-frontend-soft` são removidas.

---

## Impacto em Componentes

### `src/lib/constants.ts`

Os campos `accent` e `accentSoft` nos objetos de time referenciam CSS vars por nome. Devem ser atualizados para as novas vars — os IDs de domínio (`id`, `name`, `displayName`) não mudam:

```ts
// antes
{ id: "frontend", ..., accent: "var(--frontend)", accentSoft: "var(--frontend-soft)" }
{ id: "backend",  ..., accent: "var(--backend)",  accentSoft: "var(--backend-soft)"  }

// depois
{ id: "frontend", ..., accent: "var(--team-alpha)", accentSoft: "var(--team-alpha-soft)" }
{ id: "backend",  ..., accent: "var(--team-beta)",  accentSoft: "var(--team-beta-soft)"  }
```

### `src/components/ui/button.tsx`
```tsx
// antes
variant="frontend"  →  "bg-frontend text-foreground-inverse ..."
variant="backend"   →  "bg-backend text-foreground-inverse ..."

// depois
variant="team-alpha"  →  "bg-team-alpha text-foreground-inverse ..."
variant="team-beta"   →  "bg-team-beta text-foreground-inverse ..."
```

### `src/components/ui/badge.tsx`
```tsx
// antes
variant="frontend"  →  "border-frontend bg-frontend-soft text-frontend"
variant="backend"   →  "border-backend bg-backend-soft text-backend"

// depois
variant="team-alpha"  →  "border-team-alpha bg-team-alpha-soft text-team-alpha"
variant="team-beta"   →  "border-team-beta bg-team-beta-soft text-team-beta"
```

### `src/components/dashboard/index.tsx`

**`teamScoreCardVariants` (background do card):**
```tsx
// antes
frontend: "bg-frontend-soft"
backend:  "bg-backend-soft"

// depois
frontend: "bg-team-alpha-soft"   // chave do domínio mantida
backend:  "bg-team-beta-soft"
```

**`teamScoreBadgeVariants` (badge de pontuação):**
```tsx
// antes
frontend: "bg-frontend"
backend:  "bg-backend"

// depois
frontend: "bg-team-alpha"
backend:  "bg-team-beta"
```

**`Button variant={team.id}` — mapeamento necessário:**

Após renomear os CVA variants de `button.tsx`, o prop `variant={team.id}` passará `"frontend"` ou `"backend"` para um Button que não tem mais essas variantes — TypeScript error e regressão visual. É necessário um mapa de tradução:

```tsx
const TEAM_BUTTON_VARIANT = {
  frontend: "team-alpha",
  backend:  "team-beta",
} as const;

// uso
<Button variant={TEAM_BUTTON_VARIANT[team.id as keyof typeof TEAM_BUTTON_VARIANT]} ...>
```

**Foco no textarea:**
```tsx
// antes
focus:border-frontend focus:ring-2 focus:ring-frontend-soft

// depois
focus:border-team-alpha focus:ring-2 focus:ring-team-alpha-soft
```

### `src/components/ui/input.tsx`
```tsx
// estado normal (antes)
focus:border-frontend focus:ring-2 focus:ring-frontend-soft

// estado normal (depois)
focus:border-primary focus:ring-2 focus:ring-team-alpha-soft

// estado inválido (antes)
border-danger focus:border-danger focus:ring-2 focus:ring-backend-soft

// estado inválido (depois)
border-danger focus:border-danger focus:ring-2 focus:ring-team-beta-soft
```

### `src/components/primitives/icon-callout.tsx`
```tsx
// antes
tone === "success" && "bg-surface text-frontend"

// depois
tone === "success" && "bg-surface text-primary"
```

### `src/components/authenticated/placeholder-page.tsx`
```tsx
// antes
className="... bg-frontend ..."

// depois
className="... bg-primary ..."
```

### `src/components/login/login-screen.tsx`
```tsx
// botão de segmento ativo (antes)
"bg-frontend text-foreground-inverse shadow-sm"

// botão de segmento ativo (depois)
"bg-primary text-primary-foreground shadow-sm"

// div de erro (antes)
border-backend-soft bg-surface-danger ... text-danger

// div de erro (depois)
border-team-beta-soft bg-surface-danger ... text-danger
```

---

## Arquivos Alterados

| Arquivo | Tipo de mudança |
|---|---|
| `src/app/tokens.css` | Criado — escala de primitivos |
| `src/app/globals.css` | Atualizado — import, remoção de hex, correção de --primary, renomeação de tokens |
| `src/components/ui/button.tsx` | CVA variant renomeada |
| `src/components/ui/badge.tsx` | CVA variant renomeada |
| `src/components/ui/input.tsx` | Classes CSS atualizadas |
| `src/components/dashboard/index.tsx` | Mapeamento de classes atualizado |
| `src/components/primitives/icon-callout.tsx` | Classe CSS atualizada |
| `src/components/authenticated/placeholder-page.tsx` | Classe CSS atualizada |
| `src/components/login/login-screen.tsx` | Classes CSS atualizadas |
| `src/lib/constants.ts` | `accent` e `accentSoft` atualizados para `var(--team-alpha)` / `var(--team-beta)` |
| `techspec/theme-system.md` | Atualizado para refletir nova arquitetura |

---

## Fora de Escopo

- IDs de domínio dos times (`"frontend"`, `"backend"`) em banco, seed e testes — os IDs em `src/lib/constants.ts` não mudam, mas os campos `accent`/`accentSoft` **são** atualizados nesta spec pois referenciam CSS vars
- Multi-team / times customizáveis
- Mudanças em rotas, API ou autenticação
- Novos componentes ou variantes além das existentes

---

## Critérios de Sucesso

1. `globals.css` não contém nenhum valor hex ou rgb literal — todos em `tokens.css`
2. `--primary` aponta para o verde da aplicação
3. Nenhuma referência a `--frontend` ou `--backend` existe fora de `tokens.css` (onde não existem)
4. Classes `bg-frontend`, `text-frontend`, `bg-backend`, `text-backend` não existem mais
5. Build passa (`npm run build`)
6. Typecheck passa (`npm run typecheck`)
7. Testes passam (`npm run test`)
8. Visualmente, a UI permanece idêntica ao estado anterior
