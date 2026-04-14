import { Player, Team } from "../types";

type Props = {
  player: Player | null;
  teams: Team[];
};

export default function PlayerProfile({ player, teams }: Props) {
  if (!player) {
    return <div className="card">Select player</div>;
  }

  const teamName = teams.find((team) => team.id === player.teamId)?.name || "—";

  return (
    <div className="card player-profile">
      <h2 className="player-profile-name">{player.nickname}</h2>

      <div className="player-profile-meta">
        <div className="player-profile-line">
          <span className="player-profile-label">Команда:</span>
          <span
            className={
              teamName === "—" ? "player-profile-empty" : "player-profile-team"
            }
          >
            {teamName}
          </span>
        </div>

        <div className="player-profile-line">
          <span className="player-profile-label">Ігри:</span>
          {player.games.length > 0 ? (
            <div className="player-profile-games">
              {player.games.map((game) => (
                <span key={game} className="player-profile-tag">
                  {game}
                </span>
              ))}
            </div>
          ) : (
            <span className="player-profile-empty">не брав участі</span>
          )}
        </div>
      </div>

      <div className="player-stats">
        <div className="player-stat">
          <span className="player-stat-label">ELO</span>
          <span className="player-stat-value">{player.elo}</span>
        </div>

        <div className="player-stat">
          <span className="player-stat-label">Wins</span>
          <span className="player-stat-value">{player.wins}</span>
        </div>

        <div className="player-stat">
          <span className="player-stat-label">Earnings</span>
          <span className="player-stat-value">{player.earnings} ₴</span>
        </div>
      </div>
    </div>
  );
}
