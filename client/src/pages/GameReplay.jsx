import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import api from '../api/axios.js';

export default function GameReplay() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const activeMoveRef = useRef(null);

  // Fetch game by ID
  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/games/${id}`);
        if (response.data?.success && response.data.game) {
          setGame(response.data.game);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load game for replay.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  // Parse PGN and precalculate FEN positions and move metadata
  const { positions, moves, movePairs } = useMemo(() => {
    if (!game?.pgn) {
      return { positions: ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'], moves: [], movePairs: [] };
    }

    try {
      const chess = new Chess();
      chess.loadPgn(game.pgn);
      const moveList = chess.history({ verbose: true });

      // Step-by-step reconstruction from beginning
      const replayChess = new Chess();
      const posList = [replayChess.fen()];

      for (const m of moveList) {
        replayChess.move(m);
        posList.push(replayChess.fen());
      }

      // Group moves into turns for the moves panel
      const pairs = [];
      for (let i = 0; i < moveList.length; i += 2) {
        pairs.push({
          turnNumber: Math.floor(i / 2) + 1,
          whiteMove: { ...moveList[i], stepIndex: i + 1 },
          blackMove: moveList[i + 1] ? { ...moveList[i + 1], stepIndex: i + 2 } : null,
        });
      }

      return {
        positions: posList,
        moves: moveList,
        movePairs: pairs,
      };
    } catch (parseError) {
      console.error('Error parsing replay PGN:', parseError);
      return { positions: ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'], moves: [], movePairs: [] };
    }
  }, [game]);

  const totalSteps = moves.length;

  // Jump to specific step
  const goToStep = useCallback(
    (step) => {
      const clamped = Math.max(0, Math.min(totalSteps, step));
      setCurrentStep(clamped);
    },
    [totalSteps]
  );

  const goStart = useCallback(() => goToStep(0), [goToStep]);
  const goPrev = useCallback(() => goToStep(currentStep - 1), [goToStep, currentStep]);
  const goNext = useCallback(() => goToStep(currentStep + 1), [goToStep, currentStep]);
  const goEnd = useCallback(() => goToStep(totalSteps), [goToStep, totalSteps]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Home, End)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goStart();
      } else if (e.key === 'End') {
        e.preventDefault();
        goEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext, goStart, goEnd]);

  // Auto-scroll moves panel to current move
  useEffect(() => {
    activeMoveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentStep]);

  // Highlights for the current move (from and to squares) using --highlight
  const squareStyles = useMemo(() => {
    if (currentStep === 0 || !moves[currentStep - 1]) return {};
    const move = moves[currentStep - 1];
    return {
      [move.from]: { backgroundColor: 'var(--highlight)' },
      [move.to]: { backgroundColor: 'var(--highlight)' },
    };
  }, [currentStep, moves]);

  if (loading) {
    return (
      <div className="history-page-container">
        <div className="history-card history-loading-container">
          <div className="auth-spinner"></div>
          <p>Loading game replay...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="history-page-container">
        <div className="history-card history-empty-state">
          <h3>Game Not Found</h3>
          <p>{error || 'The requested game could not be loaded.'}</p>
          <Link to="/history" className="btn btn-primary">
            Back to Match History
          </Link>
        </div>
      </div>
    );
  }

  const isWin = game.result === 'win';
  const isLoss = game.result === 'loss';

  return (
    <div className="replay-page-container">
      {/* Header Bar */}
      <div className="replay-header">
        <Link to="/history" className="back-home-link">
          Back to History
        </Link>

        <div className="replay-metadata-group">
          <span
            className={`result-badge ${
              isWin ? 'result-win' : isLoss ? 'result-loss' : 'result-draw'
            }`}
          >
            {isWin ? 'Win' : isLoss ? 'Loss' : 'Draw'}
          </span>

          <span className="bot-level-text">
            Bot Level {game.botLevel}
          </span>

          <span className="side-indicator">
            <span>You played {game.userColor}</span>
          </span>

          <span className="replay-step-info">
            {currentStep === 0
              ? 'Starting position'
              : `Move ${currentStep} of ${totalSteps} (${moves[currentStep - 1]?.san})`}
          </span>
        </div>
      </div>

      {/* Main Replay Layout (Board + Moves Panel) */}
      <div className="replay-main-grid">
        {/* Left: Interactive Chessboard */}
        <div className="replay-board-wrapper">
          <div className="chessboard-container replay-chessboard">
            <Chessboard
              options={{
                position: positions[currentStep] || positions[0],
                boardOrientation: game.userColor || 'white',
                squareStyles,
                darkSquareStyle: { backgroundColor: 'var(--board-dark)' },
                lightSquareStyle: { backgroundColor: 'var(--board-light)' },
                boardStyle: {
                  borderRadius: 'var(--radius-panel)',
                  border: '1px solid var(--border)',
                  boxShadow: 'none',
                  overflow: 'hidden',
                },
                canDragPiece: () => false,
              }}
            />
          </div>

          {/* Navigation Controls Toolbar */}
          <div className="replay-controls-toolbar">
            <button
              type="button"
              className="btn btn-secondary replay-ctrl-btn"
              onClick={goStart}
              disabled={currentStep === 0}
              title="Jump to start (Home key)"
            >
              First
            </button>
            <button
              type="button"
              className="btn btn-secondary replay-ctrl-btn"
              onClick={goPrev}
              disabled={currentStep === 0}
              title="Previous move (Left arrow)"
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn-secondary replay-ctrl-btn"
              onClick={goNext}
              disabled={currentStep >= totalSteps}
              title="Next move (Right arrow)"
            >
              Next
            </button>
            <button
              type="button"
              className="btn btn-secondary replay-ctrl-btn"
              onClick={goEnd}
              disabled={currentStep >= totalSteps}
              title="Jump to end (End key)"
            >
              Last
            </button>
          </div>
        </div>

        {/* Right: Interactive Move History List */}
        <div className="panel replay-moves-panel">
          <div className="panel-header">
            <h3 className="panel-title">PGN Move List</h3>
            <span className="moves-count-text">{moves.length} moves</span>
          </div>

          <div className="moves-list-scrollable replay-moves-scroll">
            <table className="moves-table">
              <thead>
                <tr>
                  <th className="th-num">#</th>
                  <th className="th-white">White</th>
                  <th className="th-black">Black</th>
                </tr>
              </thead>
              <tbody>
                {movePairs.map((pair) => {
                  const isWhiteActive = currentStep === pair.whiteMove.stepIndex;
                  const isBlackActive = pair.blackMove && currentStep === pair.blackMove.stepIndex;

                  return (
                    <tr key={pair.turnNumber} className="move-row">
                      <td className="td-num">{pair.turnNumber}.</td>
                      <td
                        ref={isWhiteActive ? activeMoveRef : null}
                        className={`td-move td-clickable ${isWhiteActive ? 'active-san' : ''}`}
                        onClick={() => goToStep(pair.whiteMove.stepIndex)}
                        title={`Jump to move ${pair.whiteMove.san}`}
                      >
                        {pair.whiteMove.san}
                      </td>
                      <td
                        ref={isBlackActive ? activeMoveRef : null}
                        className={`td-move td-clickable ${isBlackActive ? 'active-san' : ''}`}
                        onClick={() => pair.blackMove && goToStep(pair.blackMove.stepIndex)}
                        title={pair.blackMove ? `Jump to move ${pair.blackMove.san}` : ''}
                      >
                        {pair.blackMove ? pair.blackMove.san : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

