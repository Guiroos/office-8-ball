# Button Redesign — Trophy Room Style

**Date:** 2026-03-20
**Status:** Approved
**Scope:** `src/components/ui/button.tsx`

---

## Context

The Button component (`src/components/ui/button.tsx`) is a shadcn/CVA primitive with five variants (`default`, `ghost`, `team-alpha`, `team-beta`, `sidebar`) and three sizes (`sm`, `default`, `lg`). The current implementation uses flat colors and a modest hover lift (`-translate-y-0.5`). The project's design system has rich tokens (warm neutrals, gold, blue and red team colors, warm shadows) that are underutilized in the button.

## Goal

Redesign all button variants to match a **Trophy Room** aesthetic — bold, prestigious, and energetic — while strictly using existing semantic tokens. No new tokens or packages.

## Decisions

| Question | Decision |
|---|---|
| Aesthetic direction | Bold / Trophy Room |
| Team buttons emphasis | Maximum — gradient + colored shadow per team |
| Hover/interaction | Lift + Press (hover: translateY(-3px), active: translateY(1px) + scale(0.98)) |
| Implementation approach | Full redesign of all variants (Approach B) |

---

## Design Spec

### Typography

All variants use uppercase text with wide letter-spacing for the primary CTA feel. Ghost and sidebar use sentence case with tighter tracking.

- `default`, `team-alpha`, `team-beta`: `font-weight: 800`, `uppercase`, `tracking-label` (0.22em)
- `ghost`, `sidebar`: `font-weight: 600`, sentence case, `tracking-[0.06em]`

### Variants

#### `default` — Gold CTA (primary action)

The dominant action button. Uses a diagonal gold gradient and a warm shadow. Intended for the main CTA in any context (light or dark bg).

- Background: add `@utility btn-gold-gradient` in `globals.css` following the existing `@utility display` / `@utility headline` pattern, with `background: linear-gradient(135deg, var(--gold-500) 0%, var(--gold-300) 100%)`. Apply via `btn-gold-gradient` class in CVA.
- Text color: `text-foreground` (dark neutral — `#09342c` / `neutral-950`)
- Shadow: `shadow-brand` (warm green-gold shadow)
- Border radius: `rounded-xl` (28px) — smaller than current `rounded-pill`
- Hover: `translateY(-3px)` + intensified shadow
- Active: `translateY(1px) scale(0.98)` + reduced shadow

#### `team-alpha` — Frontend (blue)

Used to register a Frontend win. Maximum visual emphasis with team color.

- Background: `bg-gradient-to-br from-blue-700 to-blue-500` (existing token scale)
- Text: `text-foreground-inverse` (cream white)
- Shadow: colored blue shadow via `shadow-[0_6px_20px_rgba(42,95,156,0.5)]`
- Same lift+press as `default`

#### `team-beta` — Backend (red)

Used to register a Backend win. Same structure as `team-alpha` but red.

- Background: `bg-gradient-to-br from-red-700 to-red-500`
- Text: `text-foreground-inverse`
- Shadow: colored red shadow via `shadow-[0_6px_20px_rgba(159,61,49,0.5)]`
- Same lift+press as `default`

#### `ghost`

Secondary/cancel actions. Adapts to light and dark contexts via transparent background.

- Background: `bg-surface-muted` (translucent)
- Text: `text-foreground`
- Border: `border border-border`
- No colored shadow — subtle lift only on hover (`translateY(-2px)`)
- Active: same press effect

#### `sidebar`

Navigation items within the dark app shell. Minimal change from current.

- Background: `bg-sidebar-hover`
- Text: `text-sidebar-foreground`
- Border: `border border-sidebar-border`
- Hover: `bg-sidebar-active` (no lift — nav items are static)

### Sizes

| Size | Height | Padding | Font size |
|---|---|---|---|
| `sm` | `h-9` | `px-4` | `text-xs` |
| `default` | `h-11` | `px-5` | `text-sm` |
| `lg` | `h-13` | `px-6` | `text-base` | ← already used and working in current button.tsx (Tailwind 4 generates this from the spacing scale) |

### Border radius

Change from `rounded-pill` (999px) to `rounded-xl` (28px) for all variants. This aligns with the Trophy Room aesthetic — substantial but not capsule-shaped. Sidebar keeps `rounded-xl` for consistency.

### Transition

All interactive variants share:
```
transition-all duration-150 ease-out
```

Active state on `default`, `team-alpha`, `team-beta`, `ghost`:
```
active:translate-y-px active:scale-[0.98]
```

### Disabled state

Unchanged: `disabled:opacity-50 disabled:pointer-events-none`.

---

## Constraints

- Use only existing semantic tokens — no arbitrary Tailwind values except for the team-colored box-shadows (no token exists for colored shadows).
- Do not change component API (props, variant names, size names) — consumers must not need updates.
- Named export `Button` and `buttonVariants` must remain.
- No new packages.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/ui/button.tsx` | Rewrite `buttonVariants` CVA — new class values for all variants |
| `src/app/globals.css` | Add `@utility btn-gold-gradient` for the default gold CTA gradient |

No other files require changes. Consumer components use variant props and will pick up the new styles automatically.

---

## Out of Scope

- Dark mode specific overrides (existing token system handles this)
- Adding new variants
- Changing component behavior or accessibility attributes
