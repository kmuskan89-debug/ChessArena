import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/leaderboard');
      if (response.data?.success) {
        setLeaderboard(response.data.leaderboard || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load leaderboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard-page-container">
      <div className="leaderboard-card">
        {/* Header */}
        <div className="leaderboard-header">
          <div className="leaderboard-title-group">
            <div>
              <h1 className="leaderboard-title">Top Players</h1>
              <p className="leaderboard-subtitle">
                The top 10 rated players on Chess Arena
              </p>
            </div>
          </div>

          <div className="leaderboard-header-actions">
            <Link to="/play" className="btn btn-primary">
              Play vs Bot
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-alert-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginLeft: 'auto', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
              onClick={fetchLeaderboard}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="history-loading-container">
            <div className="auth-spinner"></div>
            <p>Loading leaderboard rankings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          /* Empty State */
          <div className="history-empty-state">
            <h3>No rated players yet</h3>
            <p>Play a rated match against the AI bot to appear on the leaderboard.</p>
            <Link to="/play" className="btn btn-primary">
              Play vs Bot
            </Link>
          </div>
        ) : (
          /* Leaderboard Table */
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                  <th>Player</th>
                  <th>Elo Rating</th>
                  <th style={{ textAlign: 'right' }}>Games Played</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => {
                  const rank = index + 1;
                  const isCurrentUser =
                    user &&
                    ((user._id && player._id && String(user._id) === String(player._id)) ||
                      user.username === player.username);

                  return (
                    <tr
                      key={player._id || player.username}
                      className={`leaderboard-row ${isCurrentUser ? 'current-user-row' : ''} ${
                        rank <= 3 ? `podium-row podium-${rank}` : ''
                      }`}
                    >
                      {/* Rank */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`rank-badge ${
                            rank === 1
                              ? 'rank-gold'
                              : rank === 2
                              ? 'rank-silver'
                              : rank === 3
                              ? 'rank-bronze'
                              : 'rank-standard'
                          }`}
                        >
                          #{rank}
                        </span>
                      </td>

                      {/* Username */}
                      <td>
                        <div className="player-cell">
                          <span className="player-username">{player.username}</span>
                          {isCurrentUser && (
                            <span className="you-tag-badge" title="This is your account">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Elo Rating */}
                      <td>
                        <span className="rating-number">{player.rating}</span>
                      </td>

                      {/* Games Played */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="games-played-badge">
                          {player.gamesPlayed || 0}{' '}
                          <span className="games-played-label">
                            {player.gamesPlayed === 1 ? 'game' : 'games'}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
