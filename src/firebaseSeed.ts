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
  console.log("Seed start");

  for (const team of initialTeams) {
    console.log("Saving team:", team.id, team.name);
    await saveItem<Team>("teams", team);
  }

  for (const player of initialPlayers) {
    console.log("Saving player:", player.id, player.nickname);
    await saveItem<Player>("players", player);
  }

  for (const tournament of initialTournaments) {
    console.log("Saving tournament:", tournament.id, tournament.title);
    await saveItem<Tournament>("tournaments", tournament);
  }

  for (const match of initialMatches) {
    console.log("Saving match:", match.id, match.score);
    await saveItem<Match>("matches", match);
  }

  for (const achievement of initialAchievements) {
    console.log("Saving achievement:", achievement.id, achievement.title);
    await saveItem<Achievement>("achievements", achievement);
  }

  console.log("Seed success");
}
