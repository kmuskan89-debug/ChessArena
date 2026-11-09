/**
 * Elo Rating System Calculation Utilities
 */

// Fixed ratings for bot difficulty levels
export const BOT_RATINGS = {
  1: 800,
  2: 1200,
  3: 1600,
};

/**
 * Calculates the expected score for a player facing an opponent.
 * Formula: E = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400))
 *
 * @param {number} playerRating - Current rating of player
 * @param {number} opponentRating - Rating of opponent
 * @returns {number} Expected score between 0 and 1
 */
export function expectedScore(playerRating, opponentRating) {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

/**
 * Calculates the updated rating after a match.
 * Formula: R_new = R_old + K * (Score - Expected)
 *
 * @param {number} playerRating - Current rating of player
 * @param {number} opponentRating - Rating of opponent
 * @param {number} score - 1 for a win, 0.5 for a draw, 0 for a loss
 * @param {number} k - K-factor weight (default 32)
 * @returns {number} Rounded new rating
 */
export function calculateNewRating(playerRating, opponentRating, score, k = 32) {
  const expected = expectedScore(playerRating, opponentRating);
  const newRating = playerRating + k * (score - expected);
  return Math.round(newRating);
}

/**
 * Converts result string to numeric score.
 *
 * @param {string} result - "win" | "draw" | "loss"
 * @returns {number} 1, 0.5, or 0
 */
export function getScoreFromResult(result) {
  if (result === 'win') return 1;
  if (result === 'draw') return 0.5;
  return 0; // 'loss'
}

/**
 * Returns fixed bot rating given bot level (1, 2, or 3).
 *
 * @param {number} level
 * @returns {number} 800, 1200, or 1600
 */
export function getBotRating(level) {
  return BOT_RATINGS[level] || 1200;
}

