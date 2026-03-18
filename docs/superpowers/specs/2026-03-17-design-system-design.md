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

**A — Extend `@theme` for static tokens, keep `@theme inline` only for dynamic (theme-switching) tokens**

The existing `@theme inline` correctly maps colors: `:root`/`.dark` define `--background`, and `@theme inline` maps `--color-background: var(--background)` — different names, no circular reference.

For tokens that do NOT change between light and dark (radius, letter-spacing, fonts), use `@theme {}` directly — no CSS variable indirection needed:

```css
@theme {
  /* radius → generates rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-2xl, rounded-pill */
  --radius-sm: 18px;
  --radius-md: 20px;
  --radius-lg: 22px;
  --radius-xl: 28px;
  --radius-2xl: 32px;
  --radius-pill: 999px;

  /* letter-spacing → generates tracking-label, tracking-label-wide */
  --tracking-label: 0.22em;
  --tracking-label-wide: 0.28em;

  /* font families → generates font-body, font-display */
  --font-body: "Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif;
  --font-display: "Copperplate", "Impact", "Arial Narrow Bold", sans-serif;
}
```

For tokens that DO change between light and dark (shadows), rename the `:root` variable to avoid self-reference, then map in `@theme inline`:

```css
:root {
  /* renamed with -value suffix to avoid @theme inline circular reference */
  --shadow-sm-value: 0 14px 30px rgba(13, 18, 14, 0.18);
  --shadow-md-value: 0 20px 45px rgba(19, 74, 50, 0.22);
  --shadow-lg-value: 0 24px 60px rgba(49, 37, 27, 0.12);
  --shadow-brand-value: 0 20px 45px rgba(19, 74, 50, 0.28);
}

.dark {
  --shadow-sm-value: 0 14px 30px rgba(0, 0, 0, 0.3);
  --shadow-md-value: 0 20px 45px rgba(0, 0, 0, 0.24);
  --shadow-lg-value: 0 24px 60px rgba(49, 37, 27, 0.12);
  --shadow-brand-value: 0 20px 45px rgba(0, 0, 0, 0.28);
}

@theme inline {
  /* existing color mappings stay */

  /* shadow → generates shadow-sm, shadow-md, shadow-lg, shadow-brand */
  --shadow-sm: var(--shadow-sm-value);
  --shadow-md: var(--shadow-md-value);
  --shadow-lg: var(--shadow-lg-value);
  --shadow-brand: var(--shadow-brand-value);
}
```

Result: `rounded-xl shadow-lg tracking-label` instead of `rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] tracking-[var(--tracking-label)]`.

Note: `--radius-pill` generates a `rounded-pill` class which is non-standard in Tailwind but valid as a custom token. Verify it generates correctly after setup.

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

Mirror the same aliases in `.dark` pointing to the dark-mode versions of the same tokens.

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

@utility score {
  font-size: var(--text-score);
  font-weight: 900;
  letter-spacing: -0.05em;
}
```

Before: `"text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)] text-[color:var(--foreground-soft)]"`
After: `"label-xs text-muted-foreground"`

**Important:** The existing `.theme-text-*` global CSS classes (`.theme-text-strong`, `.theme-text-strong-muted`, `.theme-text-sidebar`, etc.) are load-bearing — they are used in `SurfacePanel` CVA variants and asserted on in `composition.test.tsx`. They must not be removed until all consumers are migrated to Tailwind color equivalents. Removal happens at the end of the migration (step 10), not before.

---

### 2. shadcn Setup

Install shadcn configured to use the existing token structure:

```json
// components.json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
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
| `SectionHeader` | `primitives/` | Layout primitive — see note below |
| `ThemeProvider` | `theme/` | Custom theme system, works well |
| `ThemeToggle` | `theme/` | Tied to custom theme system |

**SectionHeader coupling note:** `SectionHeader` currently imports and renders `CardHeader`, `CardTitle`, and `CardDescription` from `@/components/ui/card`. When `Card` is replaced with the shadcn version, these subcomponents will have different class defaults. Before moving `SectionHeader` to `primitives/`, its internals must be decoupled from `Card` — it should compose its own layout using semantic HTML and Tailwind classes directly, not via card subcomponents.

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
4. **No arbitrary `[var(--...)]`** — if a token doesn't have a Tailwind class, add it to `@theme` or `@theme inline` first, then use the class.
5. **Variants via CVA** — multi-state components use `cva()` for variants, not conditional class concatenation.

---

## Out of Scope

- Adding new pages or features
- Changing the color palette or billiard-table visual direction
- Modifying the auth system or data layer
- Adding Storybook or visual regression testing

---

## Implementation Order

1. **Token system — `globals.css`**
   - Add static tokens to `@theme {}` (radius, tracking, fonts)
   - Remove the same `--radius-*`, `--tracking-*`, `--font-body`, `--font-display` declarations from `:root` (lines 5–6, 14–15, 16–21 in the current file) — keeping them in both places causes redundant or conflicting custom property definitions
   - Rename shadow `:root` vars to `-value` suffix, map in `@theme inline`
   - Add shadcn variable aliases in `:root` and `.dark`
   - Add `@utility` typography classes

2. **shadcn init** — `npx shadcn init`, confirm `components.json`

3. **Button** — first shadcn component; establishes the pattern for custom CVA variants on top of shadcn base

4. **Badge** — add `gold`, `frontend`, `backend`, `outline` variants

5. **Card (absorbing SurfacePanel)** — single component with CVA variants; all `SurfacePanel` consumers are migrated to the new `Card` variants (the file itself is deleted in step 12)

6. **Separator, ScrollArea** — drop-in replacements, update imports

7. **Form** — shadcn Form + Input + Label; update login form and any other consumers

8. **Decouple SectionHeader from Card** — remove `CardHeader`/`CardTitle`/`CardDescription` imports; rewrite internals with semantic HTML and Tailwind classes

9. **Move custom components to `primitives/`** — `StatTile`, `IconCallout`, `SectionHeader`; update all import paths

10. **Update consumer components** — `dashboard-hero`, `dashboard-sidebar`, `app-shell`, `login-screen`, etc.; replace old class strings with new Tailwind classes and typography utilities

11. **Update tests** — `composition.test.tsx` and `login-screen.test.tsx`; update import paths (`@/components/ui/` → `@/components/primitives/` where needed) and update class assertions to match new Tailwind equivalents

12. **Remove dead code** — delete `SurfacePanel`, remove `.theme-text-*` global CSS classes (only after step 11 confirms no consumers remain), delete old `Card` if fully replaced

13. **Verify** — `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`
