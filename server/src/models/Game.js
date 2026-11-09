import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    pgn: {
      type: String,
      required: [true, 'PGN string is required'],
      trim: true,
    },
    result: {
      type: String,
      enum: {
        values: ['win', 'loss', 'draw'],
        message: 'Result must be win, loss, or draw',
      },
      required: [true, 'Game result is required'],
    },
    botLevel: {
      type: Number,
      enum: {
        values: [1, 2, 3],
        message: 'Bot level must be 1, 2, or 3',
      },
      required: [true, 'Bot level is required'],
    },
    userColor: {
      type: String,
      enum: {
        values: ['white', 'black'],
        message: 'User color must be white or black',
      },
      required: [true, 'User color is required'],
    },
    moveCount: {
      type: Number,
      default: 0,
    },
    ratingBefore: {
      type: Number,
      required: true,
    },
    ratingAfter: {
      type: Number,
      required: true,
    },
    ratingChange: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// Compound index for querying a user's games sorted by newest first
gameSchema.index({ userId: 1, createdAt: -1 });

const Game = mongoose.model('Game', gameSchema);
export default Game;

