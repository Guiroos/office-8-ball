# Typography Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all ad-hoc typography utilities across the codebase with a unified 10-role scale (`display`, `headline`, `title`, `subtitle`, `body`, `body-sm`, `label`, `label-sm`, `label-wide`, `caption`).

**Architecture:** Two CSS files change first (token renames in `tokens.css`, utility replacement in `globals.css`), then each component file is migrated per the spec's migration map. No new abstractions — only class name replacements and utility redefinitions. All old compound utilities are removed; new ones are drop-in replacements at every call site.

**Tech Stack:** Tailwind CSS v4 `@utility`, CSS custom properties (`--fz-*`), Next.js / React TSX component files.

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `src/app/tokens.css` | Modify | Rename `--fz-score/display-sm/md/lg/title` to new scale names; drop `--fz-display-sm` |
| `src/app/globals.css` | Modify | Remove 11 old utilities; add 10 new compound `@utility` classes |
| `src/components/ui/badge.tsx` | Modify | `label-xs` → `caption` in CVA base string |
| `src/components/primitives/stat-tile.tsx` | Modify | `label-xs` → `caption` |
| `src/components/primitives/section-header.tsx` | Modify | `text-title leading-none font-black tracking-[-0.04em]` → `title leading-none` |
| `src/components/ui/card.tsx` | Modify | `text-title leading-none font-black tracking-[-0.04em]` → `title leading-none` (×2 in `CardTitle`) |
| `src/components/authenticated/app-shell.tsx` | Modify | `text-[11px] font-semibold uppercase tracking-label-sm` → `caption` (line 132) |
| `src/components/authenticated/placeholder-page.tsx` | Modify | `text-4xl font-black tracking-[-0.05em] sm:text-5xl` → `title`; `label-wide` stays (new impl) |
| `src/components/route-state-screen.tsx` | Modify | `font-display text-display-lg leading-none tracking-[0.08em]` → `font-display headline leading-none tracking-[0.08em]`; `text-4xl font-black tracking-[-0.05em] sm:text-5xl` → `title`; `label-xs` → `caption` |
| `src/components/dashboard/dashboard-hero.tsx` | Modify | `titleClassName` font-size class; `label-xs` ×2 → `caption`; `text-xl font-semibold tracking-[-0.03em]` → `subtitle`; `text-4xl font-black tracking-[-0.05em]` ×2 → `title` |
| `src/components/dashboard/index.tsx` | Modify | `label-xs` → `caption`; `font-display text-score leading-none tracking-[0.03em]` → `font-display display`; `text-2xl font-black tracking-[-0.04em]` → `title` |
| `src/components/login/login-screen.tsx` | Modify | `text-xl font-semibold leading-tight tracking-[-0.03em] sm:text-2xl` → `subtitle leading-tight` |
| `src/components/ui/composition.test.tsx` | Modify | `text-4xl font-black` → `title` in test fixture |

---

## Task 1: Rename `--fz-*` tokens in `tokens.css`

**Files:**
- Modify: `src/app/tokens.css:72-78`

- [ ] **Step 1: Apply token renames**

Replace the font-size block (lines 72–78). The mapping is:

| Old name | New name | Value (unchanged) |
|---|---|---|
| `--fz-score` | `--fz-display` | `clamp(4rem, 12vw, 6rem)` |
| `--fz-display-lg` | `--fz-headline` | `clamp(3.5rem, 10vw, 7.5rem)` |
| `--fz-display-md` | `--fz-title` | `clamp(3rem, 4vw, 4.8rem)` |
| `--fz-title` | `--fz-subtitle` | `clamp(1.9rem, 4vw, 2.7rem)` |
| `--fz-label` | `--fz-label` | `0.72rem` — unchanged |
| `--fz-label-sm` | `--fz-label-sm` | `0.68rem` — unchanged |

`--fz-display-sm` (`clamp(2rem, 4vw, 2.75rem)`) has no consumers — **delete it**.

Result block:
```css
  /* Font sizes */
  --fz-label-sm: 0.68rem;
  --fz-label: 0.72rem;
  --fz-subtitle: clamp(1.9rem, 4vw, 2.7rem);
  --fz-title: clamp(3rem, 4vw, 4.8rem);
  --fz-headline: clamp(3.5rem, 10vw, 7.5rem);
  --fz-display: clamp(4rem, 12vw, 6rem);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/tokens.css
git commit -m "feat(typography): rename --fz-* tokens to role-based scale"
```

---

## Task 2: Replace typography utilities in `globals.css`

**Files:**
- Modify: `src/app/globals.css:207-277`

> **Note:** After this task, old utility names (`label-xs`, `text-display-lg`, `text-score`, `display-lg`, `score`, etc.) no longer exist. Component files still reference them until Tasks 3–9 are complete — styling will be broken until then. This is expected mid-migration.

- [ ] **Step 1: Remove all old typography utilities**

Delete the entire block from line 207 to line 277 (from `/* Single-purpose font-size utilities */` through the closing `}` of `@utility score`). This removes:

Single-purpose utilities: `text-label-sm`, `text-label`, `text-title`, `text-display-sm`, `text-display-md`, `text-display-lg`, `text-score`

Compound utilities: `label-xs`, `label`, `label-wide`, `display-sm`, `display-md`, `display-lg`, `score`

- [ ] **Step 2: Add new compound utility set**

Insert the following block in place of the removed block (before the `* { box-sizing: ... }` rule):

```css
/* Compound typography utilities — role-based scale */
@utility display {
  font-size: var(--fz-display);
  font-weight: 900;
  letter-spacing: -0.05em;
}

@utility headline {
  font-size: var(--fz-headline);
  font-weight: 900;
  /* tracking intentionally omitted — callers add tracking modifier when needed */
}

@utility title {
  font-size: var(--fz-title);
  font-weight: 900;
  letter-spacing: -0.04em;
}

@utility subtitle {
  font-size: var(--fz-subtitle);
  font-weight: 600;
  letter-spacing: -0.03em;
}

@utility body {
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0;
}

@utility body-sm {
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0;
}

@utility label {
  font-size: var(--fz-label);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
}

@utility label-sm {
  font-size: var(--fz-label);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label-sm);
}

@utility label-wide {
  font-size: var(--fz-label);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label-wide);
}

@utility caption {
  font-size: var(--fz-label-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label-sm);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(typography): replace old @utility set with 10-role scale"
```

---

## Task 3: Migrate `badge.tsx` and `stat-tile.tsx`

**Files:**
- Modify: `src/components/ui/badge.tsx:6`
- Modify: `src/components/primitives/stat-tile.tsx:33`

- [ ] **Step 1: Update `badge.tsx`**

Line 6 — CVA base string contains `label-xs`. Replace with `caption`:

```tsx
// Before
"inline-flex w-fit items-center rounded-pill border px-3 py-1 label-xs backdrop-blur-sm",

// After
"inline-flex w-fit items-center rounded-pill border px-3 py-1 caption backdrop-blur-sm",
```

- [ ] **Step 2: Update `stat-tile.tsx`**

Line 33 — `label-xs` → `caption`:

```tsx
// Before
className={cn(
  "label-xs",
  tone === "inverse" ? "text-surface-strong-foreground-muted" : "text-muted-foreground",
)}

// After
className={cn(
  "caption",
  tone === "inverse" ? "text-surface-strong-foreground-muted" : "text-muted-foreground",
)}
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- src/components/ui/composition.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/badge.tsx src/components/primitives/stat-tile.tsx
git commit -m "feat(typography): migrate badge and stat-tile label-xs to caption"
```

---

## Task 4: Migrate `section-header.tsx` and `card.tsx`

**Files:**
- Modify: `src/components/primitives/section-header.tsx:50`
- Modify: `src/components/ui/card.tsx:42`

Both use `text-title leading-none font-black tracking-[-0.04em]`. The new `title` utility encodes `font-size`, `font-weight: 900`, and `letter-spacing: -0.04em` — so only `leading-none` remains as a caller modifier.

- [ ] **Step 1: Update `section-header.tsx`**

Line 50 — replace the `<h2>` className:

```tsx
// Before
"text-title leading-none font-black tracking-[-0.04em]",

// After
"title leading-none",
```

- [ ] **Step 2: Update `card.tsx`**

Line 42 — replace the `<h2>` className in `CardTitle`:

```tsx
// Before
className={cn("text-title leading-none font-black tracking-[-0.04em]", className)}

// After
className={cn("title leading-none", className)}
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- src/components/ui/composition.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/primitives/section-header.tsx src/components/ui/card.tsx
git commit -m "feat(typography): migrate section-header and card title to scale"
```

---

## Task 5: Migrate `app-shell.tsx`

**Files:**
- Modify: `src/components/authenticated/app-shell.tsx:132`

Only the `UserFooter` label at line 132 is in scope. Lines 72 and 91 (`UserAvatar`, `SidebarBrand`) use raw Tailwind primitives — they are intentionally out of scope per the spec.

- [ ] **Step 1: Update line 132**

```tsx
// Before (line 132)
<p className="truncate text-[11px] font-semibold uppercase tracking-label-sm text-sidebar-accent">

// After
<p className="truncate caption text-sidebar-accent">
```

- [ ] **Step 2: Run tests**

```bash
npm run test -- src/components/authenticated/app-shell.test.tsx
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/authenticated/app-shell.tsx
git commit -m "feat(typography): migrate app-shell footer label to caption"
```

---

## Task 6: Migrate `placeholder-page.tsx` and `route-state-screen.tsx`

**Files:**
- Modify: `src/components/authenticated/placeholder-page.tsx:26,29`
- Modify: `src/components/route-state-screen.tsx:98,102,105,129`

- [ ] **Step 1: Update `placeholder-page.tsx`**

Line 26 — `label-wide` class name stays, but now uses new implementation. No change needed to class name.

Line 29 — remove `text-4xl font-black tracking-[-0.05em]` and `sm:text-5xl`, replace with `title`:

```tsx
// Before (line 29)
<h1 className="relative mt-3 max-w-3xl text-4xl font-black tracking-[-0.05em] text-surface-strong-foreground sm:text-5xl">

// After
<h1 className="relative mt-3 max-w-3xl title text-surface-strong-foreground">
```

- [ ] **Step 2: Update `route-state-screen.tsx`**

Line 98 — `label-wide` stays (new implementation, same class name).

Line 102 — `text-display-lg` → `headline`; drop `leading-none` stays as caller modifier (it is still needed here):

```tsx
// Before (line 102)
<p className="font-display text-display-lg leading-none tracking-[0.08em] text-gold">

// After
<p className="font-display headline leading-none tracking-[0.08em] text-gold">
```

Line 105 — drop `text-4xl font-black tracking-[-0.05em]` and `sm:text-5xl`, replace with `title`:

```tsx
// Before (line 105)
<h1 className="max-w-md text-4xl font-black tracking-[-0.05em] text-surface-strong-foreground sm:text-5xl">

// After
<h1 className="max-w-md title text-surface-strong-foreground">
```

Line 129 — `label-xs` → `caption`:

```tsx
// Before (line 129)
<p className="label-xs text-muted-foreground">

// After
<p className="caption text-muted-foreground">
```

- [ ] **Step 3: Run tests**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/authenticated/placeholder-page.tsx src/components/route-state-screen.tsx
git commit -m "feat(typography): migrate placeholder-page and route-state-screen to scale"
```

---

## Task 7: Migrate `dashboard-hero.tsx`

**Files:**
- Modify: `src/components/dashboard/dashboard-hero.tsx:30,38,47,50,67,78`

- [ ] **Step 1: Apply all changes**

Line 30-31 — `titleClassName` prop on `SectionHeader`. Replace `text-display-lg leading-[0.88]` with `headline` (drop `leading-[0.88]`):

```tsx
// Before
titleClassName="font-display text-display-lg leading-[0.88] uppercase tracking-[0.06em] text-foreground"

// After
titleClassName="font-display headline tracking-[0.06em] uppercase text-foreground"
```

Line 38 — inline env-label badge `label-xs` → `caption`:

```tsx
// Before
<p className="mt-3 inline-flex w-fit rounded-pill border border-gold bg-gold-soft px-3 py-1 label-xs text-foreground backdrop-blur-sm">

// After
<p className="mt-3 inline-flex w-fit rounded-pill border border-gold bg-gold-soft px-3 py-1 caption text-foreground backdrop-blur-sm">
```

Line 47 — "Leitura oficial" label `label-xs` → `caption`:

```tsx
// Before
<p className="label-xs text-muted-foreground">

// After
<p className="caption text-muted-foreground">
```

Line 50 — `text-xl font-semibold tracking-[-0.03em]` → `subtitle`:

```tsx
// Before
<p className="mt-2 text-xl font-semibold tracking-[-0.03em]">

// After
<p className="mt-2 subtitle">
```

Line 67 — StatTile Total value `text-4xl font-black tracking-[-0.05em]` → `title`:

```tsx
// Before
<strong className="block text-4xl font-black tracking-[-0.05em]">

// After
<strong className="block title">
```

Line 78 — StatTile Streak value, same change:

```tsx
// Before
<strong className="block text-4xl font-black tracking-[-0.05em]">

// After
<strong className="block title">
```

- [ ] **Step 2: Run tests**

```bash
npm run test -- src/components/dashboard
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/dashboard-hero.tsx
git commit -m "feat(typography): migrate dashboard-hero to role-based scale"
```

---

## Task 8: Migrate `dashboard/index.tsx`

**Files:**
- Modify: `src/components/dashboard/index.tsx:93,109,112`

- [ ] **Step 1: Apply all changes**

Line 93 — roster text `text-2xl font-black tracking-[-0.04em]` → `title`:

```tsx
// Before
<h3 className="text-2xl font-black tracking-[-0.04em]">{team.roster}</h3>

// After
<h3 className="title">{team.roster}</h3>
```

Note: this is a deliberate size increase (1.5rem → min 3rem). The team name/roster context calls for the larger role-mapped size per the spec.

Line 109 — "Vitórias" label `label-xs` → `caption`:

```tsx
// Before
<p className="label-xs text-foreground-soft">

// After
<p className="caption text-foreground-soft">
```

Line 112 — score display `font-display text-score leading-none tracking-[0.03em]` → `font-display display`:

```tsx
// Before
<p className="font-display text-score leading-none tracking-[0.03em]">

// After
<p className="font-display display">
```

Note: `leading-none` and `tracking-[0.03em]` are dropped — `display` encodes `-0.05em` tracking; the design uses the utility's built-in value at this call site.

- [ ] **Step 2: Run tests**

```bash
npm run test -- src/components/dashboard
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/index.tsx
git commit -m "feat(typography): migrate dashboard index to role-based scale"
```

---

## Task 9: Migrate `login-screen.tsx` and `composition.test.tsx`

**Files:**
- Modify: `src/components/login/login-screen.tsx:290`
- Modify: `src/components/ui/composition.test.tsx:124`

- [ ] **Step 1: Update `login-screen.tsx`**

Line 290 — `text-xl font-semibold leading-tight tracking-[-0.03em] sm:text-2xl` → `subtitle leading-tight` (`sm:text-2xl` dropped — `subtitle` min of 1.9rem exceeds what `sm:text-2xl` / 1.5rem was providing):

```tsx
// Before
<h1 className="text-xl font-semibold leading-tight tracking-[-0.03em] text-muted-foreground sm:text-2xl">

// After
<h1 className="subtitle leading-tight text-muted-foreground">
```

- [ ] **Step 2: Update `composition.test.tsx`**

Line 124 — test fixture value `text-4xl font-black` → `title` (this is a JSX value passed into `StatTile`; the test asserts rendered text, not class names, so this change is safe):

```tsx
// Before (line 122-128)
value={
  <strong className="text-4xl font-black">
    <ChartColumn />
    12
  </strong>
}

// After
value={
  <strong className="title">
    <ChartColumn />
    12
  </strong>
}
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- src/components/login/login-screen.test.tsx
npm run test -- src/components/ui/composition.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/login/login-screen.tsx src/components/ui/composition.test.tsx
git commit -m "feat(typography): migrate login-screen and update composition test fixture"
```

---

## Task 10: Full verification

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 2: TypeScript check**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Visual smoke check**

Start the dev server and verify:
- `/dashboard` — score numbers use the display typeface at large size; team name is noticeably larger than before; "Vitórias" label is in uppercase caption style
- `/dashboard` hero — "Office 8 Ball" headline uses condensed display font; "Total" and "Streak" stat values are larger
- Any placeholder page (e.g., `/times`) — heading is noticeably larger than before
- Any error route — error code uses display font; heading is large; "Próxima jogada" is in uppercase caption style
- Sidebar footer — membership label is in uppercase caption style

```bash
npm run dev
```
