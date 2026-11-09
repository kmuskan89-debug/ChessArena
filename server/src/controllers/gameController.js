import mongoose from 'mongoose';
import { Chess } from 'chess.js';
import Game from '../models/Game.js';
import User from '../models/User.js';
import {
  calculateNewRating,
  getBotRating,
  getScoreFromResult,
} from '../utils/elo.js';

/**
 * @desc    Save a completed chess game & calculate new Elo rating
 * @route   POST /api/games
 * @access  Private
 */
export const saveGame = async (req, res, next) => {
  try {
    const { pgn, result, botLevel, userColor, moveCount } = req.body;

    // 1. Validate required fields
    if (!pgn || !result || botLevel === undefined || !userColor) {
      return res.status(400).json({
        success: false,
        message: 'Missing required game fields: pgn, result, botLevel, and userColor are required.',
      });
    }

    if (!['win', 'loss', 'draw'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game result. Must be win, loss, or draw.',
      });
    }

    const numericBotLevel = Number(botLevel);
    if (![1, 2, 3].includes(numericBotLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bot level. Must be 1, 2, or 3.',
      });
    }

    if (!['white', 'black'].includes(userColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user color. Must be white or black.',
      });
    }

    // 2. Validate PGN using chess.js
    let calculatedMoveCount = 0;
    const chess = new Chess();
    try {
      chess.loadPgn(pgn);
      calculatedMoveCount = chess.history().length;
    } catch (pgnError) {
      return res.status(400).json({
        success: false,
        message: `Invalid PGN format: ${pgnError.message}`,
      });
    }

    // 3. Verify claimed result against rule-based terminal states
    if (chess.isCheckmate()) {
      const matedTurn = chess.turn() === 'w' ? 'white' : 'black';
      const actualResult = matedTurn === userColor ? 'loss' : 'win';
      if (result !== actualResult) {
        return res.status(400).json({
          success: false,
          message: `Claimed result "${result}" contradicts board checkmate state (actual: "${actualResult}").`,
        });
      }
    } else if (chess.isDraw()) {
      if (result !== 'draw') {
        return res.status(400).json({
          success: false,
          message: `Claimed result "${result}" contradicts board draw state (stalemate/repetition/insufficient material).`,
        });
      }
    } else {
      // NOTE: Timeouts (and voluntary resignations) occur while the board position
      // remains technically unfinished according to standard FIDE rules. Because PGN
      // notation does not encode external clock timers, timeout results cannot be
      // independently verified by board state alone and are accepted as claimed.
    }

    // 4. Fetch the user's current rating from the database (never from the client)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database',
      });
    }

    const ratingBefore = user.rating || 1200;
    const opponentRating = getBotRating(numericBotLevel);
    const score = getScoreFromResult(result);

    // 5. Calculate new Elo rating and difference
    const ratingAfter = calculateNewRating(ratingBefore, opponentRating, score);
    const ratingChange = ratingAfter - ratingBefore;

    // 6. Update user's rating in DB using $set
    await User.updateOne(
      { _id: user._id },
      { $set: { rating: ratingAfter } }
    );

    // 7. Save game document with rating snapshot
    const newGame = await Game.create({
      userId: user._id,
      pgn,
      result,
      botLevel: numericBotLevel,
      userColor,
      moveCount: calculatedMoveCount || Number(moveCount) || 0,
      ratingBefore,
      ratingAfter,
      ratingChange,
    });

    return res.status(201).json({
      success: true,
      message: 'Game saved successfully',
      game: newGame,
      newRating: ratingAfter,
      ratingChange,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated list of current user's games
 * @route   GET /api/games
 * @access  Private
 */
export const getUserGames = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    const [games, total] = await Promise.all([
      Game.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Game.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      games,
      total,
      page,
      totalPages,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single game by ID
 * @route   GET /api/games/:id
 * @access  Private
 */
export const getGameById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    const game = await Game.findById(id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    if (game.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this game',
      });
    }

    return res.status(200).json({
      success: true,
      game,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a game by ID
 * @route   DELETE /api/games/:id
 * @access  Private
 */
export const deleteGame = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    const game = await Game.findById(id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found',
      });
    }

    if (game.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to delete this game',
      });
    }

    await game.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Game deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};
