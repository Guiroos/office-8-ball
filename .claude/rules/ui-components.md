---
paths:
  - "src/components/**/*.tsx"
---

# UI Components

## Layer Hierarchy

- Three layers: `ui/` (shadcn primitives), `primitives/` (domain reusables like StatTile, SectionHeader), and feature directories (`dashboard/`, `login/`, `authenticated/`).
- Feature directories import from `ui/` and `primitives/` but never from other feature directories.
- **Why:** Cross-feature imports create hidden coupling that makes components hard to move or delete independently.

## CVA Variants

- Use `cva()` at module scope for any component with visual variants; apply via variant props with semantic design tokens (`bg-team-alpha-soft`, `border-gold`).
- Combine with `cn()` from `@/lib/utils` for conditional class merging.
- Components without variants do not need CVA.

## Theme Changes

When modifying tokens, CSS variables, or the theme system, read `techspec/theme-system.md` before editing.

## Styling Constraints

- Use semantic design tokens — no arbitrary Tailwind values (`[#abc123]`, `[var(--some-token)]`). **Why:** Arbitrary values bypass the theme system and break dark/light mode consistency.
- Use native token classes (`rounded-xl`, `shadow-sm shadow-gold/35`) over inline style attributes. Shadows compose size + color + opacity as separate classes (`shadow-sm shadow-gold/35`) — never create component-specific shadow tokens.
- Shadow opacity calibration: `gold/35`, `team-alpha/30`, `team-beta/28`. Omitting the opacity modifier applies the color as solid, which is always wrong for shadows.
- Shadow state mapping for interactive components: `shadow-sm` at rest → `shadow-md` on hover → `shadow-xs` on active/press.
- Never use `style={{}}` for values that have a token equivalent.

## Imports

- Always import from `@/` alias — no relative `../` paths.
- Named exports everywhere except Next.js page and layout files.
