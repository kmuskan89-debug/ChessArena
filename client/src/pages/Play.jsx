import { Link } from 'react-router-dom';
import { useChessGame } from '../hooks/useChessGame.js';
import Board from '../components/Board.jsx';
import MovesPanel from '../components/MovesPanel.jsx';
import GameControls from '../components/GameControls.jsx';
import TalkWithMe from '../components/TalkWithMe.jsx';

export default function Play() {
  const {
    fen,
    userColor,
    boardOrientation,
    currentTurn,
    difficulty,
    isBotThinking,
    gameStatus,
    movePairs,
    lastMove,
    selectedSquare,
    legalMoves,
    makeMove,
    handleSquareClick,
    resetGame,
    flipBoard,
    setDifficulty,
    togglePlaySide,
  } = useChessGame();

  return (
    <div className="play-page-container">
      {/* Top Navbar */}
      <header className="play-header">
        <div className="header-left">
          <Link to="/" className="back-home-link" title="Return to Home">
            <span className="back-arrow">←</span>
            <span>Back to Home</span>
          </Link>
          <div className="brand-badge">
            <span className="brand-logo-icon">♟</span>
            <span className="brand-text">Chess Arena</span>
          </div>
        </div>

        <div className="header-right">
          <span className="header-mode-pill">vs AI Bot</span>
        </div>
      </header>

      {/* Main 3-column arena grid */}
      <main className="arena-3-col-layout">
        {/* Left Column: Talk with me panel */}
        <aside className="col-left">
          <TalkWithMe />
        </aside>

        {/* Center Column: Chessboard & Player Info */}
        <section className="col-center">
          <Board
            fen={fen}
            boardOrientation={boardOrientation}
            userColor={userColor}
            currentTurn={currentTurn}
            isBotThinking={isBotThinking}
            difficulty={difficulty}
            lastMove={lastMove}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            makeMove={makeMove}
            handleSquareClick={handleSquareClick}
          />
        </section>

        {/* Right Column: Status, Controls & Moves */}
        <aside className="col-right">
          <GameControls
            currentTurn={currentTurn}
            gameStatus={gameStatus}
            isBotThinking={isBotThinking}
            userColor={userColor}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            onToggleSide={togglePlaySide}
            onResetGame={resetGame}
            onFlipBoard={flipBoard}
            boardOrientation={boardOrientation}
          />
          <MovesPanel movePairs={movePairs} />
        </aside>
      </main>
    </div>
  );
}
