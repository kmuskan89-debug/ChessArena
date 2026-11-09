import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isPlayActive = location.pathname === '/play';
  const isLeaderboardActive = location.pathname.startsWith('/leaderboard');
  const isHistoryActive = location.pathname.startsWith('/history');

  return (
    <nav className="global-navbar">
      <div className="navbar-container">
        {/* Brand Logo / Site Name */}
        <Link to="/" className="navbar-brand">
          Chess Arena
        </Link>

        {/* Navigation & Auth Links on the Right */}
        <div className="navbar-right">
          <div className="navbar-links">
            <Link
              to="/play"
              className={`navbar-link ${isPlayActive ? 'active-link' : ''}`}
            >
              Play
            </Link>

            <Link
              to="/leaderboard"
              className={`navbar-link ${isLeaderboardActive ? 'active-link' : ''}`}
            >
              Leaderboard
            </Link>

            {isAuthenticated && (
              <Link
                to="/history"
                className={`navbar-link ${isHistoryActive ? 'active-link' : ''}`}
              >
                History
              </Link>
            )}
          </div>

          <div className="navbar-auth-actions">
            {isAuthenticated && user ? (
              <div className="user-profile-badge">
                <span className="user-display-name">{user.username}</span>
                <span className="user-rating-text">({user.rating || 1200})</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-logout"
                  onClick={logout}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="guest-auth-buttons">
                <Link to="/login" className="btn btn-secondary">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
