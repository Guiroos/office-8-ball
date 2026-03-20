# Typography Scale — Design Spec

**Date:** 2026-03-20
**Status:** Approved

## Problem

Typography in the codebase is currently composed ad-hoc at each call site: `text-display-lg font-black`, `text-title font-black tracking-[-0.04em]`, `label-xs`, `text-[11px] font-semibold uppercase tracking-label-sm`. No single source of truth for what a "title" or "label" looks like. This makes the system inconsistent and impossible to drive from a future `<Typography>` component.

## Goal

Replace all existing typography utilities with a unified, role-based scale. Calling `title` is the only thing needed — it already encodes size, weight, and tracking. The scale is abstract enough to work in any context and to serve as the `variant` prop of a future Typography component.

---

## Token Rename — `tokens.css`

The `--fz-*` tokens are renamed to match the new scale. `--fz-display-sm` is dropped (near-duplicate of `--fz-title`).

| New token | Old token | Value |
|---|---|---|
| `--fz-display` | `--fz-score` | `clamp(4rem, 12vw, 6rem)` |
| `--fz-headline` | `--fz-display-lg` | `clamp(3.5rem, 10vw, 7.5rem)` |
| `--fz-title` | `--fz-display-md` | `clamp(3rem, 4vw, 4.8rem)` |
| `--fz-subtitle` | `--fz-title` | `clamp(1.9rem, 4vw, 2.7rem)` |
| `--fz-label` | `--fz-label` | `0.72rem` — unchanged |
| `--fz-label-sm` | `--fz-label-sm` | `0.68rem` — unchanged |

**Dropped:** `--fz-display-sm` — value `clamp(2rem, 4vw, 2.75rem)` overlaps with `--fz-subtitle` and has no real consumers.

**On naming:** the old `--fz-title` is promoted to `--fz-subtitle`; the old `--fz-display-md` becomes the new `--fz-title`. The token name `--fz-title` therefore changes meaning between old and new scale.

`body` and `body-sm` reference Tailwind built-ins (`1rem`, `0.875rem`) and require no custom token.

---

## Compound `@utility` Classes — `globals.css`

All old utilities are removed: `text-label-sm`, `text-label`, `text-title`, `text-display-sm/md/lg`, `text-score`, `display-sm/md/lg`, `label-xs`, `label`, `label-wide`, `score`.

New unified set:

| Class | Size | Weight | Letter-spacing | Transform |
|---|---|---|---|---|
| `display` | `--fz-display` | 900 | `-0.05em` | — |
| `headline` | `--fz-headline` | 900 | `—` | — |
| `title` | `--fz-title` | 900 | `-0.04em` | — |
| `subtitle` | `--fz-subtitle` | 600 | `-0.03em` | — |
| `body` | `1rem` | 400 | `0` | — |
| `body-sm` | `0.875rem` | 400 | `0` | — |
| `label` | `--fz-label` | 600 | `0.22em` | uppercase |
| `label-sm` | `--fz-label` | 600 | `0.12em` | uppercase |
| `label-wide` | `--fz-label` | 600 | `0.28em` | uppercase |
| `caption` | `--fz-label-sm` | 600 | `0.12em` | uppercase |

**Note on `headline`:** tracking is intentionally omitted — it is used in both tight (`tracking-[-0.05em]`) and wide (`tracking-[0.06em]`) contexts depending on the component. Callers add a tracking modifier when needed.

**Note on `label-sm` vs `caption`:** `label-sm` uses `--fz-label` (0.72rem); `caption` uses `--fz-label-sm` (0.68rem). Despite the suffix, `label-sm` is not smaller than `label` — it is the same size with tighter letter-spacing. `caption` is the smallest scale entry.

**Note on `body` / `body-sm`:** these encode only size + weight. Line-height, color, and family remain caller-controlled as they vary by context.

---

## Migration Map — Components

| File | Before | After |
|---|---|---|
| `dashboard/index.tsx` | `label-xs` | `caption` |
| `dashboard/index.tsx` | `label` | `label` *(new implementation)* |
| `dashboard/index.tsx` | `font-display text-score leading-none tracking-[0.03em]` | `font-display display` |
| `dashboard/index.tsx` | `text-2xl font-black tracking-[-0.04em]` | `title` |
| `dashboard-hero.tsx` | `font-display text-display-lg leading-[0.88] uppercase tracking-[0.06em]` | `font-display headline tracking-[0.06em] uppercase` |
| `dashboard-hero.tsx` | `text-xl font-semibold tracking-[-0.03em]` | `subtitle` |
| `dashboard-hero.tsx` | `text-4xl font-black tracking-[-0.05em]` (2×) | `title` |
| `dashboard-hero.tsx` | `label-xs` (2×) | `caption` |
| `route-state-screen.tsx` | `font-display text-display-lg leading-none tracking-[0.08em]` | `font-display headline leading-none tracking-[0.08em]` |
| `route-state-screen.tsx` | `text-4xl font-black tracking-[-0.05em] sm:text-5xl` | `title` |
| `route-state-screen.tsx` | `label-xs` | `caption` |
| `placeholder-page.tsx` | `text-4xl font-black tracking-[-0.05em] sm:text-5xl` | `title` |
| `placeholder-page.tsx` | `label-wide` | `label-wide` *(new implementation)* |
| `section-header.tsx` | `text-title leading-none font-black tracking-[-0.04em]` | `title leading-none` |
| `card.tsx` | `text-title leading-none font-black tracking-[-0.04em]` | `title leading-none` |
| `login-screen.tsx` | `text-xl font-semibold leading-tight tracking-[-0.03em] sm:text-2xl` | `subtitle leading-tight` |
| `app-shell.tsx` | `text-[11px] font-semibold uppercase tracking-label-sm` | `caption` |
| `primitives/stat-tile.tsx` | `label-xs` | `caption` |
| `ui/badge.tsx` | `label-xs` | `caption` |
| `ui/composition.test.tsx` | `text-4xl font-black` (test-authored value) | `title` |

**Note on `text-2xl` → `title`:** `dashboard/index.tsx` changes from `text-2xl` (Tailwind: 1.5rem) to `title` (min 3rem). This is a deliberate size increase — the team name/roster context calls for a larger, role-mapped size.

**Note on `text-4xl font-black` in `composition.test.tsx`:** `text-4xl` (2.25rem) becomes `title` (min 3rem). This is a deliberate size change — the test value is authored alongside the `StatTile` usages in `dashboard-hero.tsx` which follow the same `text-4xl` → `title` migration.

**Note on `sm:text-5xl` → drop:** `route-state-screen.tsx` and `placeholder-page.tsx` currently use `text-4xl sm:text-5xl` for a responsive size bump at ≥640px. After migration, `sm:text-5xl` is dropped — `title = clamp(3rem, 4vw, 4.8rem)` guarantees a minimum of 3rem at all breakpoints, equal to what `sm:text-5xl` (48px / 3rem) was providing. The responsive modifier becomes redundant.

**Note on `sm:text-2xl` → drop:** `login-screen.tsx` uses `text-xl sm:text-2xl` (1.25rem → 1.5rem at ≥640px). After migration, `sm:text-2xl` is dropped — `subtitle = clamp(1.9rem, 4vw, 2.7rem)` sets a minimum of 1.9rem, which already exceeds what `sm:text-2xl` (1.5rem) was providing. The responsive modifier becomes redundant.

**Note on `app-shell.tsx` lines 72 and 91 (out of scope):** `UserAvatar` (line 72: `text-sm font-bold uppercase tracking-label-sm`) and `SidebarBrand` (line 91: `text-xs font-medium tracking-label-sm uppercase`) use raw Tailwind primitives — not any compound utility being removed. They are intentionally out of scope for this migration. They should be cleaned up in a follow-up pass once the scale is established.

---

## Rules Post-Implementation

- Never compose typography primitives (size + weight + tracking) inline — always use a scale class.
- `headline` tracking is the one exception: add `tracking-[...]` as a modifier only when the design intent differs from neutral.
- `body` and `body-sm` are the floor — no arbitrary `text-xs font-medium` or similar below them without adding a new scale entry.
- When a new typographic pattern is needed, add it to the scale, not inline in the component.

---

## Files Changed

- `src/app/tokens.css` — rename `--fz-*` tokens, drop `--fz-display-sm`
- `src/app/globals.css` — remove old utilities, add new compound `@utility` set; update `@theme inline` single-purpose size refs if any remain
- `src/components/dashboard/index.tsx`
- `src/components/dashboard/dashboard-hero.tsx`
- `src/components/route-state-screen.tsx`
- `src/components/authenticated/placeholder-page.tsx`
- `src/components/primitives/section-header.tsx`
- `src/components/primitives/stat-tile.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/composition.test.tsx`
- `src/components/login/login-screen.tsx`
- `src/components/authenticated/app-shell.tsx`
