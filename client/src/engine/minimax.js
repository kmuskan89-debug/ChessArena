import { Chess } from 'chess.js';
import { evaluate, PIECE_VALUES } from './evaluate.js';

// Base score for checkmate. Subtracting ply incentivizes delivering checkmate quickly.
const CHECKMATE_SCORE = 100000;

/**
 * Assigns a sorting score to each move for move ordering.
 * Searching promising moves (especially captures and promotions) first maximizes
 * the likelihood of alpha-beta cutoffs, pruning large subtrees.
 */
function scoreMove(move) {
  let moveScore = 0;

  // 1. Prioritize Captures: MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
  if (move.captured) {
    const victimValue = PIECE_VALUES[move.captured] || 100;
    const attackerValue = PIECE_VALUES[move.piece] || 100;
    moveScore += 10000 + (victimValue * 10 - attackerValue);
  }

  // 2. Prioritize Pawn Promotion
  if (move.promotion) {
    moveScore += 9000;
  }

  // 3. Small bonus for giving check
  if (move.san?.includes('+')) {
    moveScore += 500;
  }

  return moveScore;
}

/**
 * Sorts moves in descending order of their heuristic priority score.
 */
function orderMoves(moves) {
  return moves.slice().sort((a, b) => scoreMove(b) - scoreMove(a));
}

/**
 * Recursive Minimax algorithm with Alpha-Beta Pruning.
 *
 * @param {Chess} game - The current chess.js board state
 * @param {number} depth - Remaining search depth
 * @param {number} alpha - Best score guaranteed for the maximizing player (White)
 * @param {number} beta - Best score guaranteed for the minimizing player (Black)
 * @param {number} ply - Distance from the root node (used to prefer faster checkmates)
 * @returns {number} Evaluated score
 */
export function minimax(game, depth, alpha, beta, ply = 0) {
  // Terminal Condition 1: Checkmate
  if (game.isCheckmate()) {
    // If it's White's turn, White is checkmated (loss for White, score negative)
    // If it's Black's turn, Black is checkmated (win for White, score positive)
    return game.turn() === 'w'
      ? -CHECKMATE_SCORE + ply
      : CHECKMATE_SCORE - ply;
  }

  // Terminal Condition 2: Draw (Stalemate, 50-move rule, threefold repetition, insufficient material)
  if (game.isDraw()) {
    return 0;
  }

  // Base Condition: Leaf node reached at desired depth
  if (depth <= 0) {
    return evaluate(game);
  }

  const isMaximizing = game.turn() === 'w';
  const moves = game.moves({ verbose: true });
  const sortedMoves = orderMoves(moves);

  if (isMaximizing) {
    // White's turn: maximize the evaluation score
    let maxEval = -Infinity;

    for (const move of sortedMoves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, ply + 1);
      game.undo();

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);

      // Beta cutoff: Black had a previous option that guarantees a better score for Black,
      // so Black will never allow the game to reach this branch.
      if (beta <= alpha) {
        break;
      }
    }

    return maxEval;
  } else {
    // Black's turn: minimize the evaluation score
    let minEval = Infinity;

    for (const move of sortedMoves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, ply + 1);
      game.undo();

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);

      // Alpha cutoff: White had a previous option that guarantees a higher score for White,
      // so White will never allow Black into this branch.
      if (beta <= alpha) {
        break;
      }
    }

    return minEval;
  }
}

/**
 * Searches the game tree using minimax and alpha-beta pruning to find the optimal move.
 *
 * @param {string} fen - Current board FEN string
 * @param {number} depth - Search depth (e.g. 1, 2, 3)
 * @returns {object|null} The best move object (from, to, promotion, san) or null if no legal moves
 */
export function getBestMove(fen, depth = 2) {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });

  if (moves.length === 0) {
    return null;
  }

  // Order moves at the root for immediate alpha/beta narrowing
  const sortedMoves = orderMoves(moves);
  const isMaximizing = game.turn() === 'w';

  let bestMove = sortedMoves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of sortedMoves) {
    game.move(move);
    const score = minimax(game, depth - 1, alpha, beta, 1);
    game.undo();

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
    }
  }

  return bestMove;
}

