import User from '../models/User.js';

/**
 * @desc    Get top 10 players by rating with total games played
 * @route   GET /api/leaderboard
 * @access  Public
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await User.aggregate([
      // 1. Sort users by rating descending (uses rating index)
      { $sort: { rating: -1, createdAt: 1 } },
      // 2. Limit to top 10
      { $limit: 10 },
      // 3. Lookup games played by this user
      {
        $lookup: {
          from: 'games',
          localField: '_id',
          foreignField: 'userId',
          as: 'games',
        },
      },
      // 4. Project only safe public fields (NEVER emails or password hashes)
      {
        $project: {
          _id: 1,
          username: 1,
          rating: 1,
          gamesPlayed: { $size: '$games' },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

