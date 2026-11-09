import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-hero-card">
        <div className="home-badge">
          <span>⚡ Live Interactive Chess</span>
        </div>
        <div className="home-icon-header">
          <span className="home-chess-piece">♞</span>
        </div>
        <h1 className="home-title">Chess Arena</h1>
        <p className="home-subtitle">
          Master the board. Play, analyze moves in real time, and sharpen your tactics
          in a sleek modern arena.
        </p>

        <div className="home-actions">
          <Link to="/play" className="btn btn-primary btn-large">
            <span>Play Now</span>
            <span className="btn-arrow">→</span>
          </Link>
        </div>

        <div className="home-features-grid">
          <div className="feature-item">
            <span className="feature-icon">🛡️</span>
            <h4>Full Rule Validation</h4>
            <p>Powered by chess.js with move validation and check detection.</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <h4>Interactive Board</h4>
            <p>Drag-and-drop, click-to-move, legal move dots, and move highlights.</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <h4>SAN Notation</h4>
            <p>Auto-scrolling move history paired move-by-move.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

