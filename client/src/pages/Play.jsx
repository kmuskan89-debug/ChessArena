import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useChessGame } from '../hooks/useChessGame.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import Board from '../components/Board.jsx';
import MovesPanel from '../components/MovesPanel.jsx';
import GameControls from '../components/GameControls.jsx';
import TalkWithMe from '../components/TalkWithMe.jsx';

export default function Play() {
  const { user, isAuthenticated, updateUserRating } = useAuth();
  const [saveToast, setSaveToast] = useState({ visible: false, message: '' });
  const hasSavedCurrentGameRef = useRef(false);

  const {
    fen,
    userColor,
    boardOrientation,
    currentTurn,
    difficulty,
    isBotThinking,
    isGameOver,
    gameStatus,
    completedGameData,
    movePairs,
    lastMove,
    selectedSquare,
    legalMoves,
    timeControl,
    whiteTime,
    blackTime,
    isMuted,
    makeMove,
    handleSquareClick,
    resetGame,
    flipBoard,
    setDifficulty,
    setTimeControl,
    togglePlaySide,
    toggleMute,
  } = useChessGame();

  const playerName = user?.username || 'You';
  const playerRating = user?.rating ?? 1200;

  // Save game when completed (logged-in users only)
  useEffect(() => {
    if (!completedGameData || !isAuthenticated || hasSavedCurrentGameRef.current) {
      return;
    }

    // Only save if at least one move occurred
    if (completedGameData.moveCount === 0) {
      return;
    }

    hasSavedCurrentGameRef.current = true;

    const saveCompletedGame = async () => {
      try {
        const response = await api.post('/games', completedGameData);
        if (response.data && response.data.success) {
          const { newRating, ratingChange } = response.data;
          if (typeof newRating === 'number' && updateUserRating) {
            updateUserRating(newRating);
          }

          const changeFormatted = typeof ratingChange === 'number'
            ? `${ratingChange >= 0 ? '+' : ''}${ratingChange} → ${newRating}`
            : null;

          const toastMessage = changeFormatted
            ? `Game saved! ${changeFormatted}`
            : 'Game saved to history!';

          setSaveToast({ visible: true, message: toastMessage });
          setTimeout(() => {
            setSaveToast({ visible: false, message: '' });
          }, 4000);
        }
      } catch (err) {
        // Quietly log error without interrupting the UI
        console.warn('Silent game save failure:', err.response?.data?.message || err.message);
      }
    };

    saveCompletedGame();
  }, [completedGameData, isAuthenticated, updateUserRating]);

  const handleResetGame = () => {
    hasSavedCurrentGameRef.current = false;
    resetGame();
  };

  const handleToggleSide = (newSide) => {
    hasSavedCurrentGameRef.current = false;
    togglePlaySide(newSide);
  };

  const handleTimeControlChange = (newControl) => {
    hasSavedCurrentGameRef.current = false;
    setTimeControl(newControl);
  };

  return (
    <div className="play-page-container">
      {/* Toast Notification */}
      {saveToast.visible && (
        <div className="game-saved-toast" role="status">
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* Subheader Toolbar */}
      <header className="play-header">
        <div className="header-left">
          <Link to="/" className="back-home-link" title="Return to Home">
            Back to Home
          </Link>
        </div>

        <div className="header-right">
          <span className="header-mode-badge">Practice vs Muskan</span>
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
            playerName={playerName}
            playerRating={playerRating}
            timeControl={timeControl}
            whiteTime={whiteTime}
            blackTime={blackTime}
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
            timeControl={timeControl}
            isMuted={isMuted}
            onDifficultyChange={setDifficulty}
            onTimeControlChange={handleTimeControlChange}
            onToggleSide={handleToggleSide}
            onToggleMute={toggleMute}
            onResetGame={handleResetGame}
            onFlipBoard={flipBoard}
            boardOrientation={boardOrientation}
          />
          <MovesPanel movePairs={movePairs} />
        </aside>
      </main>
    </div>
  );
}
