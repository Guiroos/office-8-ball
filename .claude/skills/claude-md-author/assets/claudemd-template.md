# [Project Name]

[One sentence: framework, language, key integrations.]

## Tech Stack

- [Language] [version]
- [Framework] [version]
- [ORM / DB] [version]
- [Test framework] [version]
- [Build tool] [version]

## Common Commands

- Build: `[command]`
- Dev server: `[command]`
- Tests: `[command]`
- Lint: `[command]`
- Typecheck: `[command]`
- DB migrate: `[command]` _(if applicable)_

## Directory Structure

- `/[dir]` — [what lives here and why it matters]
- `/[dir]` — [what lives here and why it matters]

## Architecture Decisions

- [Naming convention rule]
- [State management rule]
- [API/routing pattern rule]
- [Export convention]

## Behavior Rules

- Never modify the database schema without asking first.
- Do not install new packages without approval.
- Always run tests before marking a task complete.
- Only read files directly related to the current task.
- Do not reformat files unrelated to the current change.

## Testing

- Framework: [Vitest / Jest / Pytest / etc.]
- Co-locate tests with source: `[Component].test.[ts/tsx]`
- Mock: [what to mock — e.g., external APIs, third-party SDKs]
- Do not mock: [what to call for real — e.g., internal utilities]
- Run before committing: `[test command]`

## Environment Setup

- Copy `.env.example` to `.env.local` and fill in:
  - `[VAR_NAME]`: [what it's for]
- [Any local tooling required: Docker, specific CLI version, etc.]

## Warnings

- [Specific gotcha that has caused bugs before]
- [Deprecated file or API — do not use]
- [Fragile integration — be careful when touching X]
