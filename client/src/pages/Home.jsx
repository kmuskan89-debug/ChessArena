import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">Chess Arena</h1>
        <p className="home-description">
          A minimalist chess arena to play against an AI bot, review past matches, and track your rating.
        </p>

        <div className="home-actions">
          <Link to="/play" className="btn btn-primary home-play-btn">
            Play
          </Link>
        </div>

        <div className="home-secondary-links">
          <Link to="/leaderboard" className="home-link">
            Leaderboard
          </Link>
          {!isAuthenticated && (
            <>
              <span className="home-link-divider">·</span>
              <Link to="/login" className="home-link">
                Log In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
