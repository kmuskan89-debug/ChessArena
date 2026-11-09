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
  lastMove,
  selectedSquare,
  legalMoves,
  makeMove,
  handleSquareClick,
}) {
  // Compute square styles for last moves and legal move indicators
  const customSquareStyles = useMemo(() => {
    const styles = {};

    // 1. Highlight last move (from & to)
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: 'rgba(168, 85, 247, 0.32)',
      };
      styles[lastMove.to] = {
        backgroundColor: 'rgba(168, 85, 247, 0.48)',
      };
    }

    // 2. Highlight selected square & legal moves (only if user's turn and not thinking)
    if (selectedSquare && !isBotThinking && currentTurn === userColor) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(192, 132, 252, 0.65)',
      };

      legalMoves.forEach((move) => {
        const isCapture = Boolean(move.captured) || move.flags?.includes('c') || move.flags?.includes('e');
        if (isCapture) {
          styles[move.to] = {
            background:
              'radial-gradient(circle, transparent 52%, rgba(239, 68, 68, 0.75) 56%, rgba(239, 68, 68, 0.75) 68%, transparent 72%)',
            cursor: 'pointer',
          };
        } else {
          styles[move.to] = {
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.85) 24%, transparent 28%)',
            cursor: 'pointer',
          };
        }
      });
    }

    return styles;
  }, [lastMove, selectedSquare, legalMoves, isBotThinking, currentTurn, userColor]);

  // Drop handler: prevents moving if bot is thinking or it's not user's turn
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

  // Determine top player (Opponent / Bot) vs bottom player (User)
  const isWhiteOrientation = boardOrientation === 'white';
  const topColor = isWhiteOrientation ? 'black' : 'white';
  const bottomColor = isWhiteOrientation ? 'white' : 'black';

  const isUserTop = userColor === topColor;
  const botRating = difficulty === 'easy' ? 1200 : difficulty === 'medium' ? 1500 : 1800;

  return (
    <div className="board-column-wrapper">
      {/* Top Player Info Bar (Above Board) */}
      <PlayerInfo
        name={isUserTop ? 'You' : `ChessBot (${difficulty.toUpperCase()})`}
        rating={isUserTop ? 1500 : botRating}
        color={topColor}
        isTurn={currentTurn === topColor}
        isThinking={!isUserTop && isBotThinking}
        statusText={!isUserTop && isBotThinking ? 'Thinking...' : 'To move'}
      />

      {/* Chessboard */}
      <div className={`chessboard-container ${isBotThinking ? 'board-disabled' : ''}`}>
        <Chessboard
          options={{
            position: fen,
            boardOrientation,
            squareStyles: customSquareStyles,
            darkSquareStyle: { backgroundColor: '#5c3d84' },
            lightSquareStyle: { backgroundColor: '#e2d9f3' },
            boardStyle: {
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55)',
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
        name={!isUserTop ? 'You' : `ChessBot (${difficulty.toUpperCase()})`}
        rating={!isUserTop ? 1500 : botRating}
        color={bottomColor}
        isTurn={currentTurn === bottomColor}
        isThinking={isUserTop && isBotThinking}
        statusText={isUserTop && isBotThinking ? 'Thinking...' : 'To move'}
      />
    </div>
  );
}
