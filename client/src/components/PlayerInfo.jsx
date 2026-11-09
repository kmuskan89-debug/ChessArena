// Helper to format seconds as MM:SS
const formatClock = (seconds) => {
  if (seconds === undefined || seconds === null) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function PlayerInfo({
  name,
  rating = 1200,
  color,
  isTurn,
  isThinking = false,
  statusText = 'Turn',
  timeRemaining = null,
  capturedPieces = [],
}) {
  const isWhite = color === 'white';
  const hasClock = timeRemaining !== null && timeRemaining !== undefined;
  const isDangerTime = hasClock && timeRemaining <= 20 && timeRemaining > 0;

  return (
    <div className={`player-info-bar ${isTurn ? 'active-turn' : ''}`}>
      <div className="player-left">
        <span className={`player-side-disc ${isWhite ? 'side-white' : 'side-black'}`}>
          {isWhite ? 'W' : 'B'}
        </span>
        <div className="player-details">
          <div className="player-name-row">
            <span className="player-name">{name}</span>
            <span className="player-rating">({rating})</span>
          </div>
          {capturedPieces.length > 0 && (
            <div className="player-captured">
              {capturedPieces.map((p, i) => (
                <span key={i} className="captured-piece">{p}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="player-right-actions">
        {/* Digital Chess Clock */}
        {hasClock && (
          <div
            className={`player-clock ${isTurn ? 'clock-active' : ''} ${
              isDangerTime ? 'clock-danger' : ''
            }`}
          >
            <span className="clock-digits">{formatClock(timeRemaining)}</span>
          </div>
        )}

        {/* Turn / Thinking Badge */}
        {isTurn && (
          <span className={`turn-badge ${isThinking ? 'bot-thinking-badge' : ''}`}>
            {isThinking ? 'Thinking...' : statusText}
          </span>
        )}
      </div>
    </div>
  );
}
