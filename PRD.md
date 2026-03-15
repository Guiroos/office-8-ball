# PRD - Office 8 Ball

## Status Note

This document remains the product intent for `v1`.

Implementation status relative to this PRD:
- the single-screen scoreboard flow is implemented
- current score, leader, streak, and history are implemented
- the API supports optional match `note`
- the dashboard UI already renders persisted match `note` in recent history
- the winner-registration flow still does not expose note entry
- credentials authentication is now implemented
- multi-team support remains intentionally out of scope for `v1`

## Product Summary
Internal web app to track office pool matches between two fixed teams:

- Frontend: Gui + Jean
- Backend: Adair + Richard

The product should make it easy to register winners of each match, keep a shared running score, and preserve full match history. The tone should be light and comedic, with room for playful team rivalry.

## Goals
- Register the winner of a match in one click.
- Show the current score between the two teams.
- Store full match history.
- Make the app accessible from desktop and mobile.
- Keep the architecture simple and low-cost.

## Non-Goals
- Support for more than two teams in v1.
- Admin panel or dynamic team management.
- Complex ranking systems beyond simple win counts and streaks.

## Users
- Internal office players and spectators.
- Primary usage is quick score updates between matches.

## Core Experience
- A single main screen shows the current score.
- Two large action buttons allow registering a win for either team.
- A recent matches feed shows the latest results.
- The UI highlights the leading team and current streak.
- The app can display short comedic messages after a recorded win.

## Product Requirements

### Functional Requirements
- Display the two fixed teams and their current total wins.
- Allow creating a new match result by selecting the winning team.
- Save a full history of matches with timestamp.
- Optionally save a short note for a match.
- Show recent match history in reverse chronological order.
- Show simple stats:
  - total wins by team
  - current streak
  - current leader
  - win difference

### Data Model
Three tables are enough for v1.

#### `teams`
- `id`
- `name`
- `display_name`

Seed with two fixed rows:
- Frontend
- Backend

#### `matches`
- `id`
- `winner_team_id`
- `played_at`
- `note` nullable

#### `users`
- `id`
- `username`
- `email`
- `password_hash`
- `display_name` nullable
- `created_at`
- `updated_at`

## Technical Direction

### Stack
- `Next.js` for frontend and backend in a single project
- `Vercel` for hosting
- `Neon Postgres` for persistence

### Why This Stack
- Avoids running a separate backend service
- Keeps deployment simple
- Supports shared persistent data across devices
- Fits a small internal product without ongoing cost for expected usage

## Backend/API Requirements
The app should expose internal API endpoints through the Next.js app.

### `GET /api/scoreboard`
Returns:
- total wins per team
- current leader
- current streak
- win difference

### `GET /api/matches`
Returns:
- recent matches ordered from newest to oldest

### `POST /api/matches`
Creates a new match result.

Request payload:
- `winnerTeamId`
- `note` optional

Behavior:
- persist the match
- return updated or newly created match data
- fail clearly if persistence does not succeed

## UI Requirements
- Single-page experience for v1
- Mobile-friendly and desktop-friendly layout
- Login and signup entry screen before the scoreboard
- Fast winner registration flow
- Clear visual distinction between Frontend and Backend teams
- Playful copy without harming usability

Suggested sections:
- scoreboard header
- two primary win buttons
- current streak / leader card
- recent matches list

## Derived Logic
- Current score must be derived from match history, not stored separately.
- Current streak is the count of consecutive wins by the most recent winning team.
- Leader is the team with the greater total number of wins.

## Error Handling
- If a match cannot be saved, the UI should show a clear error state.
- The score should not update optimistically unless the save succeeds.
- Empty history state should still render a valid scoreboard with zero wins.

## Acceptance Criteria
- Recording a Frontend win creates a match and increments the displayed score.
- Recording a Backend win does the same.
- Reloading the page preserves the score and history.
- Opening the app on another device shows the same data.
- Recent matches are shown in descending date order.
- Streaks update correctly when winners alternate.
- The app remains usable on mobile and desktop.

## Deployment Requirements
- Frontend and API deploy together through Vercel.
- Database connection is configured through environment variables.
- Neon is used as the backing database.

## Constraints and Assumptions
- Exactly two teams exist in v1.
- Login is required for `/scoreboard`.
- Usage volume is small and internal.
- The free tiers of Vercel and Neon are expected to be sufficient for v1.
- The product should prioritize simplicity over extensibility in the first release.

## Future Ideas
- Add funniest match notes
- Add daily or weekly streaks
- Add a rivalry timeline
- Add a simple TV/office display mode
- Add badges such as "backend comeback" or "frontend collapse"
