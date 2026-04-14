import { ChangeEvent, useEffect, useMemo, useState } from "react";
import PlayersTab from "./components/PlayersTab";
import TeamsTab from "./components/TeamsTab";
import TournamentsTab from "./components/TournamentsTab";
import LeaderboardTab from "./components/LeaderboardTab";
import AdminTab from "./components/AdminTab";
import "./styles.css";
import { achievementPlaceholder, gamesList, initialPlayers } from "./data";
import {
  Achievement,
  Match,
  Player,
  TabKey,
  Team,
  Tournament,
  Transfer,
} from "./types";
import { getNextId, parseList, syncTeamPlayers } from "./utils";
import { deleteItem, saveItem, subscribeCollection } from "./firebaseDb";
import StatCard from "./components/StatCard";

type PlayerForm = {
  nickname: string;
  fullName: string;
  teamId: number;
  games: string;
  wins: number;
  losses: number;
  earnings: number;
  tournamentsWon: number;
  rank: number;
  elo: number;
  bio: string;
};

type TeamForm = {
  name: string;
  games: string;
  wins: number;
  earnings: number;
  description: string;
};

type TournamentForm = {
  title: string;
  game: string;
  type: string;
  date: string;
  prize: string;
};

type MatchForm = {
  game: string;
  player1: number;
  player2: number;
  score: string;
  winnerId: number;
  tournamentId: number;
  date: string;
  eloApplied: boolean;
};

const ADMIN_STORAGE_KEY = "tm_admin_access";
const ADMIN_PASSWORD = "monacoadmin";

const createEmptyPlayerForm = (nextRank = 1): PlayerForm => ({
  nickname: "",
  fullName: "",
  teamId: 0,
  games: "",
  wins: 0,
  losses: 0,
  earnings: 0,
  tournamentsWon: 0,
  rank: nextRank,
  elo: 1000,
  bio: "",
});

const createEmptyTeamForm = (): TeamForm => ({
  name: "",
  games: "",
  wins: 0,
  earnings: 0,
  description: "",
});

const createEmptyTournamentForm = (): TournamentForm => ({
  title: "",
  game: "",
  type: "",
  date: "",
  prize: "",
});

const createEmptyMatchForm = (): MatchForm => ({
  game: "",
  player1: 0,
  player2: 0,
  score: "",
  winnerId: 0,
  tournamentId: 0,
  date: "",
  eloApplied: false,
});

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("players");

  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(1);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number>(1);
  const [selectedMatchId, setSelectedMatchId] = useState<number>(1);

  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortMode, setSortMode] = useState("elo");

  const [playerForm, setPlayerForm] = useState<PlayerForm>(
    createEmptyPlayerForm(initialPlayers.length + 1)
  );
  const [teamForm, setTeamForm] = useState<TeamForm>(createEmptyTeamForm());
  const [tournamentForm, setTournamentForm] = useState<TournamentForm>(
    createEmptyTournamentForm()
  );
  const [matchForm, setMatchForm] = useState<MatchForm>(createEmptyMatchForm());

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === "true";
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  const selectedPlayer =
    players.find((player) => player.id === selectedPlayerId) || null;
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) || null;
  const selectedTournament =
    tournaments.find((tournament) => tournament.id === selectedTournamentId) ||
    null;
  const selectedMatch =
    matches.find((match) => match.id === selectedMatchId) || null;

  const visibleTabs = useMemo(
    () => [
      { key: "players" as TabKey, label: "Players" },
      { key: "teams" as TabKey, label: "Teams" },
      { key: "tournaments" as TabKey, label: "Tournaments" },
      { key: "leaderboard" as TabKey, label: "Leaderboard" },
      ...(isAdmin ? [{ key: "admin" as TabKey, label: "Admin" }] : []),
    ],
    [isAdmin]
  );

  useEffect(() => {
    const unsubPlayers = subscribeCollection<Player>("players", setPlayers);
    const unsubTeams = subscribeCollection<Team>("teams", setTeams);
    const unsubTournaments = subscribeCollection<Tournament>(
      "tournaments",
      setTournaments
    );
    const unsubMatches = subscribeCollection<Match>("matches", setMatches);
    const unsubAchievements = subscribeCollection<Achievement>(
      "achievements",
      setAchievements
    );

    return () => {
      unsubPlayers();
      unsubTeams();
      unsubTournaments();
      unsubMatches();
      unsubAchievements();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(ADMIN_STORAGE_KEY, String(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin && activeTab === "admin") {
      setActiveTab("players");
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    const handleSecretShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        setShowAdminLogin(true);
        setAdminError("");
      }

      if (event.key === "Escape") {
        setShowAdminLogin(false);
        setAdminPassword("");
        setAdminError("");
      }
    };

    window.addEventListener("keydown", handleSecretShortcut);
    return () => window.removeEventListener("keydown", handleSecretShortcut);
  }, []);

  useEffect(() => {
    if (players.length === 0) {
      setSelectedPlayerId(0);
      return;
    }
    if (!players.some((player) => player.id === selectedPlayerId)) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  useEffect(() => {
    if (teams.length === 0) {
      setSelectedTeamId(0);
      return;
    }
    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (tournaments.length === 0) {
      setSelectedTournamentId(0);
      return;
    }
    if (
      !tournaments.some((tournament) => tournament.id === selectedTournamentId)
    ) {
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [tournaments, selectedTournamentId]);

  useEffect(() => {
    if (matches.length === 0) {
      setSelectedMatchId(0);
      return;
    }
    if (!matches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(matches[0].id);
    }
  }, [matches, selectedMatchId]);

  useEffect(() => {
    if (!selectedPlayer) return;
    setPlayerForm({
      nickname: selectedPlayer.nickname,
      fullName: selectedPlayer.fullName,
      teamId: selectedPlayer.teamId,
      games: selectedPlayer.games.join(", "),
      wins: selectedPlayer.wins,
      losses: selectedPlayer.losses,
      earnings: selectedPlayer.earnings,
      tournamentsWon: selectedPlayer.tournamentsWon,
      rank: selectedPlayer.rank,
      elo: selectedPlayer.elo,
      bio: selectedPlayer.bio,
    });
  }, [selectedPlayerId, selectedPlayer]);

  useEffect(() => {
    if (!selectedTeam) return;
    setTeamForm({
      name: selectedTeam.name,
      games: selectedTeam.games.join(", "),
      wins: selectedTeam.wins,
      earnings: selectedTeam.earnings,
      description: selectedTeam.description,
    });
  }, [selectedTeamId, selectedTeam]);

  useEffect(() => {
    if (!selectedTournament) return;
    setTournamentForm({
      title: selectedTournament.title,
      game: selectedTournament.game,
      type: selectedTournament.type,
      date: selectedTournament.date,
      prize: selectedTournament.prize,
    });
  }, [selectedTournamentId, selectedTournament]);

  useEffect(() => {
    if (!selectedMatch) return;
    setMatchForm({
      game: selectedMatch.game,
      player1: selectedMatch.player1,
      player2: selectedMatch.player2,
      score: selectedMatch.score,
      winnerId: selectedMatch.winnerId,
      tournamentId: selectedMatch.tournamentId,
      date: selectedMatch.date,
      eloApplied: selectedMatch.eloApplied,
    });
  }, [selectedMatchId, selectedMatch]);

  const persistTeams = async (nextTeams: Team[]) => {
    await Promise.all(nextTeams.map((team) => saveItem<Team>("teams", team)));
  };

  const persistPlayers = async (nextPlayers: Player[]) => {
    await Promise.all(
      nextPlayers.map((player) => saveItem<Player>("players", player))
    );
  };

  const updatePlayersAndTeams = async (
    updater: (prevPlayers: Player[]) => Player[]
  ) => {
    const nextPlayers = updater(players);
    const nextTeams = syncTeamPlayers(nextPlayers, teams);

    await Promise.all([persistPlayers(nextPlayers), persistTeams(nextTeams)]);
  };

  const sortTransfersNewestFirst = (transfers: Transfer[]) => {
    return [...transfers].sort((a, b) => {
      const aTime = new Date(a.date || 0).getTime();
      const bTime = new Date(b.date || 0).getTime();

      if (bTime !== aTime) return bTime - aTime;
      return b.id - a.id;
    });
  };

  const handlePlayerAvatarUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPlayer) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      await saveItem<Player>("players", {
        ...selectedPlayer,
        avatar: result,
      });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleTeamLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTeam) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      await saveItem<Team>("teams", {
        ...selectedTeam,
        logo: result,
      });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const savePlayer = async () => {
    if (!selectedPlayer) return;

    const nextPlayers = players.map((player) =>
      player.id === selectedPlayer.id
        ? {
            ...player,
            nickname: playerForm.nickname,
            fullName: playerForm.fullName,
            teamId: Number(playerForm.teamId),
            games: parseList(playerForm.games),
            wins: Number(playerForm.wins),
            losses: Number(playerForm.losses),
            earnings: Number(playerForm.earnings),
            tournamentsWon: Number(playerForm.tournamentsWon),
            rank: Number(playerForm.rank),
            elo: Number(playerForm.elo),
            bio: playerForm.bio,
          }
        : player
    );

    const nextTeams = syncTeamPlayers(nextPlayers, teams);

    await Promise.all([persistPlayers(nextPlayers), persistTeams(nextTeams)]);
  };

  const addPlayer = async () => {
    const newPlayer: Player = {
      id: getNextId(players),
      nickname: "",
      fullName: "",
      avatar: achievementPlaceholder("P"),
      teamId: 0,
      games: [],
      wins: 0,
      losses: 0,
      earnings: 0,
      tournamentsWon: 0,
      rank: players.length + 1,
      elo: 1000,
      bio: "",
      transferHistory: [],
    };

    await saveItem<Player>("players", newPlayer);
    setSelectedPlayerId(newPlayer.id);
    setPlayerForm(createEmptyPlayerForm(players.length + 2));
  };

  const updatePlayerTransfer = async (
    playerId: number,
    transferId: number,
    updates: Partial<Transfer>
  ) => {
    await updatePlayersAndTeams((prev) =>
      prev.map((player) => {
        if (player.id !== playerId) return player;

        const currentTransfers = player.transferHistory ?? [];
        const nextTransfers = currentTransfers.map((transfer) => {
          if (transfer.id !== transferId) return transfer;
          return { ...transfer, ...updates };
        });

        const updatedTransfer = nextTransfers.find(
          (transfer) => transfer.id === transferId
        );

        const nextTeamId =
          updatedTransfer && typeof updatedTransfer.toTeamId === "number"
            ? updatedTransfer.toTeamId
            : player.teamId;

        return {
          ...player,
          teamId: nextTeamId,
          transferHistory: sortTransfersNewestFirst(nextTransfers),
        };
      })
    );
  };

  const addPlayerTransfer = async (playerId: number) => {
    await updatePlayersAndTeams((prev) =>
      prev.map((player) => {
        if (player.id !== playerId) return player;

        const currentTransfers = player.transferHistory ?? [];
        const currentTeam = teams.find((team) => team.id === player.teamId);

        const newTransfer: Transfer = {
          id: Date.now(),
          fromTeamId: player.teamId || null,
          toTeamId: player.teamId || 0,
          fromTeamName: currentTeam?.name || "",
          toTeamName: currentTeam?.name || "",
          date: new Date().toISOString().slice(0, 10),
          note: "",
        };

        return {
          ...player,
          transferHistory: sortTransfersNewestFirst([
            ...currentTransfers,
            newTransfer,
          ]),
        };
      })
    );
  };

  const deletePlayerTransfer = async (playerId: number, transferId: number) => {
    await updatePlayersAndTeams((prev) =>
      prev.map((player) => {
        if (player.id !== playerId) return player;

        const currentTransfers = player.transferHistory ?? [];

        return {
          ...player,
          transferHistory: sortTransfersNewestFirst(
            currentTransfers.filter((transfer) => transfer.id !== transferId)
          ),
        };
      })
    );
  };

  const deletePlayer = async () => {
    if (!selectedPlayer) return;

    const deletedId = selectedPlayer.id;

    await deleteItem("players", deletedId);

    const deletedMatches = matches.filter(
      (match) => match.player1 === deletedId || match.player2 === deletedId
    );

    await Promise.all(
      deletedMatches.map((match) => deleteItem("matches", match.id))
    );

    const nextAchievements = achievements.map((achievement) => ({
      ...achievement,
      playerIds: achievement.playerIds.filter((id) => id !== deletedId),
    }));

    await Promise.all(
      nextAchievements.map((achievement) =>
        saveItem<Achievement>("achievements", achievement)
      )
    );

    const nextTournaments = tournaments.map((tournament) => ({
      ...tournament,
      winnerId: tournament.winnerId === deletedId ? 0 : tournament.winnerId,
      mvpId: tournament.mvpId === deletedId ? 0 : tournament.mvpId,
      placements: tournament.placements.filter(
        (item) => item.playerId !== deletedId
      ),
    }));

    await Promise.all(
      nextTournaments.map((tournament) =>
        saveItem<Tournament>("tournaments", tournament)
      )
    );

    const nextPlayers = players.filter((player) => player.id !== deletedId);
    const nextTeams = syncTeamPlayers(nextPlayers, teams);
    await persistTeams(nextTeams);
  };

  const saveTeam = async () => {
    if (!selectedTeam) return;

    await saveItem<Team>("teams", {
      ...selectedTeam,
      name: teamForm.name,
      games: parseList(teamForm.games),
      wins: Number(teamForm.wins),
      earnings: Number(teamForm.earnings),
      description: teamForm.description,
    });
  };

  const addTeam = async () => {
    const newTeam: Team = {
      id: getNextId(teams),
      name: "",
      logo: achievementPlaceholder("T"),
      games: [],
      earnings: 0,
      wins: 0,
      players: [],
      description: "",
    };

    await saveItem<Team>("teams", newTeam);
    setSelectedTeamId(newTeam.id);
    setTeamForm(createEmptyTeamForm());
  };

  const deleteTeam = async () => {
    if (!selectedTeam) return;

    const deletedId = selectedTeam.id;
    const nextPlayers = players.map((player) =>
      player.teamId === deletedId ? { ...player, teamId: 0 } : player
    );
    const nextTeams = teams.filter((team) => team.id !== deletedId);
    const syncedTeams = syncTeamPlayers(nextPlayers, nextTeams);

    await Promise.all([
      persistPlayers(nextPlayers),
      persistTeams(syncedTeams),
      deleteItem("teams", deletedId),
    ]);
  };

  const saveTournament = async () => {
    if (!selectedTournament) return;

    await saveItem<Tournament>("tournaments", {
      ...selectedTournament,
      title: tournamentForm.title,
      game: tournamentForm.game,
      type: tournamentForm.type,
      date: tournamentForm.date,
      prize: tournamentForm.prize,
    });
  };

  const addTournament = async () => {
    const newTournament: Tournament = {
      id: getNextId(tournaments),
      title: "New Tournament",
      game: "",
      type: "",
      date: "",
      prize: "",
      winnerId: 0,
      mvpId: 0,
      placements: [],
    };

    await saveItem<Tournament>("tournaments", newTournament);
    setSelectedTournamentId(newTournament.id);
    setTournamentForm({
      title: newTournament.title,
      game: "",
      type: "",
      date: "",
      prize: "",
    });
  };

  const deleteTournament = async () => {
    if (!selectedTournament) return;

    const deletedId = selectedTournament.id;

    await Promise.all([
      deleteItem("tournaments", deletedId),
      ...matches
        .filter((match) => match.tournamentId === deletedId)
        .map((match) => deleteItem("matches", match.id)),
    ]);
  };

  const saveMatch = async () => {
    if (!selectedMatch) return;

    await saveItem<Match>("matches", {
      ...selectedMatch,
      game: matchForm.game,
      player1: Number(matchForm.player1),
      player2: Number(matchForm.player2),
      score: matchForm.score,
      winnerId: Number(matchForm.winnerId),
      tournamentId: Number(matchForm.tournamentId),
      date: matchForm.date,
      eloApplied: Boolean(matchForm.eloApplied),
    });
  };

  const addMatch = async () => {
    const newMatch: Match = {
      id: getNextId(matches),
      game: "",
      player1: 0,
      player2: 0,
      score: "",
      winnerId: 0,
      tournamentId: 0,
      date: "",
      eloApplied: false,
    };

    await saveItem<Match>("matches", newMatch);
    setSelectedMatchId(newMatch.id);
    setMatchForm(createEmptyMatchForm());
  };

  const deleteMatch = async () => {
    if (!selectedMatch) return;
    await deleteItem("matches", selectedMatch.id);
  };

  const saveAchievement = async (
    achievementId: number,
    updates: Partial<Achievement>
  ) => {
    const currentAchievement = achievements.find(
      (achievement) => achievement.id === achievementId
    );
    if (!currentAchievement) return;

    await saveItem<Achievement>("achievements", {
      ...currentAchievement,
      ...updates,
    });
  };

  const addAchievement = async () => {
    const newAchievement: Achievement = {
      id: getNextId(achievements),
      title: "New Achievement",
      description: "",
      image: achievementPlaceholder("A"),
      playerIds: [],
    };

    await saveItem<Achievement>("achievements", newAchievement);
  };

  const deleteAchievement = async (achievementId: number) => {
    await deleteItem("achievements", achievementId);
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword("");
      setAdminError("");
      setActiveTab("admin");
      return;
    }

    setAdminError("Wrong admin password.");
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
    setAdminPassword("");
    setAdminError("");
    setActiveTab("players");
  };

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <div>
            <p className="hero-kicker">Sansara App</p>
            <h1 className="hero-title">Sansara</h1>
            <h1 className="hero-title">Zalischyky</h1>

            <div className="hero-auth-row">
              {isAdmin ? (
                <>
                  <span className="admin-badge">Admin mode enabled</span>
                  <button className="secondary-btn" onClick={handleAdminLogout}>
                    Logout
                  </button>
                </>
              ) : null}

              {showAdminLogin ? (
                <div className="admin-login-box">
                  <div className="admin-login-hint">
                    Secret shortcut: Ctrl + Shift + L
                  </div>

                  <input
                    className="input"
                    type="password"
                    placeholder="Admin password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError("");
                    }}
                  />

                  <div style={{ marginTop: 16 }}>
                    <div className="btn-row">
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={handleAdminLogin}
                      >
                        Enter
                      </button>

                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          setShowAdminLogin(false);
                          setAdminPassword("");
                          setAdminError("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {adminError ? (
                    <div className="admin-login-error">{adminError}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="hero-stats">
            <StatCard title="Players" value={players.length} />
            <StatCard title="Teams" value={teams.length} />
            <StatCard title="Matches" value={matches.length} />
            <StatCard
              title="Top ELO"
              value={Math.max(...players.map((p) => p.elo), 0)}
            />
          </div>
        </div>

        <div className="tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn ${
                activeTab === tab.key ? "tab-btn-active" : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "players" && (
          <PlayersTab
            players={players}
            teams={teams}
            matches={matches}
            tournaments={tournaments}
            achievements={achievements}
            selectedPlayerId={selectedPlayerId}
            setSelectedPlayerId={setSelectedPlayerId}
            search={search}
            setSearch={setSearch}
            gameFilter={gameFilter}
            setGameFilter={setGameFilter}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            sortMode={sortMode}
            setSortMode={setSortMode}
            gamesList={gamesList}
          />
        )}

        {activeTab === "teams" && (
          <TeamsTab
            teams={teams}
            players={players}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
          />
        )}

        {activeTab === "tournaments" && (
          <TournamentsTab tournaments={tournaments} players={players} />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardTab players={players} teams={teams} />
        )}

        {activeTab === "admin" && isAdmin && (
          <AdminTab
            players={players}
            teams={teams}
            tournaments={tournaments}
            matches={matches}
            achievements={achievements}
            selectedPlayerId={selectedPlayerId}
            setSelectedPlayerId={setSelectedPlayerId}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            selectedTournamentId={selectedTournamentId}
            setSelectedTournamentId={setSelectedTournamentId}
            selectedMatchId={selectedMatchId}
            setSelectedMatchId={setSelectedMatchId}
            playerForm={playerForm}
            setPlayerForm={setPlayerForm}
            teamForm={teamForm}
            setTeamForm={setTeamForm}
            tournamentForm={tournamentForm}
            setTournamentForm={setTournamentForm}
            matchForm={matchForm}
            setMatchForm={setMatchForm}
            handlePlayerAvatarUpload={handlePlayerAvatarUpload}
            handleTeamLogoUpload={handleTeamLogoUpload}
            savePlayer={savePlayer}
            addPlayer={addPlayer}
            deletePlayer={deletePlayer}
            saveTeam={saveTeam}
            addTeam={addTeam}
            deleteTeam={deleteTeam}
            saveTournament={saveTournament}
            addTournament={addTournament}
            deleteTournament={deleteTournament}
            saveMatch={saveMatch}
            addMatch={addMatch}
            deleteMatch={deleteMatch}
            saveAchievement={saveAchievement}
            addAchievement={addAchievement}
            deleteAchievement={deleteAchievement}
            updatePlayerTransfer={updatePlayerTransfer}
            addPlayerTransfer={addPlayerTransfer}
            deletePlayerTransfer={deletePlayerTransfer}
          />
        )}
      </div>
    </div>
  );
}
