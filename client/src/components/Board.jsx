import { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import PlayerInfo from './PlayerInfo.jsx';

export default function Board({
  fen,
  boardOrientation,
  userColor = 'white',
  currentTurn,
  isBotThinking = false,
  difficulty = 'medium',
  playerName = 'You',
  playerRating = 1200,
  timeControl = '5m',
  whiteTime = null,
  blackTime = null,
  lastMove,
  selectedSquare,
  legalMoves,
  makeMove,
  handleSquareClick,
}) {
  // Compute square styles for last moves and legal move indicators using CSS palette
  const customSquareStyles = useMemo(() => {
    const styles = {};

    // 1. Highlight last move (from & to) using --highlight: rgba(156, 61, 46, 0.30)
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: 'var(--highlight)',
      };
      styles[lastMove.to] = {
        backgroundColor: 'var(--highlight)',
      };
    }

    // 2. Highlight selected square & legal moves
    if (selectedSquare && !isBotThinking && currentTurn === userColor) {
      styles[selectedSquare] = {
        backgroundColor: 'var(--highlight)',
      };

      legalMoves.forEach((move) => {
        const isCapture = Boolean(move.captured) || move.flags?.includes('c') || move.flags?.includes('e');
        if (isCapture) {
          // Capture target: ring in --legal-dot rgba(43, 38, 32, 0.25)
          styles[move.to] = {
            background:
              'radial-gradient(circle, transparent 55%, var(--legal-dot) 57%, var(--legal-dot) 70%, transparent 72%)',
            cursor: 'pointer',
          };
        } else {
          // Standard legal move: dot in --legal-dot rgba(43, 38, 32, 0.25)
          styles[move.to] = {
            background: 'radial-gradient(circle, var(--legal-dot) 25%, transparent 26%)',
            cursor: 'pointer',
          };
        }
      });
    }

    return styles;
  }, [lastMove, selectedSquare, legalMoves, isBotThinking, currentTurn, userColor]);

  // Drop handler
  const handlePieceDrop = (arg1, arg2) => {
    if (isBotThinking || currentTurn !== userColor) {
      return false;
    }

    let sourceSquare;
    let targetSquare;

    if (typeof arg1 === 'object' && arg1 !== null) {
      sourceSquare = arg1.sourceSquare;
      targetSquare = arg1.targetSquare;
    } else {
      sourceSquare = arg1;
      targetSquare = arg2;
    }

    if (!sourceSquare || !targetSquare) return false;
    return makeMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
  };

  // Click handler
  const onSquareClick = (arg) => {
    if (isBotThinking || currentTurn !== userColor) return;
    const square = typeof arg === 'object' && arg !== null && 'square' in arg ? arg.square : arg;
    if (square) {
      handleSquareClick(square);
    }
  };

  const isWhiteOrientation = boardOrientation === 'white';
  const topColor = isWhiteOrientation ? 'black' : 'white';
  const bottomColor = isWhiteOrientation ? 'white' : 'black';

  const isUserTop = userColor === topColor;
  const botRating = difficulty === 'easy' ? 800 : difficulty === 'medium' ? 1200 : 1600;

  const topClock = timeControl !== 'none' ? (topColor === 'white' ? whiteTime : blackTime) : null;
  const bottomClock = timeControl !== 'none' ? (bottomColor === 'white' ? whiteTime : blackTime) : null;

  return (
    <div className="board-column-wrapper">
      {/* Top Player Info Bar (Above Board) */}
      <PlayerInfo
        name={isUserTop ? playerName : `ChessBot (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`}
        rating={isUserTop ? playerRating : botRating}
        color={topColor}
        isTurn={currentTurn === topColor}
        isThinking={!isUserTop && isBotThinking}
        statusText={!isUserTop && isBotThinking ? 'Thinking...' : 'To move'}
        timeRemaining={topClock}
      />

      {/* Chessboard */}
      <div className={`chessboard-container ${isBotThinking ? 'board-disabled' : ''}`}>
        <Chessboard
          options={{
            position: fen,
            boardOrientation,
            squareStyles: customSquareStyles,
            darkSquareStyle: { backgroundColor: 'var(--board-dark)' },
            lightSquareStyle: { backgroundColor: 'var(--board-light)' },
            boardStyle: {
              borderRadius: 'var(--radius-panel)',
              border: '1px solid var(--border)',
              boxShadow: 'none',
              overflow: 'hidden',
            },
            onPieceDrop: handlePieceDrop,
            onSquareClick: onSquareClick,
            canDragPiece: ({ piece }) => {
              if (isBotThinking || currentTurn !== userColor) return false;
              const expectedPrefix = userColor === 'white' ? 'w' : 'b';
              return piece?.pieceType?.[0] === expectedPrefix;
            },
          }}
        />
      </div>

      {/* Bottom Player Info Bar (Below Board) */}
      <PlayerInfo
        name={!isUserTop ? playerName : `ChessBot (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`}
        rating={!isUserTop ? playerRating : botRating}
        color={bottomColor}
        isTurn={currentTurn === bottomColor}
        isThinking={isUserTop && isBotThinking}
        statusText={isUserTop && isBotThinking ? 'Thinking...' : 'To move'}
        timeRemaining={bottomClock}
      />
    </div>
  );
}
