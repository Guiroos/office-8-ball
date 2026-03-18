# Design System Redesign — office-8-ball

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Refactor the styling architecture, migrate to shadcn/ui, and establish a clear component grammar.

---

## Context

The current design system uses Tailwind v4 with CSS custom properties for tokens. The token system is well-structured semantically, but the way tokens are consumed produces verbose, hard-to-read class strings throughout the codebase. Additionally, `components/ui/` mixes shadcn-style base components with domain-specific primitives, and `Card` and `SurfacePanel` overlap in purpose with no clear rule for when to use each.

**Main pain points:**
- Arbitrary values everywhere: `rounded-[var(--radius-xl)]`, `shadow-[var(--shadow-lg)]`, `text-[length:var(--text-label-sm)]`
- Typography patterns copy-pasted across 6+ components
- Two container components (`Card`, `SurfacePanel`) with overlapping concerns and no clear guidance
- No separation between shadcn-managed files and project-custom files

---

## Decision

Adopt **shadcn/ui + custom token mapping** as the component foundation:

- shadcn provides accessible, owned component primitives (not a black-box library)
- Existing design tokens (colors, billiard green palette, semantic surfaces) are preserved
- shadcn's expected CSS variables are aliased to existing tokens — no values duplicated
- All existing components (`Button`, `Card`, `Badge`, etc.) are replaced with shadcn equivalents
- Domain-specific components (`StatTile`, `IconCallout`, `SectionHeader`) stay custom

---

## Architecture

### 1. Token System (`src/app/globals.css`)

Three changes to the token system:

**A — Extend `@theme inline` to cover all token categories**

Currently only colors are mapped. Radius, shadows, letter-spacing, and font families must also be mapped so Tailwind generates native utility classes:

```css
@theme inline {
  /* existing color mappings stay */

  /* radius → rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-2xl, rounded-pill */
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --radius-2xl: var(--radius-2xl);
  --radius-pill: var(--radius-pill);

  /* shadows → shadow-sm, shadow-md, shadow-lg, shadow-brand */
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-brand: var(--shadow-brand);

  /* letter-spacing → tracking-label, tracking-label-wide */
  --tracking-label: var(--tracking-label);
  --tracking-label-wide: var(--tracking-label-wide);

  /* font families → font-body, font-display */
  --font-body: var(--font-body);
  --font-display: var(--font-display);
}
```

Result: `rounded-xl` instead of `rounded-[var(--radius-xl)]`, `shadow-lg` instead of `shadow-[var(--shadow-lg)]`.

**B — Add shadcn variable aliases in `:root` and `.dark`**

shadcn components expect specific variable names. These are aliases pointing to existing tokens — no values are duplicated:

```css
:root {
  /* existing tokens unchanged */

  /* shadcn aliases */
  --primary: var(--foreground);
  --primary-foreground: var(--foreground-inverse);
  --secondary: var(--surface-emphasis);
  --secondary-foreground: var(--foreground);
  --card: var(--surface);
  --card-foreground: var(--foreground);
  --popover: var(--surface);
  --popover-foreground: var(--foreground);
  --accent: var(--surface-emphasis);
  --accent-foreground: var(--foreground);
  --destructive: var(--danger);
  --input: var(--border);
}
```

**C — Typography utility classes via `@utility`**

Recurring multi-property typography patterns become single composable classes:

```css
@utility label-xs {
  font-size: var(--text-label-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
}

@utility label {
  font-size: var(--text-label);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
}

@utility label-wide {
  font-size: var(--text-label);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label-wide);
}

@utility display-sm { font-size: var(--text-display-sm); font-weight: 900; }
@utility display-md { font-size: var(--text-display-md); font-weight: 900; }
@utility display-lg { font-size: var(--text-display-lg); font-weight: 900; }
@utility score { font-size: var(--text-score); font-weight: 900; tracking: -0.05em; }
```

Before: `"text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--foreground-soft)]"`
After: `"label-xs text-muted-foreground"`

The existing `.theme-text-*` global CSS classes are removed in favor of these `@utility` patterns and Tailwind color classes.

---

### 2. shadcn Setup

Install shadcn configured to use the existing token structure:

```json
// components.json
{
  "style": "default",
  "tailwind": {
    "cssVariables": true,
    "config": ""
  },
  "aliases": {
    "components": "@/components/ui",
    "utils": "@/lib/utils"
  }
}
```

The `cn()` utility at `src/lib/utils.ts` already exists and is compatible.

---

### 3. Component Migration

**Replaced by shadcn equivalents (full substitution):**

| Current | shadcn replacement | Notes |
|---|---|---|
| `Button` | `shadcn Button` | Keep custom variants: `frontend`, `backend`, `sidebar` via CVA |
| `Card` + `SurfacePanel` | `shadcn Card` + CVA variants | Merge into one. Variants: `default`, `muted`, `strong`, `brand` |
| `Badge` | `shadcn Badge` | Add variants: `default`, `gold`, `frontend`, `backend`, `outline` |
| `Form` | `shadcn Form` | Backed by react-hook-form (already a dep) |
| `Separator` | `shadcn Separator` | Drop-in |
| `ScrollArea` | `shadcn ScrollArea` | Drop-in |

**Remain custom (domain-specific, no shadcn equivalent):**

| Component | Location | Reason |
|---|---|---|
| `StatTile` | `primitives/` | Domain component, no shadcn equivalent |
| `IconCallout` | `primitives/` | Project-specific composition |
| `SectionHeader` | `primitives/` | Layout primitive with eyebrow/title/description |
| `ThemeProvider` | `theme/` | Custom theme system, works well |
| `ThemeToggle` | `theme/` | Tied to custom theme system |

**Available on demand (install when needed):**
`Dialog`, `Select`, `DropdownMenu`, `Tabs`, `Tooltip`, `Sonner`, `Avatar`, `Table`

---

### 4. Folder Structure

```
src/components/
  ui/              ← shadcn components only (managed via `npx shadcn add`)
    button.tsx
    card.tsx
    badge.tsx
    form.tsx
    input.tsx
    label.tsx
    separator.tsx
    scroll-area.tsx

  primitives/      ← custom domain/layout components (never overwritten by shadcn)
    stat-tile.tsx
    icon-callout.tsx
    section-header.tsx

  dashboard/       ← domain feature components (unchanged structure)
  authenticated/
  login/
  theme/
```

**Import convention:**

```ts
// shadcn base components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// custom domain primitives
import { StatTile } from "@/components/primitives/stat-tile";
import { SectionHeader } from "@/components/primitives/section-header";

// theme
import { useTheme } from "@/components/theme/theme-provider";
```

---

## Rules

1. **Semantic tokens always** — never hardcode color values in `className`. Use `text-frontend`, `bg-surface`, `border-border`, etc.
2. **Typography utilities** — use `label-xs`, `label`, `display-lg`, `score` instead of composing 3–4 classes manually.
3. **`ui/` = shadcn, `primitives/` = custom** — never mix the two categories in the same folder.
4. **No arbitrary `[var(--...)]`** — if a token doesn't have a Tailwind class, add it to `@theme inline` first, then use the class.
5. **Variants via CVA** — multi-state components use `cva()` for variants, not conditional class concatenation.

---

## Out of Scope

- Adding new pages or features
- Changing the color palette or billiard-table visual direction
- Modifying the auth system or data layer
- Adding Storybook or visual regression testing

---

## Implementation Order

1. Configure `globals.css`: extend `@theme inline`, add shadcn aliases, add `@utility` typography classes
2. Configure shadcn: `npx shadcn init`, set `components.json`
3. Install and adapt `Button` — first component, establishes the pattern
4. Install and adapt `Card` (absorbing `SurfacePanel`) — eliminates the overlap
5. Install and adapt `Badge`
6. Install `Separator`, `ScrollArea`, `Form` — drop-in replacements
7. Move `StatTile`, `IconCallout`, `SectionHeader` to `primitives/`
8. Update all consumer components (`dashboard-hero`, `dashboard-sidebar`, etc.) to use new imports and class names
9. Remove `SurfacePanel`, dead `.theme-text-*` global classes, and old `Card` if fully replaced
