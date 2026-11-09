/**
 * Chess Position Evaluation Module
 *
 * Evaluates the board state from White's perspective:
 * - Positive score means White has an advantage.
 * - Negative score means Black has an advantage.
 * - Zero indicates equal balance or a draw.
 *
 * Scoring Formula:
 *   Total Score = (White Material - Black Material) + (White Positional Score - Black Positional Score)
 */

// Piece material values measured in centipawns (1 pawn = 100 centipawns)
export const PIECE_VALUES = {
  p: 100,    // Pawn
  n: 320,    // Knight
  b: 330,    // Bishop
  r: 500,    // Rook
  q: 900,    // Queen
  k: 20000,  // King (assigned an arbitrarily high value to prioritize king safety)
};

/**
 * Piece-Square Tables (PST) define positional bonuses and penalties.
 * Tables are defined from White's perspective where:
 *   - row 0 = rank 8 (enemy back rank for White)
 *   - row 7 = rank 1 (White's home rank)
 *
 * For Black, row indices are mirrored (7 - row) so that Black receives
 * identical positional incentives in reverse direction.
 */

// Pawn: Encourage central advancement and rewarding passed pawns near promotion
const PAWN_TABLE = [
  [  0,   0,   0,   0,   0,   0,   0,   0], // Rank 8 (promoted)
  [ 50,  50,  50,  50,  50,  50,  50,  50], // Rank 7 (advanced, dangerous)
  [ 10,  10,  20,  30,  30,  20,  10,  10], // Rank 6
  [  5,   5,  10,  25,  25,  10,   5,   5], // Rank 5 (center control)
  [  0,   0,   0,  20,  20,   0,   0,   0], // Rank 4
  [  5,  -5, -10,   0,   0, -10,  -5,   5], // Rank 3
  [  5,  10,  10, -20, -20,  10,  10,   5], // Rank 2 (initial rank)
  [  0,   0,   0,   0,   0,   0,   0,   0], // Rank 1
];

// Knight: Knights thrive in the center and are ineffective on the rim / edges
const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50], // Rank 8
  [-40, -20,   0,   5,   5,   0, -20, -40],
  [-30,   5,  10,  15,  15,  10,   5, -30],
  [-30,   0,  15,  20,  20,  15,   0, -30], // Central outposts
  [-30,   5,  15,  20,  20,  15,   5, -30], // Central outposts
  [-30,   0,  10,  15,  15,  10,   0, -30],
  [-40, -20,   0,   0,   0,   0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50], // Rank 1
];

// Bishop: Reward active diagonal development and central visibility; penalize corners
const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10,   5,   0,   0,   0,   0,   5, -10],
  [-10,  10,  10,  10,  10,  10,  10, -10],
  [-10,   0,  10,  10,  10,  10,   0, -10],
  [-10,   5,   5,  10,  10,   5,   5, -10],
  [-10,   0,   5,  10,  10,   5,   0, -10],
  [-10,   5,   0,   0,   0,   0,   5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

// Rook: Highly effective on the 7th rank and central / open files
const ROOK_TABLE = [
  [  0,   0,   0,   5,   5,   0,   0,   0],
  [  5,  10,  10,  10,  10,  10,  10,   5], // Rank 7 invasion bonus
  [ -5,   0,   0,   0,   0,   0,   0,  -5],
  [ -5,   0,   0,   0,   0,   0,   0,  -5],
  [ -5,   0,   0,   0,   0,   0,   0,  -5],
  [ -5,   0,   0,   0,   0,   0,   0,  -5],
  [ -5,   0,   0,   0,   0,   0,   0,  -5],
  [  0,   0,   0,   5,   5,   0,   0,   0],
];

// Queen: Keep queen centralized yet cautious, discouraging premature exposure
const QUEEN_TABLE = [
  [-20, -10, -10,  -5,  -5, -10, -10, -20],
  [-10,   0,   5,   0,   0,   0,   0, -10],
  [-10,   5,   5,   5,   5,   5,   0, -10],
  [  0,   0,   5,   5,   5,   5,   0,  -5],
  [ -5,   0,   5,   5,   5,   5,   0,  -5],
  [-10,   0,   5,   5,   5,   5,   0, -10],
  [-10,   0,   0,   0,   0,   0,   0, -10],
  [-20, -10, -10,  -5,  -5, -10, -10, -20],
];

// King (Middlegame): Encourage castled king safety behind pawns (g1, c1); penalize center wandering
const KING_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [ 20,  20,   0,   0,   0,   0,  20,  20], // Pawn shield rank
  [ 20,  30,  10,   0,   0,  10,  30,  20], // Castled positions (c1, g1)
];

const PST_MAP = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE,
};

/**
 * Evaluates the given chess position.
 *
 * @param {import('chess.js').Chess} chess - An active chess.js instance
 * @returns {number} Score from White's perspective in centipawns
 */
export function evaluate(chess) {
  const board = chess.board();
  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whitePositional = 0;
  let blackPositional = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const baseValue = PIECE_VALUES[piece.type] || 0;
      const table = PST_MAP[piece.type];

      if (piece.color === 'w') {
        // White evaluates from row 0 (rank 8) to row 7 (rank 1) directly
        const posValue = table ? table[row][col] : 0;
        whiteMaterial += baseValue;
        whitePositional += posValue;
      } else {
        // Black's board is mirrored vertically: row 0 for Black corresponds to row 7 for White
        const posValue = table ? table[7 - row][col] : 0;
        blackMaterial += baseValue;
        blackPositional += posValue;
      }
    }
  }

  // Final evaluation: White advantage (+), Black advantage (-)
  return (whiteMaterial + whitePositional) - (blackMaterial + blackPositional);
}

