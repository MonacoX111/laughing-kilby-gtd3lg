import { ChangeEvent, useEffect, useMemo, useState } from "react";
import PlayersTab from "./components/PlayersTab";
import TeamsTab from "./components/TeamsTab";
import TournamentsTab from "./components/TournamentsTab";
import LeaderboardTab from "./components/LeaderboardTab";
import AdminTab from "./components/AdminTab";
import "./styles.css";
import {
  achievementPlaceholder,
  gamesList,
  initialAchievements,
  initialMatches,
  initialPlayers,
  initialTeams,
  initialTournaments,
} from "./data";
import {
  Achievement,
  Match,
  Player,
  TabKey,
  Team,
  Tournament,
  Transfer,
} from "./types";
import {
  getNextId,
  parseList,
  readStorage,
  syncTeamPlayers,
  writeStorage,
} from "./utils";
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
  const [players, setPlayers] = useState<Player[]>(() =>
    readStorage("tm_players", initialPlayers)
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    readStorage("tm_teams", initialTeams)
  );
  const [tournaments, setTournaments] = useState<Tournament[]>(() =>
    readStorage("tm_tournaments", initialTournaments)
  );
  const [matches, setMatches] = useState<Match[]>(() =>
    readStorage("tm_matches", initialMatches)
  );
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    readStorage("tm_achievements", initialAchievements)
  );

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

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
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

  useEffect(() => writeStorage("tm_players", players), [players]);
  useEffect(() => writeStorage("tm_teams", teams), [teams]);
  useEffect(() => writeStorage("tm_tournaments", tournaments), [tournaments]);
  useEffect(() => writeStorage("tm_matches", matches), [matches]);
  useEffect(
    () => writeStorage("tm_achievements", achievements),
    [achievements]
  );

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

  const handlePlayerAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPlayer) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      setPlayers((prev) =>
        prev.map((player) =>
          player.id === selectedPlayer.id
            ? { ...player, avatar: result }
            : player
        )
      );
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleTeamLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTeam) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      setTeams((prev) =>
        prev.map((team) =>
          team.id === selectedTeam.id ? { ...team, logo: result } : team
        )
      );
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const updatePlayersState = (updater: (prev: Player[]) => Player[]) => {
    setPlayers((prev) => {
      const nextPlayers = updater(prev);
      setTeams((prevTeams) => syncTeamPlayers(nextPlayers, prevTeams));
      return nextPlayers;
    });
  };

  const sortTransfersNewestFirst = (transfers: Transfer[]) => {
    return [...transfers].sort((a, b) => {
      const aTime = new Date(a.date || 0).getTime();
      const bTime = new Date(b.date || 0).getTime();

      if (bTime !== aTime) return bTime - aTime;
      return b.id - a.id;
    });
  };

  const savePlayer = () => {
    if (!selectedPlayer) return;

    updatePlayersState((prev) =>
      prev.map((player) =>
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
      )
    );
  };

  const addPlayer = () => {
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

    const nextPlayers = [...players, newPlayer];
    updatePlayersState(() => nextPlayers);
    setSelectedPlayerId(newPlayer.id);
    setPlayerForm(createEmptyPlayerForm(nextPlayers.length + 1));
  };

  const updatePlayerTransfer = (
    playerId: number,
    transferId: number,
    updates: Partial<Transfer>
  ) => {
    updatePlayersState((prev) =>
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

  const addPlayerTransfer = (playerId: number) => {
    updatePlayersState((prev) =>
      prev.map((player) => {
        if (player.id !== playerId) return player;

        const currentTransfers = player.transferHistory ?? [];

        const newTransfer: Transfer = {
          id: Date.now(),
          fromTeamId: player.teamId || null,
          toTeamId: player.teamId || 0,
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

  const deletePlayerTransfer = (playerId: number, transferId: number) => {
    updatePlayersState((prev) =>
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

  const deletePlayer = () => {
    if (!selectedPlayer) return;

    const deletedId = selectedPlayer.id;
    const nextPlayers = players.filter((player) => player.id !== deletedId);

    setPlayers(nextPlayers);
    setTeams((prev) => syncTeamPlayers(nextPlayers, prev));
    setMatches((prev) =>
      prev.filter(
        (match) => match.player1 !== deletedId && match.player2 !== deletedId
      )
    );
    setAchievements((prev) =>
      prev.map((achievement) => ({
        ...achievement,
        playerIds: achievement.playerIds.filter((id) => id !== deletedId),
      }))
    );
    setTournaments((prev) =>
      prev.map((tournament) => ({
        ...tournament,
        winnerId: tournament.winnerId === deletedId ? 0 : tournament.winnerId,
        mvpId: tournament.mvpId === deletedId ? 0 : tournament.mvpId,
        placements: tournament.placements.filter(
          (item) => item.playerId !== deletedId
        ),
      }))
    );
  };

  const saveTeam = () => {
    if (!selectedTeam) return;

    setTeams((prev) =>
      prev.map((team) =>
        team.id === selectedTeam.id
          ? {
              ...team,
              name: teamForm.name,
              games: parseList(teamForm.games),
              wins: Number(teamForm.wins),
              earnings: Number(teamForm.earnings),
              description: teamForm.description,
            }
          : team
      )
    );
  };

  const addTeam = () => {
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

    setTeams((prev) => [...prev, newTeam]);
    setSelectedTeamId(newTeam.id);
    setTeamForm(createEmptyTeamForm());
  };

  const deleteTeam = () => {
    if (!selectedTeam) return;

    const deletedId = selectedTeam.id;
    const nextTeams = teams.filter((team) => team.id !== deletedId);

    setTeams(nextTeams);
    setPlayers((prev) =>
      prev.map((player) =>
        player.teamId === deletedId ? { ...player, teamId: 0 } : player
      )
    );
  };

  const saveTournament = () => {
    if (!selectedTournament) return;

    setTournaments((prev) =>
      prev.map((tournament) =>
        tournament.id === selectedTournament.id
          ? {
              ...tournament,
              title: tournamentForm.title,
              game: tournamentForm.game,
              type: tournamentForm.type,
              date: tournamentForm.date,
              prize: tournamentForm.prize,
            }
          : tournament
      )
    );
  };

  const addTournament = () => {
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

    setTournaments((prev) => [...prev, newTournament]);
    setSelectedTournamentId(newTournament.id);
    setTournamentForm({
      title: newTournament.title,
      game: "",
      type: "",
      date: "",
      prize: "",
    });
  };

  const deleteTournament = () => {
    if (!selectedTournament) return;

    const deletedId = selectedTournament.id;

    setTournaments((prev) =>
      prev.filter((tournament) => tournament.id !== deletedId)
    );

    setMatches((prev) =>
      prev.filter((match) => match.tournamentId !== deletedId)
    );
  };

  const saveMatch = () => {
    if (!selectedMatch) return;

    setMatches((prev) =>
      prev.map((match) =>
        match.id === selectedMatch.id
          ? {
              ...match,
              game: matchForm.game,
              player1: Number(matchForm.player1),
              player2: Number(matchForm.player2),
              score: matchForm.score,
              winnerId: Number(matchForm.winnerId),
              tournamentId: Number(matchForm.tournamentId),
              date: matchForm.date,
              eloApplied: Boolean(matchForm.eloApplied),
            }
          : match
      )
    );
  };

  const addMatch = () => {
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

    setMatches((prev) => [...prev, newMatch]);
    setSelectedMatchId(newMatch.id);
    setMatchForm({
      game: "",
      player1: 0,
      player2: 0,
      score: "",
      winnerId: 0,
      tournamentId: 0,
      date: "",
      eloApplied: false,
    });
  };

  const deleteMatch = () => {
    if (!selectedMatch) return;

    const deletedId = selectedMatch.id;
    setMatches((prev) => prev.filter((match) => match.id !== deletedId));
  };

  const saveAchievement = (
    achievementId: number,
    updates: Partial<Achievement>
  ) => {
    setAchievements((prev) =>
      prev.map((achievement) =>
        achievement.id === achievementId
          ? { ...achievement, ...updates }
          : achievement
      )
    );
  };

  const addAchievement = () => {
    const newAchievement: Achievement = {
      id: getNextId(achievements),
      title: "New Achievement",
      description: "",
      image: achievementPlaceholder("A"),
      playerIds: [],
    };

    setAchievements((prev) => [...prev, newAchievement]);
  };

  const deleteAchievement = (achievementId: number) => {
    setAchievements((prev) =>
      prev.filter((achievement) => achievement.id !== achievementId)
    );
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

                  <div className="btn-row">
                    <button className="primary-btn" onClick={handleAdminLogin}>
                      Enter
                    </button>
                    <button
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
