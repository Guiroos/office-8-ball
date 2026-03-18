# Design System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate office-8-ball from verbose Tailwind arbitrary values to a clean token-driven system using shadcn/ui, eliminating class string verbosity and inconsistent component patterns.

**Architecture:** Extend Tailwind's `@theme` block to expose all design tokens as native utility classes, install shadcn/ui and map existing semantic tokens to its expected CSS variable names, replace base components (Button, Card, Badge, etc.) with shadcn equivalents carrying custom variants, and move domain-specific primitives to `components/primitives/`.

**Tech Stack:** Next.js 15 App Router · Tailwind v4 · shadcn/ui · Radix UI · CVA (class-variance-authority) · Vitest · TypeScript

---

## File Map

**Modified:**
- `src/app/globals.css` — token system overhaul (Tasks 1)
- `src/components/ui/button.tsx` — replaced with shadcn + custom variants (Task 3)
- `src/components/ui/badge.tsx` — replaced with shadcn + custom variants (Task 4)
- `src/components/ui/card.tsx` — replaced with shadcn + CVA variants (Task 5)
- `src/components/ui/separator.tsx` — replaced with shadcn (Task 6)
- `src/components/ui/scroll-area.tsx` — replaced with shadcn (Task 6)
- `src/components/ui/form.tsx` → split into `ui/input.tsx` + `ui/label.tsx` + `primitives/form-field.tsx` (Task 7)
- `src/components/ui/section-header.tsx` — decoupled from Card (Task 8)
- `src/components/ui/composition.test.tsx` — updated assertions + imports (Task 11)
- `src/components/dashboard/dashboard-hero.tsx` — class strings updated (Task 10)
- `src/components/dashboard/dashboard-sidebar.tsx` — class strings updated (Task 10)
- `src/components/dashboard/recent-matches-card.tsx` — class strings updated (Task 10)
- `src/components/authenticated/app-shell.tsx` — class strings updated (Task 10)
- `src/components/login/login-screen.tsx` — class strings updated (Task 10)

**Created:**
- `src/components/primitives/stat-tile.tsx` — moved from `ui/` (Task 9)
- `src/components/primitives/icon-callout.tsx` — moved from `ui/` (Task 9)
- `src/components/primitives/section-header.tsx` — moved from `ui/` (Task 9)
- `src/components/primitives/form-field.tsx` — `Field` + `FieldError` extracted from form.tsx (Task 7)
- `src/components/ui/input.tsx` — shadcn Input (Task 7)
- `src/components/ui/label.tsx` — shadcn Label (Task 7)

**Deleted:**
- `src/components/ui/surface-panel.tsx` — absorbed into Card variants (Task 12)
- `src/components/ui/form.tsx` — replaced by input.tsx + label.tsx + primitives/form-field.tsx (Task 12)

---

## Task 1: Token System — globals.css

**Files:**
- Modify: `src/app/globals.css`

### What this does

Adds `@theme {}` for static tokens so Tailwind generates native classes (`rounded-xl` instead of `rounded-[var(--radius-xl)]`), renames shadow variables to avoid circular reference, adds shadcn variable aliases, adds typography `@utility` classes, and extends `@theme inline` for missing color mappings.

### Steps

- [ ] **Step 1.1: Run the test suite to establish baseline**

  ```bash
  npm run test
  ```
  Expected: All tests pass. Note any pre-existing failures.

- [ ] **Step 1.2: Add static token `@theme {}` block and remove `:root` duplicates**

  Open `src/app/globals.css`. Add this block immediately before the existing `@theme inline` block:

  ```css
  @theme {
    /* Radius — generates: rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-2xl, rounded-pill */
    --radius-sm: 18px;
    --radius-md: 20px;
    --radius-lg: 22px;
    --radius-xl: 28px;
    --radius-2xl: 32px;
    --radius-pill: 999px;

    /* Letter spacing — generates: tracking-label, tracking-label-wide */
    --tracking-label: 0.22em;
    --tracking-label-wide: 0.28em;

    /* Font families — generates: font-body, font-display */
    --font-body: "Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif;
    --font-display: "Copperplate", "Impact", "Arial Narrow Bold", sans-serif;
  }
  ```

  Then **remove** these lines from `:root` (they are now owned by `@theme`):
  - `--font-body: ...` and `--font-display: ...` (lines 5–6)
  - `--tracking-label: ...` and `--tracking-label-wide: ...` (lines 14–15)
  - `--radius-sm` through `--radius-pill` (lines 16–21)

- [ ] **Step 1.3: Rename shadow variables to avoid circular reference**

  In `:root`, rename the four shadow variables:
  ```css
  /* was: --shadow-sm, --shadow-md, --shadow-lg, --shadow-brand */
  --shadow-sm-value: 0 14px 30px rgba(13, 18, 14, 0.18);
  --shadow-md-value: 0 20px 45px rgba(19, 74, 50, 0.22);
  --shadow-lg-value: 0 24px 60px rgba(49, 37, 27, 0.12);
  --shadow-brand-value: 0 20px 45px rgba(19, 74, 50, 0.28);
  ```

  Apply the same rename in `.dark`:
  ```css
  --shadow-sm-value: 0 14px 30px rgba(0, 0, 0, 0.3);
  --shadow-md-value: 0 20px 45px rgba(0, 0, 0, 0.24);
  --shadow-lg-value: 0 24px 60px rgba(49, 37, 27, 0.12);
  --shadow-brand-value: 0 20px 45px rgba(0, 0, 0, 0.28);
  ```

- [ ] **Step 1.4: Add shadow + missing color mappings to `@theme inline`**

  Inside the existing `@theme inline { ... }` block, add after the last `--color-*` line:

  ```css
  /* shadow → generates: shadow-sm, shadow-md, shadow-lg, shadow-brand */
  --shadow-sm: var(--shadow-sm-value);
  --shadow-md: var(--shadow-md-value);
  --shadow-lg: var(--shadow-lg-value);
  --shadow-brand: var(--shadow-brand-value);

  /* missing color mappings needed for .theme-text-* removal */
  --color-surface-strong-foreground-muted: var(--surface-strong-foreground-muted);
  --color-sidebar-foreground: var(--app-shell-sidebar-foreground);
  --color-sidebar-foreground-muted: var(--app-shell-sidebar-foreground-muted);
  --color-sidebar-foreground-subtle: var(--app-shell-sidebar-foreground-subtle);
  ```

- [ ] **Step 1.5: Add shadcn variable aliases to `:root`**

  Append at the end of the `:root { ... }` block:

  ```css
  /* shadcn aliases — point to existing tokens, no values duplicated */
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
  ```

  Append the same aliases at the end of the `.dark { ... }` block — all values point to the same token names (which already have dark-mode overrides in `.dark`), so the actual values change automatically.

- [ ] **Step 1.6: Add `@utility` typography classes**

  After the `@theme inline` block, add:

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

  @utility display-sm {
    font-size: var(--text-display-sm);
    font-weight: 900;
  }

  @utility display-md {
    font-size: var(--text-display-md);
    font-weight: 900;
  }

  @utility display-lg {
    font-size: var(--text-display-lg);
    font-weight: 900;
  }

  @utility score {
    font-size: var(--text-score);
    font-weight: 900;
    letter-spacing: -0.05em;
  }
  ```

- [ ] **Step 1.7: Run tests to confirm no regressions**

  ```bash
  npm run test
  ```
  Expected: Same results as Step 1.1.

- [ ] **Step 1.8: Verify build generates expected classes**

  ```bash
  npm run build
  ```
  Expected: Build succeeds. If Tailwind warns about unrecognized tokens, check the `@theme` block syntax.

- [ ] **Step 1.9: Commit**

  ```bash
  git add src/app/globals.css
  git commit -m "feat(tokens): extend @theme, add shadcn aliases and typography utilities"
  ```

---

## Task 2: shadcn Init

**Files:**
- Create: `components.json`

### Steps

- [ ] **Step 2.1: Run shadcn init**

  ```bash
  npx shadcn@latest init
  ```

  When prompted:
  - Style: **Default**
  - Base color: **Slate** (we'll override everything with our tokens anyway)
  - CSS variables: **Yes**

  shadcn will create `components.json` and may modify `globals.css`. After it finishes, check `globals.css` — if it added a `:root` block with its own variables, remove it (our tokens already cover everything).

- [ ] **Step 2.2: Verify `components.json`**

  Confirm the file matches:

  ```json
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

  Adjust manually if the CLI produced different paths.

- [ ] **Step 2.3: Run tests**

  ```bash
  npm run test
  ```
  Expected: All tests still pass.

- [ ] **Step 2.4: Commit**

  ```bash
  git add components.json src/app/globals.css
  git commit -m "chore: init shadcn/ui"
  ```

---

## Task 3: Button Migration

**Files:**
- Modify: `src/components/ui/button.tsx`

The current Button already uses CVA. shadcn's Button adds the `asChild` prop (Radix Slot pattern). We install shadcn's version, then port our custom variants back in.

### Steps

- [ ] **Step 3.1: Run existing button-related tests**

  ```bash
  npm run test -- src/components/authenticated/app-shell.test.tsx
  npm run test -- src/components/login/login-screen.test.tsx
  ```
  Expected: Pass. This is the baseline.

- [ ] **Step 3.2: Install shadcn Button**

  ```bash
  npx shadcn@latest add button
  ```

  This overwrites `src/components/ui/button.tsx` with the shadcn version.

- [ ] **Step 3.3: Restore custom variants and update class strings**

  Open `src/components/ui/button.tsx`. The shadcn Button will have `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` variants. Replace/extend the `cva` call to match the project's variant set, now using native Tailwind classes:

  ```tsx
  const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    {
      variants: {
        variant: {
          default:
            "bg-foreground text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:bg-foreground-soft focus-visible:ring-offset-background",
          ghost:
            "border border-border bg-surface-muted text-foreground hover:bg-surface-emphasis focus-visible:ring-offset-background",
          frontend:
            "bg-frontend text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-offset-background",
          backend:
            "bg-backend text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-offset-background",
          sidebar:
            "border border-[color:var(--app-shell-sidebar-border)] bg-[color:var(--app-shell-sidebar-hover)] text-sidebar-foreground hover:bg-[color:var(--app-shell-sidebar-active)]",
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
  );
  ```

  Note: `sidebar` variant keeps `var(--app-shell-sidebar-*)` arbitrary values because those specific tokens aren't in `@theme inline`. This is acceptable and consistent with the rule: add to `@theme inline` only when a token is used broadly.

- [ ] **Step 3.4: Run tests**

  ```bash
  npm run test -- src/components/authenticated/app-shell.test.tsx
  npm run test -- src/components/login/login-screen.test.tsx
  ```
  Expected: Pass.

- [ ] **Step 3.5: Commit**

  ```bash
  git add src/components/ui/button.tsx
  git commit -m "feat(ui): migrate Button to shadcn with custom variants"
  ```

---

## Task 4: Badge Migration

**Files:**
- Modify: `src/components/ui/badge.tsx`

### Steps

- [ ] **Step 4.1: Install shadcn Badge**

  ```bash
  npx shadcn@latest add badge
  ```

- [ ] **Step 4.2: Add custom variants**

  Replace the generated badge CVA with the project's variant set:

  ```tsx
  const badgeVariants = cva(
    "inline-flex w-fit items-center rounded-pill border px-3 py-1 label-xs backdrop-blur-sm",
    {
      variants: {
        variant: {
          default:
            "border-border-strong bg-surface-emphasis text-muted-foreground",
          gold:
            "border-gold bg-gold-soft text-foreground",
          frontend:
            "border-frontend bg-frontend-soft text-frontend",
          backend:
            "border-backend bg-backend-soft text-backend",
          outline:
            "border-border bg-transparent text-foreground",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    },
  );
  ```

- [ ] **Step 4.3: Run tests**

  ```bash
  npm run test -- src/components/ui/composition.test.tsx
  ```

  The composition test doesn't assert specific Badge classes — it checks for eyebrow text being in the document. Expected: Pass.

- [ ] **Step 4.4: Commit**

  ```bash
  git add src/components/ui/badge.tsx
  git commit -m "feat(ui): migrate Badge to shadcn with custom variants"
  ```

---

## Task 5: Card + SurfacePanel Migration

**Files:**
- Modify: `src/components/ui/card.tsx`
- `src/components/ui/surface-panel.tsx` — consumers migrated (file deleted in Task 12)

This task installs shadcn Card, adds CVA variants to replace `SurfacePanel`, and migrates the two `SurfacePanel` consumers (`dashboard-sidebar.tsx` and the composition test indirect usage via Card).

### Steps

- [ ] **Step 5.1: Run composition tests to establish baseline**

  ```bash
  npm run test -- src/components/ui/composition.test.tsx
  npm run test -- src/components/dashboard.test.tsx
  ```

- [ ] **Step 5.2: Install shadcn Card**

  ```bash
  npx shadcn@latest add card
  ```

- [ ] **Step 5.3: Extend Card with CVA variants (absorbing SurfacePanel)**

  Replace the generated `src/components/ui/card.tsx` with a version that adds the SurfacePanel variants to the root `Card` component:

  ```tsx
  import * as React from "react";
  import { cva, type VariantProps } from "class-variance-authority";
  import { cn } from "@/lib/utils";

  const cardVariants = cva("rounded-xl border", {
    variants: {
      variant: {
        default: "border-border bg-surface shadow-lg",
        muted: "border-border bg-surface-emphasis",
        strong:
          "text-surface-strong-foreground border-border-inverse bg-surface-strong",
        brand:
          "text-surface-strong-foreground border-border-inverse bg-surface-brand shadow-brand backdrop-blur-xl",
      },
      padded: {
        true: "p-6",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padded: false,
    },
  });

  export type CardProps = React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof cardVariants>;

  export function Card({ className, variant, padded, ...props }: CardProps) {
    return (
      <div className={cn(cardVariants({ variant, padded }), className)} {...props} />
    );
  }

  export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex flex-col gap-2", className)} {...props} />;
  }

  export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h2
        className={cn("text-[length:var(--text-title)] leading-none font-black tracking-[-0.04em]", className)}
        {...props}
      />
    );
  }

  export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
      <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />
    );
  }

  export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn(className)} {...props} />;
  }
  ```

- [ ] **Step 5.4: Migrate SurfacePanel consumers to Card**

  Open `src/components/dashboard/dashboard-sidebar.tsx`. The two `Card` usages that reference SurfacePanel styling via className overrides now use the `variant` prop instead:

  ```tsx
  // Before (dashboard-sidebar.tsx line 44):
  <Card className="theme-text-strong border-[color:var(--border-inverse)] bg-[image:var(--brand-gradient)] shadow-[var(--shadow-brand)]">

  // After:
  <Card variant="brand">
  ```

  Check `src/components/dashboard/dashboard-hero.tsx` and any other file that imports from `surface-panel` and update to import `Card` with the appropriate variant instead.

- [ ] **Step 5.5: Run tests**

  ```bash
  npm run test -- src/components/ui/composition.test.tsx
  npm run test -- src/components/dashboard.test.tsx
  ```
  Expected: Pass. If composition tests assert on SurfacePanel classes — they do (see `composition.test.tsx` lines 174–217) — those tests will fail. **Do not update the tests yet.** Note the failures; they will be fixed in Task 11.

- [ ] **Step 5.6: Commit**

  ```bash
  git add src/components/ui/card.tsx src/components/dashboard/dashboard-sidebar.tsx src/components/dashboard/dashboard-hero.tsx
  git commit -m "feat(ui): migrate Card to shadcn with CVA variants, absorb SurfacePanel"
  ```

---

## Task 6: Separator + ScrollArea Migration

**Files:**
- Modify: `src/components/ui/separator.tsx`
- Modify: `src/components/ui/scroll-area.tsx`

Both already wrap Radix primitives — this is a near drop-in replacement that cleans up the class strings.

### Steps

- [ ] **Step 6.1: Install shadcn Separator and ScrollArea**

  ```bash
  npx shadcn@latest add separator scroll-area
  ```

- [ ] **Step 6.2: Verify generated Separator uses token classes**

  Open `src/components/ui/separator.tsx`. The generated version will use `bg-border` by default. The current code uses `bg-[color:var(--border)]` and callers pass `className="bg-[color:var(--border)]"` explicitly. Since `bg-border` now maps to the same token, callers no longer need the override.

  In `src/components/dashboard/dashboard-hero.tsx`, update:
  ```tsx
  // Before:
  <Separator className="bg-[color:var(--border)]" />
  // After:
  <Separator />
  ```

- [ ] **Step 6.3: Verify generated ScrollArea**

  The shadcn ScrollArea uses `bg-border` for the thumb. Confirm the token mapping is correct — `border` points to `var(--border)` via the `@theme inline` color mapping.

- [ ] **Step 6.4: Run tests**

  ```bash
  npm run test
  ```
  Expected: Pass (Separator and ScrollArea don't have dedicated tests — the dashboard tests cover their consumers).

- [ ] **Step 6.5: Commit**

  ```bash
  git add src/components/ui/separator.tsx src/components/ui/scroll-area.tsx src/components/dashboard/dashboard-hero.tsx
  git commit -m "feat(ui): migrate Separator and ScrollArea to shadcn"
  ```

---

## Task 7: Form Components (Input + Label)

**Files:**
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/primitives/form-field.tsx`
- Modify: `src/components/login/login-screen.tsx`

The current `src/components/ui/form.tsx` exports four things: `Field`, `FieldLabel`, `Input`, `FieldError`. After this task, `Input` and `Label` live in `ui/` (shadcn), while `Field` and `FieldError` move to `primitives/form-field.tsx`.

### Steps

- [ ] **Step 7.1: Run form and login tests to baseline**

  ```bash
  npm run test -- src/components/ui/form.test.tsx
  npm run test -- src/components/login/login-screen.test.tsx
  ```

- [ ] **Step 7.2: Install shadcn Input and Label**

  ```bash
  npx shadcn@latest add input label
  ```

- [ ] **Step 7.3: Update shadcn Input to match project styling**

  The shadcn `Input` uses `--input` for border and standard sizing. Update `src/components/ui/input.tsx` to preserve the project's `invalid` prop, focus ring with `--frontend`/`--backend` colors, and height token:

  ```tsx
  import * as React from "react";
  import { cn } from "@/lib/utils";

  export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    invalid?: boolean;
  };

  const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, invalid = false, "aria-invalid": ariaInvalid, type, ...props }, ref) => {
      return (
        <input
          type={type}
          ref={ref}
          aria-invalid={invalid || ariaInvalid ? true : undefined}
          className={cn(
            "h-13 w-full rounded-md border bg-surface-emphasis px-4 text-foreground outline-none transition disabled:cursor-not-allowed disabled:bg-surface-muted",
            invalid
              ? "border-danger focus:border-danger focus:ring-2 focus:ring-backend-soft"
              : "border-border focus:border-frontend focus:ring-2 focus:ring-frontend-soft",
            className,
          )}
          {...props}
        />
      );
    },
  );
  Input.displayName = "Input";

  export { Input };
  ```

- [ ] **Step 7.4: Create `src/components/primitives/form-field.tsx`**

  Extract `Field` and `FieldError` from `form.tsx`:

  ```tsx
  import * as React from "react";
  import { cn } from "@/lib/utils";

  export function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("space-y-2", className)} {...props} />;
  }

  export function FieldError({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    if (!children) return null;
    return (
      <p className={cn("text-sm text-danger", className)} {...props}>
        {children}
      </p>
    );
  }
  ```

- [ ] **Step 7.5: Update `login-screen.tsx` imports**

  ```tsx
  // Before:
  import { Field, FieldError, FieldLabel, Input } from "@/components/ui/form";

  // After:
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Field, FieldError } from "@/components/primitives/form-field";
  ```

  Replace `<FieldLabel htmlFor="...">` with `<Label htmlFor="...">` throughout the component. Update any Label styling to match `FieldLabel` (text-sm font-semibold text-muted-foreground).

- [ ] **Step 7.6: Update `form.test.tsx` imports and assertions**

  `src/components/ui/form.test.tsx` currently imports `{ FieldError, FieldLabel, Input }` from `@/components/ui/form`. Update to the new split locations:

  ```tsx
  // Before:
  import { FieldError, FieldLabel, Input } from "@/components/ui/form";

  // After:
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { FieldError } from "@/components/primitives/form-field";
  ```

  Replace all `FieldLabel` references in the test with `Label` (same API — accepts `htmlFor`).

- [ ] **Step 7.7: Run tests**

  ```bash
  npm run test -- src/components/ui/form.test.tsx
  npm run test -- src/components/login/login-screen.test.tsx
  ```
  Expected: Pass.

- [ ] **Step 7.8: Commit**

  ```bash
  git add src/components/ui/input.tsx src/components/ui/label.tsx src/components/primitives/form-field.tsx src/components/login/login-screen.tsx
  git commit -m "feat(ui): migrate Input and Label to shadcn, extract Field and FieldError to primitives"
  ```

---

## Task 8: Decouple SectionHeader from Card

**Files:**
- Modify: `src/components/ui/section-header.tsx`

`SectionHeader` currently imports and renders `CardHeader`, `CardTitle`, `CardDescription` from `card.tsx`. After Task 5, those subcomponents have different class defaults. This task makes `SectionHeader` self-contained with its own HTML and Tailwind classes.

### Steps

- [ ] **Step 8.1: Run composition tests to see current state**

  ```bash
  npm run test -- src/components/ui/composition.test.tsx
  ```

- [ ] **Step 8.2: Rewrite SectionHeader internals**

  Replace `src/components/ui/section-header.tsx`:

  ```tsx
  import type { HTMLAttributes, ReactNode } from "react";
  import { Badge } from "@/components/ui/badge";
  import { cn } from "@/lib/utils";

  type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
    eyebrow: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    inverse?: boolean;
    hideTitle?: boolean;
    titleClassName?: string;
    descriptionClassName?: string;
  };

  export function SectionHeader({
    eyebrow,
    title,
    description,
    actions,
    inverse = false,
    hideTitle = false,
    titleClassName,
    descriptionClassName,
    className,
    ...props
  }: SectionHeaderProps) {
    return (
      <div
        className={cn(
          "flex flex-col gap-4",
          actions ? "lg:flex-row lg:items-end lg:justify-between" : null,
          className,
        )}
        {...props}
      >
        <div className="flex flex-col gap-3">
          <Badge
            variant={inverse ? "outline" : "default"}
            className={
              inverse
                ? "text-surface-strong-foreground-muted border-border-inverse bg-surface-strong-muted"
                : undefined
            }
          >
            {eyebrow}
          </Badge>
          <h2
            className={cn(
              "text-[length:var(--text-title)] leading-none font-black tracking-[-0.04em]",
              hideTitle && "sr-only",
              titleClassName,
            )}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={cn(
                "text-sm leading-6 text-muted-foreground",
                inverse && "text-surface-strong-foreground-muted",
                descriptionClassName,
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    );
  }
  ```

- [ ] **Step 8.3: Run composition tests**

  ```bash
  npm run test -- src/components/ui/composition.test.tsx
  ```

  The test at line 41–42 asserts `expect(eyebrow).toHaveClass("border-[color:var(--border-inverse)]")` — this will fail after the rewrite since the inverse Badge now uses different classes. **Note the failure — it will be fixed in Task 11.** Other tests (presence of text, heading roles, `sr-only`, custom className passthrough) should still pass.

- [ ] **Step 8.4: Commit**

  ```bash
  git add src/components/ui/section-header.tsx
  git commit -m "feat(primitives): decouple SectionHeader from Card internals"
  ```

---

## Task 9: Move Custom Components to `primitives/`

**Files:**
- Create: `src/components/primitives/stat-tile.tsx` (move from `ui/`)
- Create: `src/components/primitives/icon-callout.tsx` (move from `ui/`)
- Create: `src/components/primitives/section-header.tsx` (move from `ui/`)
- Modify: All files that import from `@/components/ui/stat-tile`, `icon-callout`, or `section-header`

### Steps

- [ ] **Step 9.1: Create `src/components/primitives/` directory and copy files**

  Copy the three files to their new location. Note: `section-header.tsx` at this point is already the version rewritten in Task 8 (decoupled from Card) — the copy captures the updated file:

  ```bash
  mkdir -p src/components/primitives
  cp src/components/ui/stat-tile.tsx src/components/primitives/stat-tile.tsx
  cp src/components/ui/icon-callout.tsx src/components/primitives/icon-callout.tsx
  cp src/components/ui/section-header.tsx src/components/primitives/section-header.tsx
  ```

  The originals in `ui/` remain until Task 12 — both locations coexist temporarily.

- [ ] **Step 9.2: Update all import paths**

  Find all files that import from the old `ui/` paths:

  ```bash
  grep -r "from \"@/components/ui/stat-tile\"\|from \"@/components/ui/icon-callout\"\|from \"@/components/ui/section-header\"" src/
  ```

  Update each match to use `@/components/primitives/` instead. Files expected to update:
  - `src/components/dashboard/dashboard-hero.tsx`
  - `src/components/dashboard/dashboard-sidebar.tsx`
  - `src/components/ui/composition.test.tsx` (keep old imports for now — fixed in Task 11)

- [ ] **Step 9.3: Run tests**

  ```bash
  npm run test
  ```
  Expected: Tests that were passing before this task still pass. Tests that were already failing from Tasks 5 and 8 still fail — that's expected.

- [ ] **Step 9.4: Commit**

  ```bash
  git add src/components/primitives/ src/components/dashboard/
  git commit -m "refactor: move StatTile, IconCallout, SectionHeader to components/primitives"
  ```

---

## Task 10: Update Consumer Component Class Strings

**Files:**
- Modify: `src/components/dashboard/dashboard-hero.tsx`
- Modify: `src/components/dashboard/dashboard-sidebar.tsx`
- Modify: `src/components/dashboard/recent-matches-card.tsx`
- Modify: `src/components/authenticated/app-shell.tsx`
- Modify: `src/components/login/login-screen.tsx`
- Modify: `src/components/primitives/stat-tile.tsx`
- Modify: `src/components/primitives/icon-callout.tsx`

Replace all remaining arbitrary `[var(--...)]` patterns with native Tailwind classes and the new typography utilities. Also replace `.theme-text-*` global class names with Tailwind color utilities.

**Replacement map:**

| Old class | New class |
|---|---|
| `rounded-[var(--radius-sm)]` | `rounded-sm` |
| `rounded-[var(--radius-md)]` | `rounded-md` |
| `rounded-[var(--radius-lg)]` | `rounded-lg` |
| `rounded-[var(--radius-xl)]` | `rounded-xl` |
| `rounded-[var(--radius-2xl)]` | `rounded-2xl` |
| `rounded-[var(--radius-pill)]` | `rounded-pill` |
| `shadow-[var(--shadow-sm)]` | `shadow-sm` |
| `shadow-[var(--shadow-md)]` | `shadow-md` |
| `shadow-[var(--shadow-lg)]` | `shadow-lg` |
| `shadow-[var(--shadow-brand)]` | `shadow-brand` |
| `bg-[color:var(--surface)]` | `bg-surface` |
| `bg-[color:var(--surface-emphasis)]` | `bg-surface-emphasis` |
| `bg-[color:var(--surface-muted)]` | `bg-surface-muted` |
| `bg-[color:var(--surface-strong)]` | `bg-surface-strong` |
| `bg-[color:var(--surface-brand)]` | `bg-surface-brand` |
| `bg-[color:var(--surface-success)]` | `bg-surface-success` |
| `bg-[color:var(--surface-danger)]` | `bg-surface-danger` |
| `bg-[color:var(--border)]` | `bg-border` |
| `text-[color:var(--foreground)]` | `text-foreground` |
| `text-[color:var(--foreground-soft)]` | `text-muted-foreground` |
| `text-[color:var(--foreground-inverse)]` | `text-foreground-inverse` |
| `text-[color:var(--muted-foreground)]` | `text-muted-foreground` |
| `text-[color:var(--danger)]` | `text-danger` |
| `text-[color:var(--gold)]` | `text-gold` |
| `text-[color:var(--frontend)]` | `text-frontend` |
| `text-[color:var(--backend)]` | `text-backend` |
| `border-[color:var(--border)]` | `border-border` |
| `border-[color:var(--border-strong)]` | `border-border-strong` |
| `border-[color:var(--border-inverse)]` | `border-border-inverse` |
| `border-[color:var(--gold)]` | `border-gold` |
| `border-[color:var(--frontend)]` | `border-frontend` |
| `border-[color:var(--backend)]` | `border-backend` |
| `tracking-[var(--tracking-label)]` | `tracking-label` |
| `tracking-[var(--tracking-label-wide)]` | `tracking-label-wide` |
| `text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label)]` | `label-xs` |
| `text-[length:var(--text-label)] font-semibold uppercase tracking-[var(--tracking-label)]` | `label` |
| `text-[length:var(--text-label)] font-semibold uppercase tracking-[var(--tracking-label-wide)]` | `label-wide` |
| `.theme-text-strong` | `text-surface-strong-foreground` |
| `.theme-text-strong-muted` | `text-surface-strong-foreground-muted` |
| `.theme-text-inverse` | `text-foreground-inverse` |
| `.theme-text-sidebar` | `text-sidebar-foreground` |
| `.theme-text-sidebar-muted` | `text-sidebar-foreground-muted` |
| `.theme-text-sidebar-subtle` | `text-sidebar-foreground-subtle` |

### Steps

- [ ] **Step 10.1: Update `stat-tile.tsx`**

  Replace all arbitrary values using the map above. The tone-conditional classes become:
  - `tone === "inverse"`: `border-border-inverse bg-surface-strong-muted` / label: `text-surface-strong-foreground-muted` / description: `text-surface-strong-foreground-muted`
  - default: `border-border bg-surface-emphasis` / label: `text-muted-foreground`

- [ ] **Step 10.2: Update `icon-callout.tsx`**

  Replace all arbitrary values. After update, the `theme-text-strong` and `theme-text-strong-muted` class references become `text-surface-strong-foreground` and `text-surface-strong-foreground-muted`.

- [ ] **Step 10.3: Update `dashboard-hero.tsx`**

  Replace all arbitrary values. The typography patterns (`text-[length:var(--text-label-sm)] font-semibold uppercase tracking-[var(--tracking-label-wide)]`) become `label-wide`. The `[font-family:var(--font-display)]` can become `font-display`.

- [ ] **Step 10.4: Update `dashboard-sidebar.tsx`**

  Replace remaining arbitrary values. The `theme-text-strong` on the brand Card is no longer needed since the `brand` variant on Card now handles text color.

- [ ] **Step 10.5: Update `app-shell.tsx`**

  Replace all `theme-text-sidebar*` with `text-sidebar-foreground`, `text-sidebar-foreground-muted`, `text-sidebar-foreground-subtle`. Replace `rounded-[var(--radius-pill)]` with `rounded-pill`, etc.

  Note: Many classes in `app-shell.tsx` reference `var(--app-shell-sidebar-*)` tokens directly for backgrounds, borders, and active states. These stay as arbitrary values since those specific tokens aren't in `@theme inline`. Do not add them unless they appear in more than 2–3 non-shell files.

- [ ] **Step 10.6: Update `recent-matches-card.tsx`**

  Update `src/components/dashboard/recent-matches-card.tsx`:
  - Import `SectionHeader` from `@/components/primitives/section-header`
  - Replace `border-[color:var(--border-strong)]` with `border-border-strong`
  - Replace `bg-[color:var(--surface)]/94` with `bg-surface/94`
  - Replace `rounded-[var(--radius-lg)]` with `rounded-lg`
  - Replace `bg-[color:var(--surface-emphasis)]` with `bg-surface-emphasis`
  - Replace `text-[color:var(--foreground-soft)]` with `text-muted-foreground`

- [ ] **Step 10.7: Update `login-screen.tsx`**

  Replace `rounded-[var(--radius-2xl)]`, `shadow-[var(--shadow-brand)]`, `bg-[color:var(--surface)]`, `rounded-[var(--radius-md)]`, etc. Replace `theme-text-inverse` with `text-foreground-inverse`. The `SEGMENT_BUTTON_BASE_CLASS` constant at line 54 uses `rounded-[var(--radius-sm)]` — update to `rounded-sm`.

- [ ] **Step 10.8: Run tests**

  ```bash
  npm run test -- src/components/login/login-screen.test.tsx
  npm run test -- src/components/dashboard.test.tsx
  npm run test -- src/components/authenticated/app-shell.test.tsx
  ```
  Expected: Pass. (Composition tests still have expected failures from earlier tasks.)

- [ ] **Step 10.9: Commit**

  ```bash
  git add src/components/primitives/ src/components/dashboard/ src/components/authenticated/ src/components/login/
  git commit -m "refactor(consumers): replace arbitrary Tailwind values with token classes"
  ```

---

## Task 11: Update Tests

**Files:**
- Modify: `src/components/ui/composition.test.tsx`

`composition.test.tsx` imports from old paths and asserts on class names that were changed in Tasks 5 and 8. This task brings the tests in sync with the new structure.

### Steps

- [ ] **Step 11.1: Run composition tests to see current failures**

  ```bash
  npm run test -- src/components/ui/composition.test.tsx
  ```
  Note each failing assertion.

- [ ] **Step 11.2: Update import paths**

  ```tsx
  // Before:
  import { IconCallout } from "@/components/ui/icon-callout";
  import { SectionHeader } from "@/components/ui/section-header";
  import { StatTile } from "@/components/ui/stat-tile";
  import { SurfacePanel } from "@/components/ui/surface-panel";

  // After:
  import { IconCallout } from "@/components/primitives/icon-callout";
  import { SectionHeader } from "@/components/primitives/section-header";
  import { StatTile } from "@/components/primitives/stat-tile";
  import { Card } from "@/components/ui/card";
  ```

- [ ] **Step 11.3: Update class assertions to match new class names**

  **Line 41–42** — inverse Badge on SectionHeader:
  ```tsx
  // Before:
  expect(eyebrow).toHaveClass("border-[color:var(--border-inverse)]");
  expect(description).toHaveClass("theme-text-strong-muted");

  // After:
  expect(eyebrow).toHaveClass("border-border-inverse");
  expect(description).toHaveClass("text-surface-strong-foreground-muted");
  ```

  **Line 74–75** — StatTile inverse tone:
  ```tsx
  // Before:
  expect(screen.getByText("Ambiente")).toHaveClass("theme-text-strong-muted");
  expect(screen.getByText("mesa oficial")).toHaveClass("theme-text-strong-muted");

  // After:
  expect(screen.getByText("Ambiente")).toHaveClass("text-surface-strong-foreground-muted");
  expect(screen.getByText("mesa oficial")).toHaveClass("text-surface-strong-foreground-muted");
  ```

  **Line 102–103** — IconCallout success tone:
  ```tsx
  // Before:
  expect(callout).toHaveClass("bg-[color:var(--surface-success)]");
  expect(screen.getByText("Base padrao")).toHaveClass("text-[color:var(--foreground-soft)]");

  // After:
  expect(callout).toHaveClass("bg-surface-success");
  expect(screen.getByText("Base padrao")).toHaveClass("text-muted-foreground");
  ```

  **Line 115–116** — IconCallout strong tone:
  ```tsx
  // Before:
  expect(callout).toHaveClass("border-[color:var(--border-inverse)]");
  expect(screen.getByText("Base forte")).toHaveClass("theme-text-strong-muted");

  // After:
  expect(callout).toHaveClass("border-border-inverse");
  expect(screen.getByText("Base forte")).toHaveClass("text-surface-strong-foreground-muted");
  ```

  **Lines 166–172** — SurfacePanel custom className test: replace `SurfacePanel` with `Card`:
  ```tsx
  // Before:
  rerender(<SurfacePanel className="custom-panel" data-testid="panel">Conteúdo</SurfacePanel>);
  expect(screen.getByTestId("panel")).toHaveClass("custom-panel");

  // After:
  rerender(<Card className="custom-panel" data-testid="panel">Conteúdo</Card>);
  expect(screen.getByTestId("panel")).toHaveClass("custom-panel");
  ```

  **Lines 174–217** — SurfacePanel variant and padded tests: replace `SurfacePanel` with `Card` and update class assertions:
  ```tsx
  // brand variant:
  expect(panel).toHaveClass("bg-surface-brand");
  expect(panel).toHaveClass("shadow-brand");

  // strong variant:
  expect(panel).toHaveClass("bg-surface-strong");
  expect(panel).toHaveClass("text-surface-strong-foreground");

  // default variant:
  expect(panel).toHaveClass("bg-surface");
  expect(panel).toHaveClass("shadow-lg");

  // muted variant:
  expect(panel).toHaveClass("bg-surface-emphasis");
  expect(panel).toHaveClass("border-border");
  ```

- [ ] **Step 11.4: Run composition tests**

  ```bash
  npm run test -- src/components/ui/composition.test.tsx
  ```
  Expected: All pass.

- [ ] **Step 11.5: Run full test suite**

  ```bash
  npm run test
  ```
  Expected: All tests pass.

- [ ] **Step 11.6: Commit**

  ```bash
  git add src/components/ui/composition.test.tsx
  git commit -m "test(composition): update assertions for new token classes and shadcn components"
  ```

---

## Task 12: Remove Dead Code + Final Verification

**Files:**
- Delete: `src/components/ui/surface-panel.tsx`
- Delete: `src/components/ui/form.tsx`
- Delete: `src/components/ui/stat-tile.tsx` (now in primitives/)
- Delete: `src/components/ui/icon-callout.tsx` (now in primitives/)
- Delete: `src/components/ui/section-header.tsx` (now in primitives/)
- Modify: `src/app/globals.css` — remove `.theme-text-*` global classes

### Steps

- [ ] **Step 12.1: Confirm no remaining imports of dead files**

  ```bash
  grep -r "from \"@/components/ui/surface-panel\"" src/
  grep -r "from \"@/components/ui/form\"" src/
  grep -r "from \"@/components/ui/stat-tile\"" src/
  grep -r "from \"@/components/ui/icon-callout\"" src/
  grep -r "from \"@/components/ui/section-header\"" src/
  ```

  Expected: No output. If any match is found, update the import before proceeding.

- [ ] **Step 12.2: Confirm no remaining `.theme-text-*` usage**

  ```bash
  grep -r "theme-text-" src/
  ```

  Expected: No output. If any match is found, apply the replacement map from Task 10 before proceeding.

- [ ] **Step 12.3: Delete the dead files**

  ```bash
  rm src/components/ui/surface-panel.tsx
  rm src/components/ui/form.tsx
  rm src/components/ui/stat-tile.tsx
  rm src/components/ui/icon-callout.tsx
  rm src/components/ui/section-header.tsx
  ```

- [ ] **Step 12.4: Remove `.theme-text-*` global CSS classes from globals.css**

  Delete lines 199–221 in `src/app/globals.css` (the `.theme-text-inverse`, `.theme-text-strong`, `.theme-text-strong-muted`, `.theme-text-sidebar`, `.theme-text-sidebar-muted`, `.theme-text-sidebar-subtle` blocks).

- [ ] **Step 12.5: Run full test suite**

  ```bash
  npm run test
  ```
  Expected: All pass.

- [ ] **Step 12.6: Run typecheck and lint**

  ```bash
  npm run typecheck
  npm run lint
  ```
  Expected: No errors.

- [ ] **Step 12.7: Run production build**

  ```bash
  npm run build
  ```
  Expected: Build succeeds with no warnings about unknown classes.

- [ ] **Step 12.8: Final commit**

  ```bash
  git add -A
  git commit -m "feat(design-system): complete shadcn migration and design system refactor"
  ```
