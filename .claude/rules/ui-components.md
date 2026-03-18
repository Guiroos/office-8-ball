---
paths:
  - "src/components/**/*.tsx"
---

# UI Components

## Layer Hierarchy

- Three layers: `ui/` (shadcn primitives), `primitives/` (domain reusables like StatTile, SectionHeader), and feature directories (`dashboard/`, `login/`, `authenticated/`). Feature directories import from `ui/` and `primitives/` but never from other feature directories.

## CVA Variants

- Use `cva()` at module scope for any component with visual variants; apply via variant props with semantic design tokens (`bg-frontend-soft`, `border-gold`). Combine with `cn()` from `@/lib/utils` for conditional merging. Components without variants do not need CVA.

