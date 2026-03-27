---
status: testing
phase: 05-user-profiles-advanced-features
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md
started: 2026-03-26T23:14:17.190Z
updated: 2026-03-26T23:14:17.190Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Profile Overview Stats
expected: |
  Open /profile while authenticated. The page shows real aggregate metrics (wins, losses, win rate, total matches)
  and no loading spinner/fetch-driven placeholder for the main stats block.
awaiting: user response

## Tests

### 1. Profile Overview Stats
expected: Open /profile while authenticated. The page shows real aggregate metrics (wins, losses, win rate, total matches) and no loading spinner/fetch-driven placeholder for the main stats block.
result: [pending]

### 2. Profile Team Breakdown
expected: On /profile, the team stats section lists the user's teams with per-team wins/losses/win rate and falls back to a clear empty-state callout if no team history exists.
result: [pending]

### 3. Profile Edit Persistence
expected: Editing profile fields via the profile edit dialog saves successfully and refreshed /profile shows updated account info.
result: [pending]

### 4. Ranking Period Tab Switching
expected: On /ranking, period tabs (all/month/week) are visible; selecting a period updates results and URL query params accordingly.
result: [pending]

### 5. Ranking Cross-Filter Preservation
expected: On /ranking with a non-default period selected, switching ranking type keeps the selected period in URL/state; switching period keeps the selected type.
result: [pending]

### 6. Ranking Empty State by Period
expected: If no matches exist for the selected period, /ranking shows an empty state message that references the selected period instead of silently falling back to all-time results.
result: [pending]

### 7. Head-to-Head Route and Selectors
expected: Open /head-to-head while authenticated; page renders Team A and Team B selectors plus head-to-head summary content.
result: [pending]

### 8. Head-to-Head Same-Team Prevention
expected: In /head-to-head, Team A and Team B cannot be set to the same team simultaneously (selector options prevent duplicate selection).
result: [pending]

### 9. Head-to-Head URL Recovery
expected: Opening /head-to-head with invalid or unauthorized team query params auto-recovers to a valid pair and shows a warning message.
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps

