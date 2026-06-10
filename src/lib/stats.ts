import type { ParticipantPoolStats, TeamData } from "./types";

export function calculateTeamMatchStats(
  teamName: string,
  matches: TeamData["matches"],
): TeamData["matchStats"] {
  let goalsFor = 0;
  let goalsAgainst = 0;
  let yellowCards = 0;
  let redCards = 0;

  for (const match of matches) {
    if (match.status !== "FINISHED") {
      continue;
    }

    const isHome = match.homeTeam.name === teamName;
    const scored = isHome ? match.homeScore : match.awayScore;
    const conceded = isHome ? match.awayScore : match.homeScore;

    if (scored !== null) {
      goalsFor += scored;
    }
    if (conceded !== null) {
      goalsAgainst += conceded;
    }

    for (const booking of match.bookings) {
      if (booking.team.name !== teamName) {
        continue;
      }
      if (booking.card === "YELLOW") {
        yellowCards += 1;
      } else {
        redCards += 1;
      }
    }
  }

  return {
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    yellowCards,
    redCards,
  };
}

export function calculateParticipantPoolStats(
  participants: string[],
  teams: TeamData[],
): ParticipantPoolStats[] {
  return participants.map((participant) => {
    const ownedTeams = teams.filter((team) => team.owner === participant);
    const totals = ownedTeams.reduce(
      (acc, team) => {
        const stats =
          team.matchStats ?? calculateTeamMatchStats(team.name, team.matches);
        return {
          goalsFor: acc.goalsFor + stats.goalsFor,
          goalsAgainst: acc.goalsAgainst + stats.goalsAgainst,
          yellowCards: acc.yellowCards + stats.yellowCards,
          redCards: acc.redCards + stats.redCards,
        };
      },
      { goalsFor: 0, goalsAgainst: 0, yellowCards: 0, redCards: 0 },
    );

    return {
      participant,
      goalsFor: totals.goalsFor,
      goalsAgainst: totals.goalsAgainst,
      goalDifference: totals.goalsFor - totals.goalsAgainst,
      yellowCards: totals.yellowCards,
      redCards: totals.redCards,
      totalCards: totals.yellowCards + totals.redCards,
    };
  });
}
