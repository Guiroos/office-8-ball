# Profile Page — Design Spec

**Date:** 2026-03-21
**Route:** `/(authenticated)/profile`

---

## Overview

A profile page for the authenticated user showing their account info, placeholder stats, and recent system matches. In v1, each user sees only their own profile. Sharing via URL copies the current profile link — viewing other users' profiles is out of scope for v1.

---

## Layout — Approach A (1/3 + 2/3 columns)

```
┌─────────────────────────────────────────────┐
│  Header: "Player Profile"   [Share] [Edit]  │
├─────────────────────────────────────────────┤
│  Hero: Avatar · displayName/username        │
│        @username · "entrou em ..."          │
├─────────────────────────────────────────────┤
│  Stats Grid (4 cards — placeholder v1)      │
│  [ Vitórias ] [ Win Rate ] [ Partidas ] [ Streak ] │
├──────────────┬──────────────────────────────┤
│  Left (1/3)  │  Right (2/3)                 │
│  Times       │  Partidas Recentes           │
│  (placeholder│  (últimas 5 do sistema)      │
│   future)    │                              │
│  Conta       │                              │
│  username    │                              │
│  email       │                              │
└──────────────┴──────────────────────────────┘
```

---

## Sections

### 1. Header

- Title: "Player Profile"
- Right side: `[Share]` button + `[Edit]` button
- Both use the existing `Button` component (`ghost` or `outline` variant)
- `Share`: copies `window.location.href` to clipboard. No toast component exists in the project — feedback is shown inline on the button itself: icon/label changes to a checkmark + "Copiado!" for 2 seconds, then reverts. If the button is clicked again while already in "Copiado!" state, the 2-second timer resets (no state leak).
- `Edit`: opens the Edit Dialog (see below)

### 2. Hero Section

Card with `bg-primary/10` background and `border-primary/20` border (faithful to reference).

| Field | Source | Notes |
|---|---|---|
| Avatar | Initials from `username` / `email` | See derivation below |
| Name | `displayName` | Falls back to `username` if null |
| Handle | `@username` | Always from profile |
| Join date | `createdAt` | Formatted as "entrou em Mês Ano" |

**Avatar initials derivation** (exact match to sidebar logic in `app-shell.tsx`):
```ts
// derivation (utility or inline)
const base = username.trim() || email.trim()
const initials = base.split(/\s+/).slice(0, 2).map(c => c.charAt(0).toUpperCase()).join("").slice(0, 2)

// render site (JSX)
<span>{initials || "OB"}</span>
```
Two steps: (1) pick `base` as username or email fallback; (2) derive initials. The `|| "OB"` fallback belongs at the render site (JSX), not inside the derivation — matching the sidebar pattern.

Note: `email` is not shown in the Hero — it belongs only in the Conta card (Left Column).

Data is fetched via `GET /api/profile`. Since `SessionUser` only contains `{ id, username, email }`, this endpoint performs `prisma.user.findUnique({ where: { id: session.user.id } })` to retrieve `displayName` and `createdAt`.

**Page-level error state:** If `GET /api/profile` returns 503 (no `DATABASE_URL`), the page renders an `IconCallout` in place of the profile content: "Perfil indisponível sem conexão ao banco de dados."

### 3. Stats Grid

4 `StatTile` cards in a 2×2 (mobile) / 4×1 (desktop) grid. All display `—` in v1.

| # | Label | Future source |
|---|---|---|
| 1 | Vitórias | Total wins across all teams user belongs to |
| 2 | Win Rate | % wins / total matches across teams |
| 3 | Partidas | Total matches across teams |
| 4 | Sequência | Current win streak across teams |

### 4. Left Column (1/3)

**Times**
- `SectionHeader` with label "Meus Times"
- Empty state using `IconCallout`: "Nenhum time ainda — em breve"
- Reserved for the future "duplas/times" feature (top 3 teams by victories)
- No data logic in v1

**Conta**
- Card below Times
- Shows: `username` (read-only), `email` (read-only), join date formatted
- Each row is a bespoke `div` with icon + label — `FormField` is not used here since these are read-only display rows, not form inputs

### 5. Right Column (2/3)

**Partidas Recentes**
- `SectionHeader` with label "Partidas Recentes"
- Fetches from existing `GET /api/matches` — route is not modified
- Component slices the returned array to the first 5 entries client-side
- Shows last 5 matches **in the system** (not filtered by user — `Match` has no relation to `User` in v1)
- A subtle caption below the header clarifies: "Últimas partidas registradas no sistema"
- Each row: winning team, losing team, date
- **Loser derivation:** `MatchRecord` does not carry loser data. Loser is derived client-side: `TEAMS.find(t => t.id !== match.winnerTeamId)?.displayName`
- **Fetch error state:** If `GET /api/matches` fails for any reason (network error, 401, etc.), render an `IconCallout` inside the section: "Não foi possível carregar as partidas." The list does not render. Note: in-memory mode (no `DATABASE_URL`) causes `GET /api/matches` to return 401 (auth unavailable), so it falls into the same error branch — not an empty array.
- Visual style: reference the token classes and row structure from `recent-matches-card.tsx` but do **not** import or reuse the component — the profile variant has a different layout (winner + loser + date, no roster, no scroll area)

---

## Edit Dialog

Triggered by the `Edit` button in the header. Uses the shadcn `Dialog` primitive (already in `src/components/ui/`).

**File path:** `src/components/profile/profile-edit-dialog.tsx`

**Fields:**
- `displayName` — text input using `FormField` primitive (`Field` + `FieldError`), label "Nome de exibição", placeholder "Como quer ser chamado?"
- Zod validation: min 2 chars, max 50 chars

**Actions:**
- `Cancelar` — closes dialog without saving
- `Salvar` — submits; button shows loading state during request

**On success:** closes dialog + updates `displayName` in hero via local state (no page reload).

**On error:** dialog stays open; `FieldError` renders an inline message below the input. If the error is a 503, the message is "Serviço indisponível. Tente novamente mais tarde."

---

## New API Endpoints

Both endpoints follow this exact call sequence:

```ts
// Step 1: guard DB availability — returns 503 when DATABASE_URL is absent
if (!hasDatabaseUrl()) return getAuthUnavailableResponse()

// Step 2: validate session — returns 401 if no session
const user = await getAuthenticatedUser()
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
```

**Why this order:** `getAuthUnavailableResponse()` returns 503 only when called after a `!hasDatabaseUrl()` guard. Do not use `isAuthAvailable()` as the sole guard — it also catches a missing `NEXTAUTH_SECRET`, which causes `getAuthUnavailableResponse()` to return 500 instead of 503, making the response indistinguishable from a server crash.

### `GET /api/profile`
- Auth: per sequence above
- Implementation: `prisma.user.findUnique({ where: { id: user.id } })`
- Returns: `NextResponse.json<ProfileResponse>(...)`

### `PUT /api/profile`
- Auth: per sequence above
- Body: `{ displayName: string }`
- Validation: Zod (min 2, max 50) — returns **400** on validation error (consistent with all other project routes)
- Implementation: `prisma.user.update({ where: { id: user.id }, data: { displayName } })`
- Returns: `NextResponse.json<ProfileResponse>(...)`
- Unexpected Prisma errors (e.g., connection timeout) propagate as unhandled exceptions (framework 500) — no explicit try/catch required, consistent with all other routes.

---

## Types

Add `ProfileResponse` to `src/lib/types.ts`:

```ts
export type ProfileResponse = {
  id: string
  username: string
  email: string
  displayName: string | null
  createdAt: string // ISO date string
}
```

---

## What Exists Today (Reuse)

| Asset | Location | Usage |
|---|---|---|
| Route | `src/app/(authenticated)/profile/page.tsx` | Replace its contents |
| Avatar initials logic | `src/components/authenticated/app-shell.tsx` | Replicate exact two-step derivation (see Hero section) |
| `StatTile` | `src/components/primitives/stat-tile.tsx` | Stats grid |
| `SectionHeader` | `src/components/primitives/section-header.tsx` | Section titles |
| `IconCallout` | `src/components/primitives/icon-callout.tsx` | Empty/error states throughout |
| `FormField` (`Field` + `FieldError`) | `src/components/primitives/form-field.tsx` | Edit dialog input + error display |
| `Dialog` | `src/components/ui/` | Edit dialog shell |
| `Button`, `Card`, `Badge` | `src/components/ui/` | General layout |
| `/api/matches` | `src/app/api/matches/` | Recent matches data (first 5 sliced client-side) |
| `hasDatabaseUrl()` | `src/lib/auth.ts` | Step 1 DB guard in new endpoints |
| `getAuthUnavailableResponse()` | `src/lib/auth.ts` | 503 response (only after `hasDatabaseUrl()` guard) |
| `getAuthenticatedUser()` | `src/lib/auth.ts` | Step 2 session validation in new endpoints |
| Token classes from `recent-matches-card.tsx` | `src/components/dashboard/` | Visual reference for match row styles |
| `TEAMS` constants | `src/lib/constants.ts` | Derive loser from winner in match rows |

## What Needs to Be Created

| Asset | Path | Notes |
|---|---|---|
| Profile page component | `src/app/(authenticated)/profile/page.tsx` | Replace current contents |
| Profile page UI | `src/components/profile/profile-page.tsx` | Main client component |
| Edit dialog component | `src/components/profile/profile-edit-dialog.tsx` | Isolated, scoped to profile |
| `GET /api/profile` | `src/app/api/profile/route.ts` | Returns full user; DB required |
| `PUT /api/profile` | same file | Updates `displayName`; DB required |
| `ProfileResponse` type | `src/lib/types.ts` | Add to existing types |

---

## Future Scope (Out of v1)

- Public profile URL: `/(authenticated)/profile/[username]` with `GET /api/profile/[id]` — view other users' profiles
- Times/duplas section populated with real team data (top 3 by victories)
- Stats grid populated with aggregated wins/rate/streak from team memberships
- Avatar upload / custom photo
- Partidas Recentes filtered by matches the user registered (requires `registeredBy` field on `Match`)

---

## Constraints

- Do not modify `prisma/schema.prisma` — `displayName` already exists as an optional field
- Do not add new packages without approval
- Use semantic design tokens only — no arbitrary Tailwind values
- API error codes: 401 unauthenticated, 400 validation, 503 no DATABASE_URL
- `GET /api/matches` route is not modified — profile component slices results client-side
- Avatar initials derivation must match the existing sidebar logic exactly (two-step, `"OB"` fallback)
- Guard DB-dependent endpoints with `hasDatabaseUrl()` before `getAuthenticatedUser()` — do not use `isAuthAvailable()` as the sole guard
