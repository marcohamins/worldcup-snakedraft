export interface ApiTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface ApiBooking {
  minute: number;
  team: ApiTeam;
  card: "YELLOW" | "YELLOW_RED" | "RED";
}

export interface ApiMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime: { home: number | null; away: number | null };
  };
  bookings?: ApiBooking[];
}

export interface ApiStandingRow {
  position: number;
  team: ApiTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface ApiStandingsGroup {
  group: string;
  table: ApiStandingRow[];
}

export interface FootballDataProvider {
  fetchCompetition(): Promise<{
    name: string;
    code: string;
    emblem: string;
    seasonStart: string;
    seasonEnd: string;
  }>;
  fetchMatches(): Promise<ApiMatch[]>;
  fetchStandings(): Promise<ApiStandingsGroup[]>;
  fetchTeams(): Promise<ApiTeam[]>;
}

export function createFootballDataProvider(apiKey: string): FootballDataProvider {
  const baseUrl = "https://api.football-data.org/v4";
  const competitionCode = "WC";

  async function request<T>(
    endpoint: string,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        "X-Auth-Token": apiKey,
        ...extraHeaders,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `football-data.org ${endpoint} failed (${response.status}): ${body}`,
      );
    }

    return response.json() as Promise<T>;
  }

  return {
    async fetchCompetition() {
      const data = await request<{
        name: string;
        code: string;
        emblem: string;
        currentSeason: { startDate: string; endDate: string };
      }>(`/competitions/${competitionCode}`);

      return {
        name: data.name,
        code: data.code,
        emblem: data.emblem,
        seasonStart: data.currentSeason.startDate,
        seasonEnd: data.currentSeason.endDate,
      };
    },

    async fetchMatches() {
      const data = await request<{ matches: ApiMatch[] }>(
        `/competitions/${competitionCode}/matches`,
        { "X-Unfold-Bookings": "true" },
      );
      return data.matches;
    },

    async fetchStandings() {
      const data = await request<{ standings: ApiStandingsGroup[] }>(
        `/competitions/${competitionCode}/standings`,
      );
      return data.standings.filter((standing) => standing.group);
    },

    async fetchTeams() {
      const data = await request<{ teams: ApiTeam[] }>(
        `/competitions/${competitionCode}/teams`,
      );
      return data.teams;
    },
  };
}
