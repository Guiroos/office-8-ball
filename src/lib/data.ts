import { neon } from "@neondatabase/serverless";

import { TEAMS, WIN_MESSAGES } from "@/lib/constants";
import type {
  CreateMatchResponse,
  MatchRecord,
  ScoreboardData,
  Team,
  TeamId,
  TeamScore,
} from "@/lib/types";

type DatabaseRow = {
  id: string;
  winner_team_id: TeamId;
  winner_name: string;
  winner_roster: string;
  played_at: string | Date;
  note: string | null;
};

type MatchInsert = {
  winnerTeamId: TeamId;
  note?: string;
};

const teamMap = new Map<TeamId, Team>(TEAMS.map((team) => [team.id, team]));

const memoryState: {
  matches: MatchRecord[];
} = {
  matches: [],
};

declare global {
  var __office8ballSchemaReady: Promise<void> | undefined;
}

function getRandomWinMessage(teamId: TeamId) {
  const choices = WIN_MESSAGES[teamId];
  return choices[Math.floor(Math.random() * choices.length)];
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  return databaseUrl ? neon(databaseUrl) : null;
}

async function ensureSchema() {
  const sql = getSql();

  if (!sql) {
    return;
  }

  if (!global.__office8ballSchemaReady) {
    global.__office8ballSchemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS teams (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY,
          winner_team_id TEXT NOT NULL REFERENCES teams(id),
          played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          note TEXT
        );
      `;

      for (const team of TEAMS) {
        await sql`
          INSERT INTO teams (id, name, display_name)
          VALUES (${team.id}, ${team.name}, ${team.displayName})
          ON CONFLICT (id) DO UPDATE
          SET
            name = EXCLUDED.name,
            display_name = EXCLUDED.display_name;
        `;
      }
    })();
  }

  await global.__office8ballSchemaReady;
}

function normalizeDbMatches(rows: DatabaseRow[]) {
  return rows.map((row) => ({
    id: row.id,
    winnerTeamId: row.winner_team_id,
    winnerName: row.winner_name,
    winnerRoster: row.winner_roster,
    playedAt: new Date(row.played_at).toISOString(),
    note: row.note,
  }));
}

function computeScoreboard(matches: MatchRecord[]): ScoreboardData {
  const counts = new Map<TeamId, number>(TEAMS.map((team) => [team.id, 0]));

  for (const match of matches) {
    counts.set(match.winnerTeamId, (counts.get(match.winnerTeamId) ?? 0) + 1);
  }

  const teams: TeamScore[] = TEAMS.map((team) => ({
    ...team,
    wins: counts.get(team.id) ?? 0,
  }));

  const [firstTeam, secondTeam] = teams;
  const leadBy = Math.abs(firstTeam.wins - secondTeam.wins);

  let leaderTeamId: TeamId | null = null;
  if (firstTeam.wins !== secondTeam.wins) {
    leaderTeamId =
      firstTeam.wins > secondTeam.wins ? firstTeam.id : secondTeam.id;
  }

  const newestFirst = [...matches].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
  );

  let currentStreak: ScoreboardData["currentStreak"] = null;
  if (newestFirst.length > 0) {
    const currentWinnerId = newestFirst[0].winnerTeamId;
    const streakBreak = newestFirst.findIndex(
      (match) => match.winnerTeamId !== currentWinnerId,
    );

    currentStreak = {
      teamId: currentWinnerId,
      teamName: teamMap.get(currentWinnerId)?.displayName ?? currentWinnerId,
      count: streakBreak === -1 ? newestFirst.length : streakBreak,
    };
  }

  return {
    teams,
    leaderTeamId,
    leadBy,
    totalMatches: matches.length,
    currentStreak,
  };
}

async function getDatabaseMatches(limit?: number): Promise<MatchRecord[]> {
  await ensureSchema();

  const sql = getSql();

  if (!sql) {
    return [];
  }

  const rows =
    typeof limit === "number"
      ? ((await sql`
          SELECT
            m.id,
            m.winner_team_id,
            t.display_name AS winner_name,
            CASE
              WHEN t.id = 'frontend' THEN 'Gui + Jean'
              ELSE 'Adair + Richard'
            END AS winner_roster,
            m.played_at,
            m.note
          FROM matches m
          INNER JOIN teams t ON t.id = m.winner_team_id
          ORDER BY m.played_at DESC
          LIMIT ${limit};
        `) as DatabaseRow[])
      : ((await sql`
          SELECT
            m.id,
            m.winner_team_id,
            t.display_name AS winner_name,
            CASE
              WHEN t.id = 'frontend' THEN 'Gui + Jean'
              ELSE 'Adair + Richard'
            END AS winner_roster,
            m.played_at,
            m.note
          FROM matches m
          INNER JOIN teams t ON t.id = m.winner_team_id
          ORDER BY m.played_at DESC;
        `) as DatabaseRow[]);

  return normalizeDbMatches(rows);
}

function getMemoryMatches(limit?: number) {
  const sorted = [...memoryState.matches].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
  );

  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function listMatches(limit = 12) {
  const sql = getSql();
  return sql ? getDatabaseMatches(limit) : getMemoryMatches(limit);
}

export async function getScoreboard() {
  const sql = getSql();
  const matches = sql ? await getDatabaseMatches() : getMemoryMatches();
  return computeScoreboard(matches);
}

function createMatchRecord(match: MatchInsert): MatchRecord {
  const team = teamMap.get(match.winnerTeamId);

  if (!team) {
    throw new Error("Unknown team.");
  }

  return {
    id: crypto.randomUUID(),
    winnerTeamId: team.id,
    winnerName: team.displayName,
    winnerRoster: team.roster,
    playedAt: new Date().toISOString(),
    note: match.note?.trim() ? match.note.trim() : null,
  };
}

export async function createMatch(
  input: MatchInsert,
): Promise<CreateMatchResponse> {
  const createdMatch = createMatchRecord(input);
  const sql = getSql();

  if (!sql) {
    memoryState.matches.unshift(createdMatch);
    return {
      match: createdMatch,
      message: getRandomWinMessage(createdMatch.winnerTeamId),
    };
  }

  await ensureSchema();

  await sql`
    INSERT INTO matches (id, winner_team_id, played_at, note)
    VALUES (
      ${createdMatch.id},
      ${createdMatch.winnerTeamId},
      ${createdMatch.playedAt},
      ${createdMatch.note}
    );
  `;

  return {
    match: createdMatch,
    message: getRandomWinMessage(createdMatch.winnerTeamId),
  };
}
