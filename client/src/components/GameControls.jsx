export default function GameControls({
  currentTurn,
  gameStatus,
  isBotThinking = false,
  userColor = 'white',
  difficulty = 'medium',
  timeControl = '5m',
  isMuted = false,
  onDifficultyChange,
  onTimeControlChange,
  onToggleSide,
  onToggleMute,
  onResetGame,
  onFlipBoard,
  boardOrientation,
}) {
  const isWhiteTurn = currentTurn === 'white';

  const timeControlOptions = [
    { id: 'none', label: 'Practice' },
    { id: '3m', label: '3 min' },
    { id: '5m', label: '5 min' },
    { id: '10m', label: '10 min' },
  ];

  return (
    <div className="game-controls-container">
      {/* Turn & Status Indicator */}
      <div className={`status-card status-${gameStatus.type}`}>
        <div className="status-header">
          <span className="status-label">Status</span>
          {gameStatus.type !== 'active' && (
            <span className={`status-badge badge-${gameStatus.type}`}>
              {gameStatus.type === 'bot-thinking'
                ? 'Thinking'
                : gameStatus.type === 'timeout'
                ? 'Time out'
                : gameStatus.type}
            </span>
          )}
        </div>

        <div className="status-body">
          <div className="turn-indicator">
            <span className={`turn-disc ${isWhiteTurn ? 'disc-white' : 'disc-black'}`} />
            <span className="turn-text">{gameStatus.text}</span>
          </div>
        </div>
      </div>

      {/* Clock Time Control Selector */}
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-label">Time Control</span>
          <span className="settings-depth-hint">
            {timeControl === 'none' ? 'Unlimited' : `${timeControl}`}
          </span>
        </div>
        <div className="difficulty-segmented-control time-segmented-control">
          {timeControlOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`segmented-btn ${timeControl === opt.id ? 'active-level' : ''}`}
              onClick={() => onTimeControlChange(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bot Difficulty Selector */}
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-label">Difficulty</span>
          <span className="settings-depth-hint">
            {difficulty === 'easy' ? 'Depth 1' : difficulty === 'medium' ? 'Depth 2' : 'Depth 3'}
          </span>
        </div>
        <div className="difficulty-segmented-control">
          {['easy', 'medium', 'hard'].map((level) => (
            <button
              key={level}
              type="button"
              className={`segmented-btn ${difficulty === level ? 'active-level' : ''}`}
              onClick={() => onDifficultyChange(level)}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Play Side Selector */}
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-label">Your Side</span>
          <button
            type="button"
            className={`btn-mute-toggle ${isMuted ? 'muted' : ''}`}
            onClick={onToggleMute}
          >
            {isMuted ? 'Sound off' : 'Sound on'}
          </button>
        </div>
        <div className="side-segmented-control">
          <button
            type="button"
            className={`segmented-btn side-btn ${userColor === 'white' ? 'active-side' : ''}`}
            onClick={() => onToggleSide('white')}
          >
            Play as White
          </button>
          <button
            type="button"
            className={`segmented-btn side-btn ${userColor === 'black' ? 'active-side' : ''}`}
            onClick={() => onToggleSide('black')}
          >
            Play as Black
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="controls-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onFlipBoard}
          title={`Board currently oriented to ${boardOrientation}`}
        >
          Flip Board
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onResetGame()}
        >
          New Game
        </button>
      </div>
    </div>
  );
}
