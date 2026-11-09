export default function GameControls({
  currentTurn,
  gameStatus,
  isBotThinking = false,
  userColor = 'white',
  difficulty = 'medium',
  onDifficultyChange,
  onToggleSide,
  onResetGame,
  onFlipBoard,
  boardOrientation,
}) {
  const isWhiteTurn = currentTurn === 'white';

  return (
    <div className="game-controls-container">
      {/* Turn & Status Indicator */}
      <div className={`status-card status-${gameStatus.type}`}>
        <div className="status-header">
          <span className="status-label">CURRENT STATUS</span>
          {gameStatus.type !== 'active' && (
            <span className={`status-badge badge-${gameStatus.type}`}>
              {gameStatus.type === 'bot-thinking' ? 'AI THINKING' : gameStatus.type.toUpperCase()}
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

      {/* Bot Difficulty Selector */}
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-label">BOT DIFFICULTY</span>
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

      {/* Play Side Selector (Play as White / Play as Black) */}
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-label">YOUR SIDE</span>
        </div>
        <div className="side-segmented-control">
          <button
            type="button"
            className={`segmented-btn side-btn ${userColor === 'white' ? 'active-side' : ''}`}
            onClick={() => onToggleSide('white')}
          >
            <span className="side-icon">♔</span>
            <span>Play as White</span>
          </button>
          <button
            type="button"
            className={`segmented-btn side-btn ${userColor === 'black' ? 'active-side' : ''}`}
            onClick={() => onToggleSide('black')}
          >
            <span className="side-icon">♚</span>
            <span>Play as Black</span>
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
          <span className="btn-icon">🔄</span>
          <span>Flip Board</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onResetGame()}
        >
          <span className="btn-icon">⚔️</span>
          <span>New Game</span>
        </button>
      </div>
    </div>
  );
}
