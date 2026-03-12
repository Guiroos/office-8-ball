import { TEAMS, WIN_MESSAGES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type {
  CreateMatchResponse,
  MatchRecord,
  ScoreboardData,
  Team,
  TeamId,
  TeamScore,
} from "@/lib/types";

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
  var __office8ballSeedReady: Promise<void> | undefined;
}

function getRandomWinMessage(teamId: TeamId) {
  const choices = WIN_MESSAGES[teamId];
  return choices[Math.floor(Math.random() * choices.length)];
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

async function ensureSeedData() {
  if (!hasDatabaseUrl()) {
    return;
  }

  if (!global.__office8ballSeedReady) {
    global.__office8ballSeedReady = (async () => {
      for (const team of TEAMS) {
        await prisma.team.upsert({
          where: { id: team.id },
          update: {
            name: team.name,
            displayName: team.displayName,
          },
          create: {
            id: team.id,
            name: team.name,
            displayName: team.displayName,
          },
        });
      }
    })();
  }

  await global.__office8ballSeedReady;
}

function normalizeDbMatches(
  rows: Array<{
    id: string;
    winnerTeamId: string;
    playedAt: Date;
    note: string | null;
  }>,
) {
  return rows.map((row) => {
    const team = teamMap.get(row.winnerTeamId as TeamId);

    return {
      id: row.id,
      winnerTeamId: row.winnerTeamId as TeamId,
      winnerName: team?.displayName ?? row.winnerTeamId,
      winnerRoster: team?.roster ?? row.winnerTeamId,
      playedAt: row.playedAt.toISOString(),
      note: row.note,
    };
  });
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
  await ensureSeedData();

  const rows = await prisma.match.findMany({
    orderBy: { playedAt: "desc" },
    ...(typeof limit === "number" ? { take: limit } : {}),
  });

  return normalizeDbMatches(rows);
}

function getMemoryMatches(limit?: number) {
  const sorted = [...memoryState.matches].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
  );

  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function listMatches(limit = 12) {
  return hasDatabaseUrl() ? getDatabaseMatches(limit) : getMemoryMatches(limit);
}

export async function getScoreboard() {
  const matches = hasDatabaseUrl()
    ? await getDatabaseMatches()
    : getMemoryMatches();
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

  if (!hasDatabaseUrl()) {
    memoryState.matches.unshift(createdMatch);
    return {
      match: createdMatch,
      message: getRandomWinMessage(createdMatch.winnerTeamId),
    };
  }

  await ensureSeedData();

  await prisma.match.create({
    data: {
      id: createdMatch.id,
      winnerTeamId: createdMatch.winnerTeamId,
      playedAt: new Date(createdMatch.playedAt),
      note: createdMatch.note,
    },
  });

  return {
    match: createdMatch,
    message: getRandomWinMessage(createdMatch.winnerTeamId),
  };
}
