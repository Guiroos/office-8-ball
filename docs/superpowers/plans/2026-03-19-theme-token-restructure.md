# Theme Token Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate CSS primitives into `tokens.css`, fix `--primary` to point to green, and rename `--frontend`/`--backend` tokens to `--team-alpha`/`--team-beta` throughout the codebase.

**Architecture:** Tier 1 raw literals (hex/rgba/shadow values) live in `src/app/tokens.css`; Tier 2–3 semantic and component tokens in `src/app/globals.css` use only `var()` references. Class Variance Authority variants `frontend`/`backend` in Button and Badge are renamed to `team-alpha`/`team-beta`; a `TEAM_BUTTON_VARIANT` map in dashboard bridges domain IDs to the new variant names.

**Tech Stack:** Tailwind CSS 4.x (`@theme`/`@theme inline`), CVA, TypeScript, Vitest/Testing Library.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/tokens.css` | Create | Tier 1: all raw color scales, shadow values, font sizes, surface/border/gradient/app-shell literals |
| `src/app/globals.css` | Modify | Add `@import "./tokens.css"`, remove all hex/rgba literals, fix `--primary`, rename `--frontend`/`--backend` → `--team-alpha`/`--team-beta`, update `@theme inline` |
| `src/components/ui/button.tsx` | Modify | Rename CVA variants `frontend`→`team-alpha`, `backend`→`team-beta` |
| `src/components/ui/badge.tsx` | Modify | Rename CVA variants `frontend`→`team-alpha`, `backend`→`team-beta` |
| `src/components/ui/input.tsx` | Modify | Update focus ring classes |
| `src/components/dashboard/index.tsx` | Modify | Add `TEAM_BUTTON_VARIANT` map, update CVA classes, update textarea focus classes |
| `src/components/dashboard.test.tsx` | Modify | Update mock `accent`/`accentSoft` and class assertions (TDD: update before implementation) |
| `src/components/primitives/icon-callout.tsx` | Modify | `text-frontend` → `text-primary` |
| `src/components/authenticated/placeholder-page.tsx` | Modify | `bg-frontend` → `bg-primary` |
| `src/components/login/login-screen.tsx` | Modify | Segment button and error div class updates |
| `src/lib/constants.ts` | Modify | Update `accent`/`accentSoft` CSS var references |
| `techspec/theme-system.md` | Modify | Reflect two-file architecture and token renaming |

---

### Task 1: Create `src/app/tokens.css` — color scales + extracted literals

**Files:**
- Create: `src/app/tokens.css`

- [ ] **Step 1: Create tokens.css with the five color palettes**

```css
/* src/app/tokens.css */
/* TIER 1 — Raw primitives. Only literal values here: hex, rgb, clamp(), shadow strings. */
/* globals.css imports this file and references these via var() only. */

:root {
  /* Green — application identity */
  --green-50: #edf6f2;
  --green-100: #d2e9e0;
  --green-200: #a9d4c3;
  --green-300: #7dbfa8;
  --green-400: #4eaa8e;
  --green-500: #2b9178;
  --green-600: #1f7866;
  --green-700: #166657;
  --green-800: #0f4d41;
  --green-900: #09342c;
  --green-950: #041c18;

  /* Blue — team-alpha color */
  --blue-50: #eff5fb;
  --blue-100: #d9eaf7;
  --blue-200: #b4d4ef;
  --blue-300: #8ebfe7;
  --blue-400: #5b9bd5;
  --blue-500: #3a7fc1;
  --blue-600: #2e6aab;
  --blue-700: #2a5f9c;
  --blue-800: #1f4a7a;
  --blue-900: #153258;
  --blue-950: #0c1d35;

  /* Red — team-beta color */
  --red-50: #fdf0ee;
  --red-100: #efd6d1;
  --red-200: #e0b0a9;
  --red-300: #d08c82;
  --red-400: #d86f61;
  --red-500: #c05245;
  --red-600: #b0463a;
  --red-700: #9f3d31;
  --red-800: #7a2e25;
  --red-900: #541f19;
  --red-950: #350f0c;

  /* Gold — highlights, rings, icons */
  --gold-50: #fef9ed;
  --gold-100: #fbefc9;
  --gold-200: #f6de95;
  --gold-300: #f0cc62;
  --gold-400: #e5bc54;
  --gold-500: #c7951f;
  --gold-600: #a97a16;
  --gold-700: #8b620f;
  --gold-800: #6d4c09;
  --gold-900: #4f3705;
  --gold-950: #281d04;

  /* Warm Neutral — backgrounds, foregrounds, surfaces */
  --neutral-50: #fffcf5;
  --neutral-100: #f8f1e6;
  --neutral-200: #f1e8d8;
  --neutral-300: #dcc7a4;
  --neutral-400: #c9ab7e;
  --neutral-500: #9c7a5a;
  --neutral-600: #7a5f45;
  --neutral-700: #5c4d40;
  --neutral-800: #3f3329;
  --neutral-900: #1f1b17;
  --neutral-950: #07110d;

  /* Font sizes */
  --fz-label-sm: 0.68rem;
  --fz-label: 0.72rem;
  --fz-title: clamp(1.9rem, 4vw, 2.7rem);
  --fz-display-sm: clamp(2rem, 4vw, 2.75rem);
  --fz-display-md: clamp(3rem, 4vw, 4.8rem);
  --fz-display-lg: clamp(3.5rem, 10vw, 7.5rem);
  --fz-score: clamp(4rem, 12vw, 6rem);

  /* Shadow values */
  --shadow-sm-value: 0 14px 30px rgba(13, 18, 14, 0.18);
  --shadow-md-value: 0 20px 45px rgba(19, 74, 50, 0.22);
  --shadow-lg-value: 0 24px 60px rgba(49, 37, 27, 0.12);
  --shadow-brand-value: 0 20px 45px rgba(19, 74, 50, 0.28);

  /* Surface literals */
  --surface-raw: rgba(255, 251, 245, 0.96);
  --surface-muted-raw: rgba(255, 248, 238, 0.84);
  --surface-emphasis-raw: rgba(255, 254, 250, 0.97);
  --surface-strong-raw: rgba(32, 27, 23, 0.9);
  --surface-strong-muted-raw: rgba(255, 246, 231, 0.18);
  --surface-strong-foreground-raw: #fffbf3;
  --surface-strong-foreground-muted-raw: rgba(255, 251, 243, 0.92);
  --surface-success-raw: #e5f1e7;
  --surface-danger-raw: #fbe5e1;
  --surface-brand-raw: rgba(18, 43, 32, 0.82);

  /* Border literals */
  --border-raw: rgba(43, 33, 26, 0.16);
  --border-strong-raw: rgba(43, 33, 26, 0.24);
  --border-inverse-raw: rgba(255, 255, 255, 0.14);

  /* Ring */
  --ring-raw: rgba(199, 149, 31, 0.9);

  /* Gold soft */
  --gold-soft-raw: rgba(199, 149, 31, 0.16);

  /* Gradient literals */
  --hero-gradient-raw: linear-gradient(135deg, rgba(255, 252, 246, 0.92), rgba(227, 211, 180, 0.82));
  --brand-gradient-raw: linear-gradient(135deg, rgba(26, 110, 91, 0.98), rgba(13, 56, 46, 0.96));
  --page-gradient-raw:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.5), transparent 34%),
    radial-gradient(circle at 85% 0%, rgba(199, 149, 31, 0.2), transparent 26%),
    linear-gradient(135deg, #f8f1e6 0%, #ebdfca 46%, #dbc39d 100%);
  --page-grid-raw: rgba(255, 255, 255, 0.06);
  --content-gradient-raw:
    radial-gradient(circle at top right, rgba(199, 149, 31, 0.16), transparent 22%),
    radial-gradient(circle at left 20%, rgba(22, 102, 87, 0.14), transparent 26%);

  /* App shell literals */
  --app-shell-sidebar-raw: rgba(15, 47, 36, 0.96);
  --app-shell-sidebar-border-raw: rgba(255, 255, 255, 0.12);
  --app-shell-sidebar-foreground-raw: #fffbf3;
  --app-shell-sidebar-foreground-muted-raw: rgba(255, 251, 243, 0.9);
  --app-shell-sidebar-foreground-subtle-raw: rgba(255, 251, 243, 0.74);
  --app-shell-sidebar-hover-raw: rgba(255, 255, 255, 0.12);
  --app-shell-sidebar-active-raw: rgba(255, 246, 231, 0.14);
  --app-shell-sidebar-active-strong-raw: rgba(255, 246, 231, 0.26);
  --app-shell-sidebar-accent-raw: #b6f0d8;
  --app-shell-sidebar-menu-raw: rgba(18, 55, 42, 0.98);
  --app-shell-avatar-ring-raw: rgba(11, 34, 27, 0.96);
  --app-shell-status-raw: #4ade80;

  /* Selection */
  --selection-bg: rgba(199, 149, 31, 0.25);

  /* Background literals not on neutral scale (light has exact neutral matches) */
  --background-subtle-raw: #f8f1e6;
  --background-strong-raw: #dcc7a4;
}

.dark {
  /* Shadow overrides */
  --shadow-sm-value: 0 14px 30px rgba(0, 0, 0, 0.3);
  --shadow-md-value: 0 20px 45px rgba(0, 0, 0, 0.24);
  --shadow-lg-value: 0 24px 60px rgba(49, 37, 27, 0.12);
  --shadow-brand-value: 0 20px 45px rgba(0, 0, 0, 0.28);

  /* Surface dark overrides */
  --surface-raw: rgba(10, 20, 16, 0.92);
  --surface-muted-raw: rgba(255, 255, 255, 0.09);
  --surface-emphasis-raw: rgba(18, 35, 28, 0.94);
  --surface-strong-raw: rgba(235, 242, 231, 0.14);
  --surface-strong-muted-raw: rgba(255, 255, 255, 0.12);
  --surface-strong-foreground-raw: #f7f8f2;
  --surface-strong-foreground-muted-raw: rgba(247, 248, 242, 0.72);
  --surface-success-raw: rgba(31, 78, 57, 0.62);
  --surface-danger-raw: rgba(117, 48, 39, 0.46);
  --surface-brand-raw: rgba(12, 33, 24, 0.82);

  /* Border dark overrides */
  --border-raw: rgba(214, 229, 219, 0.16);
  --border-strong-raw: rgba(214, 229, 219, 0.26);

  /* Ring dark */
  --ring-raw: rgba(229, 188, 84, 0.88);

  /* Gold soft dark */
  --gold-soft-raw: rgba(229, 188, 84, 0.18);

  /* Gradient dark overrides */
  --hero-gradient-raw: linear-gradient(135deg, rgba(16, 31, 24, 0.92), rgba(27, 47, 39, 0.86));
  --brand-gradient-raw: linear-gradient(135deg, rgba(18, 67, 56, 0.94), rgba(7, 19, 15, 0.98));
  --page-gradient-raw:
    radial-gradient(circle at top left, rgba(69, 118, 96, 0.22), transparent 30%),
    radial-gradient(circle at 85% 0%, rgba(229, 188, 84, 0.12), transparent 24%),
    linear-gradient(150deg, #08110d 0%, #0b1712 42%, #13241d 100%);
  --page-grid-raw: rgba(255, 255, 255, 0.05);
  --content-gradient-raw:
    radial-gradient(circle at top right, rgba(229, 188, 84, 0.1), transparent 22%),
    radial-gradient(circle at left 18%, rgba(63, 196, 157, 0.08), transparent 24%);

  /* App shell dark overrides */
  --app-shell-sidebar-raw: rgba(8, 21, 16, 0.96);
  --app-shell-sidebar-border-raw: rgba(214, 229, 219, 0.1);
  --app-shell-sidebar-foreground-raw: #f7f8f2;
  --app-shell-sidebar-foreground-muted-raw: rgba(247, 248, 242, 0.74);
  --app-shell-sidebar-foreground-subtle-raw: rgba(247, 248, 242, 0.5);
  --app-shell-sidebar-hover-raw: rgba(255, 255, 255, 0.06);
  --app-shell-sidebar-active-raw: rgba(63, 196, 157, 0.18);
  --app-shell-sidebar-active-strong-raw: #21634f;
  --app-shell-sidebar-accent-raw: #7ee2bc;
  --app-shell-sidebar-menu-raw: rgba(10, 25, 19, 0.98);
  --app-shell-avatar-ring-raw: rgba(8, 21, 16, 0.98);

  /* Dark background values not on neutral scale */
  --background-subtle-raw: #0c1914;
  --background-strong-raw: #13241d;

  /* Dark foreground values */
  --foreground-raw: #edf2e7;
  --foreground-soft-raw: #dbe4d5;
  --foreground-inverse-raw: #0b1510;
  --muted-foreground-raw: #9eb2a6;

  /* Alpha tokens for team-soft in dark mode (rgba equivalents of blue-100/red-100) */
  --blue-100-alpha: rgba(91, 155, 213, 0.22);
  --red-100-alpha: rgba(216, 111, 97, 0.24);
}
```

- [ ] **Step 2: Verify file exists**

Run: `ls src/app/tokens.css`
Expected: file listed

- [ ] **Step 3: Commit**

```bash
git add src/app/tokens.css
git commit -m "feat(theme): add tokens.css with full color scales and extracted raw literals"
```

---

### Task 2: Rewrite `src/app/globals.css` — semantic layer only

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Read globals.css**

Read `src/app/globals.css` to confirm current content before editing.

> Replace the entire `:root` and `.dark` blocks. Keep `@theme`, `@theme inline`, `@utility`, and base CSS sections intact — those blocks already use `var(--shadow-sm-value)` etc., so moving the raw shadow vars to `tokens.css` is sufficient; no changes needed in `@theme inline` for shadows.

- [ ] **Step 2: Update globals.css**

Replace `:root` with:

```css
@import "tailwindcss";
@import "./tokens.css";

:root {
  color-scheme: light;

  /* Backgrounds */
  --background: var(--neutral-200);
  --background-subtle: var(--background-subtle-raw);
  --background-strong: var(--background-strong-raw);

  /* Foregrounds */
  --foreground: var(--neutral-900);
  --foreground-soft: var(--neutral-800);
  --foreground-inverse: var(--neutral-50);
  --muted-foreground: var(--neutral-700);

  /* Surfaces */
  --surface: var(--surface-raw);
  --surface-muted: var(--surface-muted-raw);
  --surface-emphasis: var(--surface-emphasis-raw);
  --surface-strong: var(--surface-strong-raw);
  --surface-strong-muted: var(--surface-strong-muted-raw);
  --surface-strong-foreground: var(--surface-strong-foreground-raw);
  --surface-strong-foreground-muted: var(--surface-strong-foreground-muted-raw);
  --surface-success: var(--surface-success-raw);
  --surface-danger: var(--surface-danger-raw);
  --surface-brand: var(--surface-brand-raw);

  /* Borders */
  --border: var(--border-raw);
  --border-strong: var(--border-strong-raw);
  --border-inverse: var(--border-inverse-raw);

  /* Ring */
  --ring: var(--ring-raw);

  /* Team tokens */
  --team-alpha: var(--blue-700);
  --team-alpha-soft: var(--blue-100);
  --team-beta: var(--red-700);
  --team-beta-soft: var(--red-100);

  /* Accent colors */
  --danger: var(--red-700);
  --gold: var(--gold-500);
  --gold-soft: var(--gold-soft-raw);

  /* Gradients */
  --hero-gradient: var(--hero-gradient-raw);
  --brand-gradient: var(--brand-gradient-raw);
  --page-gradient: var(--page-gradient-raw);
  --page-grid: var(--page-grid-raw);

  /* App shell */
  --app-shell-sidebar: var(--app-shell-sidebar-raw);
  --app-shell-sidebar-border: var(--app-shell-sidebar-border-raw);
  --app-shell-sidebar-foreground: var(--app-shell-sidebar-foreground-raw);
  --app-shell-sidebar-foreground-muted: var(--app-shell-sidebar-foreground-muted-raw);
  --app-shell-sidebar-foreground-subtle: var(--app-shell-sidebar-foreground-subtle-raw);
  --app-shell-sidebar-hover: var(--app-shell-sidebar-hover-raw);
  --app-shell-sidebar-active: var(--app-shell-sidebar-active-raw);
  --app-shell-sidebar-active-strong: var(--app-shell-sidebar-active-strong-raw);
  --app-shell-sidebar-accent: var(--app-shell-sidebar-accent-raw);
  --app-shell-sidebar-menu: var(--app-shell-sidebar-menu-raw);
  --app-shell-avatar-ring: var(--app-shell-avatar-ring-raw);
  --app-shell-status: var(--app-shell-status-raw);
  --app-shell-content-gradient: var(--content-gradient-raw);

  /* shadcn aliases */
  --primary: var(--green-700);
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

Replace `.dark` with:

```css
.dark {
  color-scheme: dark;

  /* Override backgrounds */
  --background: var(--neutral-950);
  --background-subtle: var(--background-subtle-raw);
  --background-strong: var(--background-strong-raw);

  /* Override foregrounds */
  --foreground: var(--foreground-raw);
  --foreground-soft: var(--foreground-soft-raw);
  --foreground-inverse: var(--foreground-inverse-raw);
  --muted-foreground: var(--muted-foreground-raw);

  /* Team token dark overrides */
  --team-alpha: var(--blue-400);
  --team-alpha-soft: var(--blue-100-alpha);
  --team-beta: var(--red-400);
  --team-beta-soft: var(--red-100-alpha);

  /* Accent overrides */
  --danger: var(--red-400);
  --gold: var(--gold-400);

  /* shadcn primary stays green */
  --primary: var(--green-700);
}
```

Update `@theme inline` block — remove `--color-frontend*` / `--color-backend*` lines, add team-alpha/beta:

```css
  /* replace these four lines: */
  --color-frontend: var(--frontend);
  --color-frontend-soft: var(--frontend-soft);
  --color-backend: var(--backend);
  --color-backend-soft: var(--backend-soft);

  /* with: */
  --color-team-alpha: var(--team-alpha);
  --color-team-alpha-soft: var(--team-alpha-soft);
  --color-team-beta: var(--team-beta);
  --color-team-beta-soft: var(--team-beta-soft);
```

Update `::selection` rule to use the token:

```css
::selection {
  background: var(--selection-bg);
}
```

- [ ] **Step 3: Verify no hex/rgba literals remain in globals.css**

Run: `grep -n '#\|rgba\|rgb(' src/app/globals.css`
Expected: zero matches

- [ ] **Step 4: Verify no --frontend / --backend tokens remain in globals.css**

Run: `grep -n 'frontend\|backend' src/app/globals.css`
Expected: zero matches

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): restructure globals.css to semantic layer only, fix --primary, rename team tokens"
```

---

### Task 3: Update `src/components/ui/button.tsx` — rename CVA variants

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Read button.tsx**

Read `src/components/ui/button.tsx` to confirm current variant keys before editing.

- [ ] **Step 2: Rename frontend → team-alpha, backend → team-beta**

```tsx
// before
frontend:
  "bg-frontend text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-offset-background",
backend:
  "bg-backend text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-offset-background",

// after
"team-alpha":
  "bg-team-alpha text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-offset-background",
"team-beta":
  "bg-team-beta text-foreground-inverse shadow-sm hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-offset-background",
```

Note: CVA variant keys with hyphens require quoted keys in the object literal.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat(theme): rename button variants frontend→team-alpha, backend→team-beta"
```

---

### Task 4: Update `src/components/ui/badge.tsx` — rename CVA variants

**Files:**
- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1: Read badge.tsx first**

Read `src/components/ui/badge.tsx` to confirm current variant class names before editing.

- [ ] **Step 2: Rename frontend → team-alpha, backend → team-beta**

```tsx
// before
frontend: "border-frontend bg-frontend-soft text-frontend",
backend: "border-backend bg-backend-soft text-backend",

// after
"team-alpha": "border-team-alpha bg-team-alpha-soft text-team-alpha",
"team-beta": "border-team-beta bg-team-beta-soft text-team-beta",
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat(theme): rename badge variants frontend→team-alpha, backend→team-beta"
```

---

### Task 5: Update dashboard — TDD first

**Files:**
- Modify: `src/components/dashboard.test.tsx` (first)
- Modify: `src/components/dashboard/index.tsx` (second)

- [ ] **Step 1: Read dashboard.test.tsx and dashboard/index.tsx**

Read `src/components/dashboard.test.tsx` and `src/components/dashboard/index.tsx` to confirm exact line content before editing.

- [ ] **Step 2: Update test mocks and assertions in dashboard.test.tsx**

Find and update these lines:

```tsx
// Mock TEAMS accent values (lines ~20-31)
// before:
accent: "var(--frontend)",
accentSoft: "var(--frontend-soft)",
// ...
accent: "var(--backend)",
accentSoft: "var(--backend-soft)",

// after:
accent: "var(--team-alpha)",
accentSoft: "var(--team-alpha-soft)",
// ...
accent: "var(--team-beta)",
accentSoft: "var(--team-beta-soft)",
```

```tsx
// Class assertions (lines ~198-202)
// before:
expect(frontendCard).toHaveClass("bg-frontend-soft");
expect(backendCard).toHaveClass("bg-backend-soft");

// after:
expect(frontendCard).toHaveClass("bg-team-alpha-soft");
expect(backendCard).toHaveClass("bg-team-beta-soft");
```

- [ ] **Step 3: Run tests to confirm failure**

Run: `npm run test -- src/components/dashboard.test.tsx`
Expected: FAIL — class assertions fail because implementation still uses old classes

- [ ] **Step 4: Update dashboard/index.tsx**

3a. Add `TEAM_BUTTON_VARIANT` map after imports:

```tsx
const TEAM_BUTTON_VARIANT = {
  frontend: "team-alpha",
  backend: "team-beta",
} as const;
```

3b. Update `teamScoreCardVariants`:

```tsx
// before
frontend: "bg-frontend-soft",
backend: "bg-backend-soft",

// after
frontend: "bg-team-alpha-soft",
backend: "bg-team-beta-soft",
```

3c. Update `teamScoreBadgeVariants`:

```tsx
// before
frontend: "bg-frontend",
backend: "bg-backend",

// after
frontend: "bg-team-alpha",
backend: "bg-team-beta",
```

3d. Update textarea focus classes (line ~138):

```tsx
// before
"... focus:border-frontend focus:ring-2 focus:ring-frontend-soft ..."

// after
"... focus:border-team-alpha focus:ring-2 focus:ring-team-alpha-soft ..."
```

3e. Update Button variant prop (line ~146):

```tsx
// before
<Button variant={team.id} ...>

// after
<Button variant={TEAM_BUTTON_VARIANT[team.id as keyof typeof TEAM_BUTTON_VARIANT]} ...>
```

- [ ] **Step 5: Run tests to confirm pass**

Run: `npm run test -- src/components/dashboard.test.tsx`
Expected: PASS

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard.test.tsx src/components/dashboard/index.tsx
git commit -m "feat(theme): update dashboard to team-alpha/team-beta classes and add TEAM_BUTTON_VARIANT map"
```

---

### Task 6: Update `src/components/ui/input.tsx` — focus ring classes

**Files:**
- Modify: `src/components/ui/input.tsx`

- [ ] **Step 1: Read input.tsx**

Read `src/components/ui/input.tsx` to locate the focus class strings.

- [ ] **Step 2: Update focus classes**

```tsx
// valid state — before:
"border-border focus:border-frontend focus:ring-2 focus:ring-frontend-soft"

// valid state — after:
"border-border focus:border-primary focus:ring-2 focus:ring-team-alpha-soft"

// invalid state — before:
"border-danger focus:border-danger focus:ring-2 focus:ring-backend-soft"

// invalid state — after:
"border-danger focus:border-danger focus:ring-2 focus:ring-team-beta-soft"
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/input.tsx
git commit -m "feat(theme): update input focus ring classes to use primary and team tokens"
```

---

### Task 7: Update `src/components/primitives/icon-callout.tsx`

**Files:**
- Modify: `src/components/primitives/icon-callout.tsx`

- [ ] **Step 1: Read icon-callout.tsx**

Read `src/components/primitives/icon-callout.tsx` to locate the success tone class.

- [ ] **Step 2: Update class**

```tsx
// before
tone === "success" && "bg-surface text-frontend",

// after
tone === "success" && "bg-surface text-primary",
```

- [ ] **Step 3: Commit**

```bash
git add src/components/primitives/icon-callout.tsx
git commit -m "feat(theme): replace text-frontend with text-primary in icon-callout"
```

---

### Task 8: Update `src/components/authenticated/placeholder-page.tsx`

**Files:**
- Modify: `src/components/authenticated/placeholder-page.tsx`

- [ ] **Step 1: Read placeholder-page.tsx**

Read `src/components/authenticated/placeholder-page.tsx` to locate the bg-frontend usage.

- [ ] **Step 2: Update class**

```tsx
// before
className="inline-flex items-center gap-2 rounded-pill bg-frontend px-5 py-3 text-sm font-semibold text-foreground-inverse ..."

// after
className="inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-foreground-inverse ..."
```

- [ ] **Step 3: Run existing tests**

Run: `npm run test -- src/components/authenticated/`
Expected: PASS (placeholder-page.test.tsx asserts `text-foreground-inverse` which is unchanged)

- [ ] **Step 4: Commit**

```bash
git add src/components/authenticated/placeholder-page.tsx
git commit -m "feat(theme): replace bg-frontend with bg-primary in placeholder-page"
```

---

### Task 9: Update `src/components/login/login-screen.tsx`

**Files:**
- Modify: `src/components/login/login-screen.tsx`

- [ ] **Step 1: Read login-screen.tsx**

Read `src/components/login/login-screen.tsx` to locate all `frontend`/`backend` class usages.

- [ ] **Step 2: Update segment button active class**

```tsx
// before (appears twice for the two segments)
? "bg-frontend text-foreground-inverse shadow-sm"

// after
? "bg-primary text-primary-foreground shadow-sm"
```

- [ ] **Step 3: Update error div border class**

```tsx
// before
className="rounded-md border border-backend-soft bg-surface-danger px-4 py-3 text-sm text-danger"

// after
className="rounded-md border border-team-beta-soft bg-surface-danger px-4 py-3 text-sm text-danger"
```

- [ ] **Step 4: Run login tests**

Run: `npm run test -- src/components/login/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/login/login-screen.tsx
git commit -m "feat(theme): update login-screen segment button and error div to use primary/team tokens"
```

---

### Task 10: Update `src/lib/constants.ts` — accent/accentSoft references

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Read constants.ts**

Read `src/lib/constants.ts` to locate `accent` and `accentSoft` fields.

- [ ] **Step 2: Update CSS var references**

```ts
// before
{ id: "frontend", ..., accent: "var(--frontend)", accentSoft: "var(--frontend-soft)" }
{ id: "backend",  ..., accent: "var(--backend)",  accentSoft: "var(--backend-soft)"  }

// after
{ id: "frontend", ..., accent: "var(--team-alpha)", accentSoft: "var(--team-alpha-soft)" }
{ id: "backend",  ..., accent: "var(--team-beta)",  accentSoft: "var(--team-beta-soft)"  }
```

Note: The `id` fields (`"frontend"`, `"backend"`) are NOT changed — only the CSS var strings.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat(theme): update constants.ts accent/accentSoft to reference team-alpha/team-beta vars"
```

---

### Task 11: Update `techspec/theme-system.md`

**Files:**
- Modify: `techspec/theme-system.md`

- [ ] **Step 1: Read theme-system.md**

Read `techspec/theme-system.md` to identify sections that reference old token names and single-file architecture.

- [ ] **Step 2: Update the doc**

Update the "Arquitetura atual" section to mention `tokens.css` as Tier 1 and `globals.css` as Tier 2–3. Update the "Tokens > Brand/team" bullet to reference `--team-alpha-soft`, `--team-beta-soft`. Remove references to `--frontend`, `--backend`. Note the two-file rule: literals in `tokens.css`, `var()` in `globals.css`.

- [ ] **Step 3: Commit**

```bash
git add techspec/theme-system.md
git commit -m "docs(theme): update theme-system.md to reflect two-file architecture and team token renaming"
```

---

### Task 12: Final verification

- [ ] **Step 1: Audit for any remaining frontend/backend CSS class references**

Run: `grep -rn 'bg-frontend\|text-frontend\|border-frontend\|bg-backend\|text-backend\|border-backend\|ring-frontend\|ring-backend' src/`
Expected: zero matches

- [ ] **Step 2: Audit for any --frontend / --backend token references in CSS**

Run: `grep -rn '\-\-frontend\|\-\-backend' src/`
Expected: zero matches

- [ ] **Step 3: Verify globals.css has no literal hex/rgba**

Run: `grep -n '#\|rgba\|rgb(' src/app/globals.css`
Expected: zero matches

- [ ] **Step 4: Verify --primary points to green (spec criterion 2)**

Run: `grep -n '\-\-primary:' src/app/globals.css`
Expected: `--primary: var(--green-700);` in `:root`; no `--primary: var(--foreground)` anywhere

- [ ] **Step 5: Run full test suite**

Run: `npm run test`
Expected: all tests pass

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors

- [ ] **Step 7: Run build**

Run: `npm run build`
Expected: build succeeds with no errors

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "chore(theme): final verification pass — all tokens migrated, build and tests passing"
```
