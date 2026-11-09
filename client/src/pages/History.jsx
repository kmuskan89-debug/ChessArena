import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

export default function History() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  const fetchGames = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/games?page=${pageNumber}&limit=10`);
      if (response.data?.success) {
        setGames(response.data.games || []);
        setPage(response.data.page || 1);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load match history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames(page);
  }, [fetchGames, page]);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent row navigation
    const confirmed = window.confirm('Are you sure you want to delete this game record from your history?');
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const response = await api.delete(`/games/${id}`);
      if (response.data?.success) {
        // Refresh page or go back a page if deleting last item on current page
        if (games.length === 1 && page > 1) {
          setPage((prev) => prev - 1);
        } else {
          fetchGames(page);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete game.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="history-page-container">
      <div className="history-card">
        {/* Header */}
        <div className="history-header">
          <div className="history-title-group">
            <div>
              <h1 className="history-title">Match History</h1>
              <p className="history-subtitle">
                {total === 1 ? '1 game recorded' : `${total} games recorded`}
              </p>
            </div>
          </div>

          <Link to="/play" className="btn btn-primary">
            Play New Game
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-alert-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginLeft: 'auto', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => fetchGames(page)}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="history-loading-container">
            <div className="auth-spinner"></div>
            <p>Loading match history...</p>
          </div>
        ) : games.length === 0 ? (
          /* Empty State */
          <div className="history-empty-state">
            <h3>No games yet</h3>
            <p>Your finished games against the AI bot will be saved and reviewed here.</p>
            <Link to="/play" className="btn btn-primary">
              Play vs Bot
            </Link>
          </div>
        ) : (
          /* Games List Table */
          <>
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Result</th>
                    <th>Rating Change</th>
                    <th>Bot Level</th>
                    <th>Your Side</th>
                    <th>Moves</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => {
                    const isWin = game.result === 'win';
                    const isLoss = game.result === 'loss';
                    const isDeleting = deletingId === game._id;

                    return (
                      <tr
                        key={game._id}
                        className="history-row"
                        onClick={() => navigate(`/history/${game._id}`)}
                        title="Click to view interactive game replay"
                      >
                        {/* Result Badge */}
                        <td>
                          <span
                            className={`result-badge ${
                              isWin
                                ? 'result-win'
                                : isLoss
                                ? 'result-loss'
                                : 'result-draw'
                            }`}
                          >
                            {isWin ? 'Win' : isLoss ? 'Loss' : 'Draw'}
                          </span>
                        </td>

                        {/* Rating Change */}
                        <td>
                          {typeof game.ratingChange === 'number' ? (
                            <span
                              className={`rating-change-pill ${
                                game.ratingChange > 0
                                  ? 'rating-pill-gain'
                                  : game.ratingChange < 0
                                  ? 'rating-pill-loss'
                                  : 'rating-pill-neutral'
                              }`}
                              title={`Before: ${game.ratingBefore ?? '?'} | After: ${game.ratingAfter ?? '?'}`}
                            >
                              {game.ratingChange > 0 ? `+${game.ratingChange}` : game.ratingChange}
                              {game.ratingAfter != null && (
                                <span className="rating-after-subtext"> ({game.ratingAfter})</span>
                              )}
                            </span>
                          ) : (
                            <span className="rating-pill-unrated">—</span>
                          )}
                        </td>

                        {/* Bot Level */}
                        <td>
                          <span className="bot-level-text">
                            {game.botLevel === 1
                              ? 'Level 1 (Easy)'
                              : game.botLevel === 2
                              ? 'Level 2 (Medium)'
                              : 'Level 3 (Hard)'}
                          </span>
                        </td>

                        {/* Player Color */}
                        <td>
                          <span className="side-indicator">
                            <span>{game.userColor === 'white' ? 'White' : 'Black'}</span>
                          </span>
                        </td>

                        {/* Move Count */}
                        <td>
                          <span className="move-count-text">
                            {game.moveCount || 0} moves
                          </span>
                        </td>

                        {/* Date */}
                        <td>
                          <span className="history-date-text">
                            {formatDate(game.createdAt)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="history-row-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-replay-mini"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/history/${game._id}`);
                              }}
                            >
                              Replay
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-delete-game"
                              disabled={isDeleting}
                              onClick={(e) => handleDelete(e, game._id)}
                              title="Delete game record"
                            >
                              {isDeleting ? '...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="history-pagination">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

