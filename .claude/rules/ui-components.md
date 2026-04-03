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

## Naming Conventions

| Artifact | Convention | Example |
|----------|------------|---------|
| Files | `kebab-case` | `dashboard-hero.tsx`, `use-dashboard-data.ts` |
| React components | `PascalCase` | `DashboardHero`, `StatTile` |
| Functions/variables | `camelCase` | `getAuthenticatedUser`, `currentUser` |
| Types/interfaces | `PascalCase` | `TeamRecord`, `MatchRecord`, `SessionUser` |
| Constants | `SCREAMING_SNAKE` | `AUTH_RATE_LIMIT_ERROR` |
| Route handlers | Named exports matching HTTP verbs | `export async function GET()` |
| Hooks | `use` prefix | `useDashboardData` |

## Animations

`framer-motion` is the project animation library. Use it for component entry animations — do not use CSS `@keyframes` or `animate-*` utilities for entry/exit motion.

**Required pattern for every animated component:**

```tsx
import { motion, useReducedMotion } from "framer-motion";

// Inside the component:
const prefersReducedMotion = useReducedMotion();

<motion.div
  initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
```

**Rules:**
- Always call `useReducedMotion()` and set `initial` = `animate` when it returns `true`. **Why:** Vestibular disorders and motion sensitivity — skipping the hook is an accessibility failure.
- Duration: 200–300ms for entry animations; 150ms for micro-interactions (hover, press).
- Animate `opacity` and `transform` (`y`, `x`, `scale`) only — never `width`, `height`, or `margin`. **Why:** Layout properties trigger reflow; transforms are GPU-composited.
- Use `y: 16` (subtle lift) for cards/panels. Use `scale: 0.96` for modals/dialogs. Never exceed `y: 30` or `scale: 0.9` — exaggerated motion feels cheap.
- `exit` animations require wrapping with `<AnimatePresence>`. Only add it when the element actually unmounts.

## Language in Code

- Error messages and validation messages: **Brazilian Portuguese**
- Code identifiers, comments, type names: **English**
- Git commits: English (conventional commits)
- PR bodies: Portuguese (sections: "O que muda" / "Como testar")
