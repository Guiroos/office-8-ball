# Rule File Domain Categories

Organize rules into files by domain. Each file should cover one cohesive topic and stay under 50 lines.

## Recommended Domain Files

| File Name | Domain | Scope | Path-Scoped? |
|-----------|--------|-------|--------------|
| `code-style.md` | Formatting, naming, imports, code conventions | Global | No |
| `testing.md` | Test patterns, mocking, test file structure, coverage | Global or test files | Optional |
| `api-services.md` | API service patterns, BaseService usage, interceptors | `src/@nexfit/api/**` | Yes |
| `form-validation.md` | react-hook-form, Yup/fitYup, validation schemas | Validation files | Yes |
| `components.md` | Fit component patterns, Material-UI usage, props | `src/components/**` | Yes |
| `i18n.md` | Translation namespaces, formatters, locale structure | `src/i18n/**` | Yes |
| `module-structure.md` | Page/module folder structure, exports, scaffolding | `src/modules/**` | Yes |
| `hooks.md` | Custom hook patterns, naming, composition | `src/hooks/**` | Yes |
| `storybook.md` | Story structure, decorators, args | `src/stories/**` | Yes |
| `security.md` | Auth tokens, interceptors, sensitive data | Global | No |
| `domain.md` | Business domain rules, enums, constants, invariants | Global | No |
| `git-workflow.md` | Branching, commits, PR conventions | Global | No |

## Naming Conventions for New Files

- Use kebab-case: `form-validation.md`, not `formValidation.md`
- Be specific: `api-services.md`, not `backend.md`
- One topic per file: split `api-and-auth.md` into `api-services.md` + `security.md`

## When to Create a New File vs. Append

- **Create new**: No existing file covers the domain, or the closest file would exceed 50 lines.
- **Append**: The rule clearly fits an existing file's domain and the file stays under 50 lines.
- **Split**: An existing file exceeds 50 lines after appending — break it into two files by section.
