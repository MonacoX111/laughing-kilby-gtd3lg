import {
  initialAchievements,
  initialMatches,
  initialPlayers,
  initialTeams,
  initialTournaments,
} from "./data";
import { saveItem } from "./firebaseDb";
import { Achievement, Match, Player, Team, Tournament } from "./types";

export async function seedFirebase() {
  for (const team of initialTeams) {
    await saveItem<Team>("teams", team);
  }

  for (const player of initialPlayers) {
    await saveItem<Player>("players", player);
  }

  for (const tournament of initialTournaments) {
    await saveItem<Tournament>("tournaments", tournament);
  }

  for (const match of initialMatches) {
    await saveItem<Match>("matches", match);
  }

  for (const achievement of initialAchievements) {
    await saveItem<Achievement>("achievements", achievement);
  }
}
