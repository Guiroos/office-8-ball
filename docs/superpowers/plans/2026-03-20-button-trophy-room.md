# Button Trophy Room Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `Button` variants to a Trophy Room aesthetic — bold gold CTA, gradient team buttons with colored shadows, and lift+press interactions — using only existing design tokens.

**Architecture:** Two files change: `globals.css` gets a new `@utility btn-gold-gradient`, and `button.tsx` gets its `buttonVariants` CVA rewritten. The component API (props, variant names, sizes) stays identical so no consumer updates are needed.

**Tech Stack:** Next.js 16, Tailwind CSS 4, class-variance-authority, Vitest + @testing-library/react

**Spec:** `docs/superpowers/specs/2026-03-20-button-redesign-design.md`

---

## File Map

| File | Role | Change |
|---|---|---|
| `src/app/globals.css` | Design token / CSS utilities | Add `@utility btn-gold-gradient` after existing `@utility caption` |
| `src/components/ui/button.tsx` | Shadcn Button primitive | Rewrite `buttonVariants` CVA class values |
| `src/components/ui/button.test.tsx` | New test file | Verify each variant outputs the correct Tailwind classes |

---

## Task 1: Write failing tests for Button variants

**Files:**
- Create: `src/components/ui/button.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button } from "@/components/ui/button"

describe("Button variants", () => {
  it("default variant applies gold gradient and brand shadow", () => {
    render(<Button>Click</Button>)
    const btn = screen.getByRole("button", { name: "Click" })
    expect(btn).toHaveClass("btn-gold-gradient")
    expect(btn).toHaveClass("text-foreground")
    expect(btn).toHaveClass("shadow-brand")
    expect(btn).toHaveClass("rounded-xl")
  })

  it("team-alpha variant applies blue gradient and bold weight", () => {
    render(<Button variant="team-alpha">Frontend</Button>)
    const btn = screen.getByRole("button", { name: "Frontend" })
    expect(btn).toHaveClass("from-blue-700")
    expect(btn).toHaveClass("to-blue-500")
    expect(btn).toHaveClass("text-foreground-inverse")
    expect(btn).toHaveClass("rounded-xl")
  })

  it("team-beta variant applies red gradient", () => {
    render(<Button variant="team-beta">Backend</Button>)
    const btn = screen.getByRole("button", { name: "Backend" })
    expect(btn).toHaveClass("from-red-700")
    expect(btn).toHaveClass("to-red-500")
    expect(btn).toHaveClass("text-foreground-inverse")
  })

  it("ghost variant applies surface-muted background and border", () => {
    render(<Button variant="ghost">Cancel</Button>)
    const btn = screen.getByRole("button", { name: "Cancel" })
    expect(btn).toHaveClass("bg-surface-muted")
    expect(btn).toHaveClass("border")
    expect(btn).toHaveClass("border-border")
  })

  it("sidebar variant applies sidebar tokens", () => {
    render(<Button variant="sidebar">Dashboard</Button>)
    const btn = screen.getByRole("button", { name: "Dashboard" })
    expect(btn).toHaveClass("bg-sidebar-hover")
    expect(btn).toHaveClass("text-sidebar-foreground")
    expect(btn).toHaveClass("border-sidebar-border")
  })

  it("sm size applies correct height and padding", () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole("button", { name: "Small" })
    expect(btn).toHaveClass("h-9")
    expect(btn).toHaveClass("px-4")
  })

  it("lg size applies correct height and padding", () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole("button", { name: "Large" })
    expect(btn).toHaveClass("h-13")
    expect(btn).toHaveClass("px-6")
  })

  it("disabled state keeps pointer-events-none and opacity", () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByRole("button", { name: "Disabled" })
    expect(btn).toHaveClass("disabled:pointer-events-none")
    expect(btn).toHaveClass("disabled:opacity-50")
  })
})
```

- [ ] **Step 2: Run the tests and confirm they all fail**

```bash
npm run test -- src/components/ui/button.test.tsx
```

Expected: all 8 tests fail. The `default` variant should fail on `btn-gold-gradient` (currently uses `bg-foreground`). If any test accidentally passes, re-examine the assertion — it may be too loose.

---

## Task 2: Add `btn-gold-gradient` utility to globals.css

**Files:**
- Modify: `src/app/globals.css` (after the `@utility caption` block, around line 270)

- [ ] **Step 1: Add the utility after `@utility caption`**

In `src/app/globals.css`, locate the `@utility caption` block (last `@utility` declaration) and add the following immediately after it:

```css
@utility btn-gold-gradient {
  background: linear-gradient(135deg, var(--gold-500) 0%, var(--gold-300) 100%);
}
```

`--gold-500` is `#c7951f` and `--gold-300` is `#f0cc62` (defined in `tokens.css`). These are raw token primitives, not semantic aliases, so they are stable across themes.

- [ ] **Step 2: Verify the build accepts the new utility**

```bash
npm run typecheck
```

Expected: no errors. Tailwind 4 `@utility` blocks are CSS-only and do not affect TypeScript compilation — this step confirms no import or config errors were introduced.

---

## Task 3: Rewrite `buttonVariants` in button.tsx

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Replace `buttonVariants`**

Open `src/components/ui/button.tsx`. Replace the entire `const buttonVariants = cva(...)` call (lines 9–36) with:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 ease-out outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "btn-gold-gradient text-foreground shadow-brand font-extrabold uppercase tracking-label hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(199,149,31,0.65)] active:translate-y-px active:scale-[0.98] active:shadow-brand focus-visible:ring-offset-background",
        ghost:
          "border border-border bg-surface-muted text-foreground hover:-translate-y-0.5 hover:bg-surface-emphasis active:translate-y-px active:scale-[0.98] focus-visible:ring-offset-background",
        "team-alpha":
          "bg-gradient-to-br from-blue-700 to-blue-500 text-foreground-inverse font-extrabold uppercase tracking-label shadow-[0_6px_20px_rgba(42,95,156,0.5)] hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(42,95,156,0.65)] active:translate-y-px active:scale-[0.98] active:shadow-[0_3px_10px_rgba(42,95,156,0.35)] focus-visible:ring-offset-background",
        "team-beta":
          "bg-gradient-to-br from-red-700 to-red-500 text-foreground-inverse font-extrabold uppercase tracking-label shadow-[0_6px_20px_rgba(159,61,49,0.5)] hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(159,61,49,0.65)] active:translate-y-px active:scale-[0.98] active:shadow-[0_3px_10px_rgba(159,61,49,0.35)] focus-visible:ring-offset-background",
        sidebar:
          "border border-sidebar-border bg-sidebar-hover text-sidebar-foreground hover:bg-sidebar-active",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
```

Key changes vs current:
- Base: `rounded-xl` replaces `rounded-pill`; `duration-150 ease-out` added; `font-semibold` stays in base (overridden to `font-extrabold` per variant)
- `default`: `btn-gold-gradient text-foreground shadow-brand` + deep lift+press
- `ghost`: same structure, subtle lift, no colored shadow
- `team-alpha`: blue gradient + blue shadow + deep lift+press
- `team-beta`: red gradient + red shadow + deep lift+press
- `sidebar`: unchanged in spirit, `rounded-xl` inherited from base

- [ ] **Step 2: Run the tests and confirm they all pass**

```bash
npm run test -- src/components/ui/button.test.tsx
```

Expected: all 8 tests pass. If a class assertion fails, compare the actual class string in the error output against what was written in Step 1.

- [ ] **Step 3: Run the full test suite to catch regressions**

```bash
npm run test
```

Expected: all existing tests pass. The Button API is unchanged (same variant and size names), so no consumer tests should break.

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/button.test.tsx src/components/ui/button.tsx src/app/globals.css
git commit -m "feat(ui): redesign Button with Trophy Room aesthetic"
```

---

## Task 4: Visual verification

**Files:** none changed

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:3000` and log in. If `DATABASE_URL` is not set, the app uses in-memory mode — create any account via the login screen (no real DB needed) and you will be redirected to `/dashboard`.

- [ ] **Step 2: Check each variant in context**

On the dashboard, verify:
- Gold gradient CTA is visible and lifts on hover
- Team buttons (Frontend/Backend) have colored gradients and lift on hover
- Ghost buttons (if present) are translucent with border
- Sidebar nav items look unchanged

If anything looks off, cross-reference with the mockup: run `ls .superpowers/brainstorm/` to find the session directory, then open `design-spec.html` inside it in a browser (e.g. `xdg-open .superpowers/brainstorm/<session>/design-spec.html`).
