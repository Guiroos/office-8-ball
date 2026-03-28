---
paths:
  - "src/components/**/use-*.ts"
---

# Data Hooks

## Naming and Location

- Name client data hooks `use-[feature]-data.ts` and co-locate them in the feature component directory (e.g. `src/components/dashboard/use-dashboard-data.ts`).
- Hooks own loading, error, and data state via `useState`; never share state via a global store.

## Error Handling

- Surface all API errors as `toast.error(...)` via `sonner`; do not silently swallow errors or expose raw error objects to the component tree.
- Never import domain functions (`src/lib/`) directly in components — always go through the feature data hook.
