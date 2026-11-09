export default function PlayerInfo({
  name,
  rating = 1500,
  color,
  isTurn,
  isThinking = false,
  statusText = 'Turn',
  capturedPieces = [],
}) {
  const isWhite = color === 'white';

  return (
    <div className={`player-info-bar ${isTurn ? 'active-turn' : ''}`}>
      <div className="player-left">
        <div className={`player-avatar ${isWhite ? 'white-avatar' : 'black-avatar'}`}>
          {isWhite ? '♔' : '♚'}
        </div>
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
      {isTurn && (
        <div className={`turn-badge ${isThinking ? 'bot-thinking-badge' : ''}`}>
          <span className="turn-pulse"></span>
          {isThinking ? 'Bot thinking...' : statusText}
        </div>
      )}
    </div>
  );
}
