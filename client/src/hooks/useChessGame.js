import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';

// Depth mapping for bot difficulty levels
export const DIFFICULTY_DEPTHS = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export function useChessGame() {
  const chessRef = useRef(new Chess());
  const workerRef = useRef(null);
  const botTimeoutRef = useRef(null);
  const requestIdRef = useRef(0);
  const requestStartTimeRef = useRef(0);

  // Board & game state
  const [fen, setFen] = useState(chessRef.current.fen());
  const [userColor, setUserColor] = useState('white'); // 'white' or 'black'
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);

  // Bot state
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Live game status queries from chess.js
  const currentTurn = chessRef.current.turn() === 'w' ? 'white' : 'black';
  const inCheck = chessRef.current.inCheck();
  const isCheckmate = chessRef.current.isCheckmate();
  const isStalemate = chessRef.current.isStalemate();
  const isDraw = chessRef.current.isDraw();
  const isGameOver = chessRef.current.isGameOver();

  // Formatted status state
  const gameStatus = useMemo(() => {
    if (isCheckmate) {
      const winner = chessRef.current.turn() === 'w' ? 'Black' : 'White';
      return { type: 'checkmate', text: `Checkmate! ${winner} wins!`, isTerminal: true };
    }
    if (isStalemate) {
      return { type: 'stalemate', text: 'Draw by stalemate', isTerminal: true };
    }
    if (isDraw) {
      if (chessRef.current.isThreefoldRepetition?.()) {
        return { type: 'draw', text: 'Draw by threefold repetition', isTerminal: true };
      }
      if (chessRef.current.isInsufficientMaterial?.()) {
        return { type: 'draw', text: 'Draw by insufficient material', isTerminal: true };
      }
      return { type: 'draw', text: 'Game drawn', isTerminal: true };
    }
    if (isBotThinking) {
      return {
        type: 'bot-thinking',
        text: 'Bot is thinking...',
        isTerminal: false,
      };
    }
    if (inCheck) {
      return {
        type: 'check',
        text: `${currentTurn === 'white' ? 'White' : 'Black'} is in check!`,
        isTerminal: false,
      };
    }
    return {
      type: 'active',
      text: `${currentTurn === 'white' ? "White" : "Black"}'s turn`,
      isTerminal: false,
    };
  }, [fen, isCheckmate, isStalemate, isDraw, inCheck, currentTurn, isBotThinking]);

  // Pair moves into [ { moveNumber: 1, white: 'e4', black: 'e5' }, ... ]
  const movePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1] || null,
      });
    }
    return pairs;
  }, [moveHistory]);

  // Legal moves for currently selected square
  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      return chessRef.current.moves({
        square: selectedSquare,
        verbose: true,
      });
    } catch {
      return [];
    }
  }, [selectedSquare, fen]);

  // Execute a move via chess.js
  const makeMove = useCallback((moveInput) => {
    try {
      const game = chessRef.current;
      const move = game.move({
        from: moveInput.from,
        to: moveInput.to,
        promotion: moveInput.promotion || 'q',
      });

      if (move) {
        setFen(game.fen());
        setLastMove({ from: move.from, to: move.to });
        setMoveHistory((prev) => [...prev, move]);
        setSelectedSquare(null);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  // Web Worker initialization
  useEffect(() => {
    const worker = new Worker(
      new URL('../engine/bot.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { success, bestMove, requestId } = event.data;

      // Ignore outdated replies from previous resets or moves
      if (requestId !== requestIdRef.current) return;

      // Ensure artificial delay of at least 400ms so moves feel natural
      const elapsed = Date.now() - requestStartTimeRef.current;
      const remainingDelay = Math.max(0, 400 - elapsed);

      botTimeoutRef.current = setTimeout(() => {
        if (requestId === requestIdRef.current) {
          if (success && bestMove) {
            makeMove(bestMove);
          }
          setIsBotThinking(false);
        }
      }, remainingDelay);
    };

    return () => {
      worker.terminate();
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [makeMove]);

  // Trigger bot move whenever it is the bot's turn
  useEffect(() => {
    const isBotTurn = !isGameOver && currentTurn !== userColor;

    if (!isBotTurn) {
      setIsBotThinking(false);
      return;
    }

    setIsBotThinking(true);
    requestStartTimeRef.current = Date.now();
    const searchDepth = DIFFICULTY_DEPTHS[difficulty] || 2;
    const currentRequestId = ++requestIdRef.current;

    if (workerRef.current) {
      workerRef.current.postMessage({
        fen: chessRef.current.fen(),
        depth: searchDepth,
        requestId: currentRequestId,
      });
    }
  }, [fen, currentTurn, userColor, difficulty, isGameOver]);

  // Handle click on square for select-and-move workflow
  const handleSquareClick = useCallback((square) => {
    // Block user interaction when game is over or when bot is thinking / bot's turn
    if (chessRef.current.isGameOver() || isBotThinking || currentTurn !== userColor) {
      return;
    }

    if (selectedSquare) {
      const isLegal = legalMoves.some((m) => m.to === square);
      if (isLegal) {
        makeMove({ from: selectedSquare, to: square, promotion: 'q' });
        return;
      }
    }

    const piece = chessRef.current.get(square);
    if (piece && piece.color === chessRef.current.turn()) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  }, [selectedSquare, legalMoves, makeMove, isBotThinking, currentTurn, userColor]);

  // Reset to initial game state
  const resetGame = useCallback((overrideUserColor = null) => {
    // Cancel any pending bot actions and timers
    requestIdRef.current++;
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    setIsBotThinking(false);

    chessRef.current = new Chess();
    setFen(chessRef.current.fen());
    setMoveHistory([]);
    setLastMove(null);
    setSelectedSquare(null);

    const activeUserColor = overrideUserColor !== null ? overrideUserColor : userColor;
    setBoardOrientation(activeUserColor);
  }, [userColor]);

  // Flip board perspective manually
  const flipBoard = useCallback(() => {
    setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  // Change side (Play as White / Play as Black)
  const togglePlaySide = useCallback((newSide) => {
    if (newSide === userColor) return;
    setUserColor(newSide);
    resetGame(newSide);
  }, [userColor, resetGame]);

  return {
    fen,
    userColor,
    boardOrientation,
    currentTurn,
    difficulty,
    isBotThinking,
    inCheck,
    isCheckmate,
    isGameOver,
    gameStatus,
    moveHistory,
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
  };
}
