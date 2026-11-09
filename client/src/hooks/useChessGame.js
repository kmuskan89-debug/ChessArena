import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { gameEventBus } from '../utils/gameEvents.js';
import {
  playMoveSound,
  playCaptureSound,
  playCheckSound,
  playCastleSound,
  playVictorySound,
  playDefeatSound,
  playDrawSound,
  getMuteState,
  toggleMute,
} from '../utils/audio.js';

// Depth mapping for bot difficulty levels
export const DIFFICULTY_DEPTHS = {
  easy: 1,
  medium: 2,
  hard: 3,
};

// Time controls in seconds
export const TIME_CONTROLS = {
  none: 0,
  '3m': 180,
  '5m': 300,
  '10m': 600,
};

export function useChessGame() {
  const chessRef = useRef(new Chess());
  const workerRef = useRef(null);
  const botTimeoutRef = useRef(null);
  const clockIntervalRef = useRef(null);
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

  // Audio mute state
  const [isMuted, setIsMuted] = useState(() => getMuteState());

  // Clock & Timer state
  const [timeControl, setTimeControl] = useState('5m'); // 'none' | '3m' | '5m' | '10m'
  const [whiteTime, setWhiteTime] = useState(() => TIME_CONTROLS['5m']);
  const [blackTime, setBlackTime] = useState(() => TIME_CONTROLS['5m']);
  const [timeoutWinner, setTimeoutWinner] = useState(null); // 'white' | 'black' | null

  // Live game status queries from chess.js
  const currentTurn = chessRef.current.turn() === 'w' ? 'white' : 'black';
  const inCheck = chessRef.current.inCheck();
  const isCheckmate = chessRef.current.isCheckmate();
  const isStalemate = chessRef.current.isStalemate();
  const isDraw = chessRef.current.isDraw();
  const isGameOverEngine = chessRef.current.isGameOver();
  const isGameOver = isGameOverEngine || Boolean(timeoutWinner);

  // Determine game outcome from user perspective
  const gameResult = useMemo(() => {
    if (!isGameOver) return null;

    if (timeoutWinner) {
      return timeoutWinner === userColor ? 'win' : 'loss';
    }

    if (isCheckmate) {
      const matedSide = chessRef.current.turn() === 'w' ? 'white' : 'black';
      return matedSide === userColor ? 'loss' : 'win';
    }

    if (isDraw) return 'draw';
    return null;
  }, [isGameOver, timeoutWinner, isCheckmate, isDraw, userColor]);

  // Expose PGN and full game metadata on game completion
  const completedGameData = useMemo(() => {
    if (!isGameOver || !gameResult) return null;
    return {
      pgn: chessRef.current.pgn(),
      result: gameResult,
      botLevel: DIFFICULTY_DEPTHS[difficulty] || 2,
      userColor,
      moveCount: moveHistory.length,
    };
  }, [isGameOver, gameResult, difficulty, userColor, moveHistory.length, fen]);

  // Formatted status state
  const gameStatus = useMemo(() => {
    if (timeoutWinner) {
      const winnerName = timeoutWinner === 'white' ? 'White' : 'Black';
      return {
        type: 'timeout',
        text: `${winnerName} won on time!`,
        isTerminal: true,
      };
    }
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
  }, [fen, timeoutWinner, isCheckmate, isStalemate, isDraw, inCheck, currentTurn, isBotThinking]);

  // Pair moves into turns
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

  // Handle Mute Toggle
  const handleToggleMute = useCallback(() => {
    const next = toggleMute();
    setIsMuted(next);
  }, []);

  // Clock countdown ticker
  useEffect(() => {
    if (timeControl === 'none' || moveHistory.length === 0 || isGameOver) {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      return;
    }

    clockIntervalRef.current = setInterval(() => {
      if (currentTurn === 'white') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            setTimeoutWinner('black');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            setTimeoutWinner('white');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
  }, [timeControl, moveHistory.length, isGameOver, currentTurn]);

  // Play audio when timeout occurs
  useEffect(() => {
    if (timeoutWinner) {
      if (timeoutWinner === userColor) {
        playVictorySound();
      } else {
        playDefeatSound();
      }
    }
  }, [timeoutWinner, userColor]);

  // Execute a move via chess.js with sound effects and event emission
  const makeMove = useCallback(
    (moveInput) => {
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

          // Audio Sound Effects
          const isCastle = move.san === 'O-O' || move.san === 'O-O-O';
          const isCapture = Boolean(move.captured);

          if (isCastle) {
            playCastleSound();
          } else if (isCapture) {
            playCaptureSound();
          } else {
            playMoveSound();
          }

          if (game.inCheck()) {
            setTimeout(playCheckSound, 120);
          }

          // Terminal sounds
          if (game.isGameOver()) {
            setTimeout(() => {
              if (game.isCheckmate()) {
                const matedTurn = game.turn() === 'w' ? 'white' : 'black';
                if (matedTurn === userColor) {
                  playDefeatSound();
                } else {
                  playVictorySound();
                }
              } else if (game.isDraw()) {
                playDrawSound();
              }
            }, 250);
          }

          // Event bus emission
          const isUserMove = move.color === (userColor === 'white' ? 'w' : 'b');

          if (move.captured) {
            gameEventBus.emit({
              type: isUserMove ? 'userCapture' : 'botCapture',
              capturedPiece: move.captured,
              san: move.san,
            });
          }

          if (game.isGameOver()) {
            let result = 'draw';
            if (game.isCheckmate()) {
              const matedTurn = game.turn() === 'w' ? 'white' : 'black';
              result = matedTurn === userColor ? 'loss' : 'win';
            }
            gameEventBus.emit({
              type: 'gameOver',
              result,
            });
          } else if (game.inCheck()) {
            const checkedTurn = game.turn() === 'w' ? 'white' : 'black';
            if (checkedTurn === userColor) {
              gameEventBus.emit({
                type: 'userCheck',
              });
            }
          }

          return true;
        }
      } catch {
        return false;
      }
      return false;
    },
    [userColor]
  );

  // Web Worker initialization
  useEffect(() => {
    const worker = new Worker(
      new URL('../engine/bot.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { success, bestMove, requestId } = event.data;

      // Ignore outdated replies
      if (requestId !== requestIdRef.current) return;

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
  const handleSquareClick = useCallback(
    (square) => {
      if (isGameOver || isBotThinking || currentTurn !== userColor) {
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
    },
    [selectedSquare, legalMoves, makeMove, isBotThinking, currentTurn, userColor, isGameOver]
  );

  // Reset game state
  const resetGame = useCallback(
    (overrideUserColor = null, overrideTimeControl = null) => {
      requestIdRef.current++;
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
        botTimeoutRef.current = null;
      }
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current);
      }
      setIsBotThinking(false);
      setTimeoutWinner(null);

      chessRef.current = new Chess();
      setFen(chessRef.current.fen());
      setMoveHistory([]);
      setLastMove(null);
      setSelectedSquare(null);

      const activeUserColor = overrideUserColor !== null ? overrideUserColor : userColor;
      setBoardOrientation(activeUserColor);

      const activeTimeControl = overrideTimeControl !== null ? overrideTimeControl : timeControl;
      const initialSeconds = TIME_CONTROLS[activeTimeControl] || 0;
      setWhiteTime(initialSeconds);
      setBlackTime(initialSeconds);

      gameEventBus.emit({ type: 'reset' });
    },
    [userColor, timeControl]
  );

  // Change Time Control
  const handleSetTimeControl = useCallback(
    (newControl) => {
      setTimeControl(newControl);
      resetGame(null, newControl);
    },
    [resetGame]
  );

  // Flip board
  const flipBoard = useCallback(() => {
    setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  // Change side
  const togglePlaySide = useCallback(
    (newSide) => {
      if (newSide === userColor) return;
      setUserColor(newSide);
      resetGame(newSide);
    },
    [userColor, resetGame]
  );

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
    gameResult,
    completedGameData,
    pgn: chessRef.current.pgn(),
    gameStatus,
    moveHistory,
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
    setTimeControl: handleSetTimeControl,
    togglePlaySide,
    toggleMute: handleToggleMute,
  };
}
