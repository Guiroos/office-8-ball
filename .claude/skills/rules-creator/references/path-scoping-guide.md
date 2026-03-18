# Path-Scoping Guide for Rules

## When to Use Path-Scoping

Add a `paths` frontmatter field when the rule applies **only** to specific file patterns. This prevents the rule from loading into context on every session, reducing context bloat.

### Use path-scoping when:
- The rule targets a specific module or directory (e.g., only `src/modules/financeiro/`)
- The rule applies to a specific file type in a specific location (e.g., validation schemas)
- The rule is verbose (10+ lines) and only relevant to a subset of files
- The rule covers patterns in test files, API services, or component directories exclusively

### Do NOT use path-scoping when:
- The rule applies to all code in the project (e.g., "Use single quotes")
- The rule is short (1–3 lines) and low-cost to keep in global context
- The rule covers a cross-cutting concern (security, error handling, naming)
- The rule relates to git workflow, commit conventions, or CI/CD

## Frontmatter Format

```yaml
---
paths:
  - "src/modules/*/pages/**/*.tsx"
  - "src/modules/*/pages/**/validation/*.ts"
---
```

## Common Path Patterns for This Project

| Pattern | Matches |
|---------|---------|
| `src/modules/*/pages/**/*.tsx` | All page components across modules |
| `src/@nexfit/api/services/**/*.ts` | All API service files |
| `src/components/**/*.tsx` | All shared Fit components |
| `src/hooks/**/*.ts` | All custom hooks |
| `src/i18n/locales/**/*.ts` | All i18n translation files |
| `src/modules/*/pages/**/validation/*.ts` | All Yup validation schemas |
| `src/**/*.test.ts` | All test files |
| `src/**/*.test.tsx` | All React test files |
| `src/stories/**/*.stories.tsx` | All Storybook stories |
| `src/enums/**/*.ts` | All enum files |

## Behavior

- Rules without `paths` load unconditionally at session start.
- Rules with `paths` load only when the agent reads or edits a matching file.
- Once loaded, path-scoped rules stay in context for the rest of the session.
