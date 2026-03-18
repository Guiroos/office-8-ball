---
paths:
  - "src/components/**/*.tsx"
---

# UI Components

## Layer Hierarchy

- Three layers: `ui/` (shadcn primitives), `primitives/` (domain reusables like StatTile, SectionHeader), and feature directories (`dashboard/`, `login/`, `authenticated/`). Feature directories import from `ui/` and `primitives/` but never from other feature directories.

## CVA Variants

- Use `cva()` at module scope for any component with visual variants; apply via variant props with semantic design tokens (`bg-frontend-soft`, `border-gold`). Combine with `cn()` from `@/lib/utils` for conditional merging. Components without variants do not need CVA.

## Named Exports

- Use named exports for all components and utilities. Default exports are reserved for Next.js `page.tsx` and `layout.tsx` files only; route files export named handlers (`GET`, `POST`).
