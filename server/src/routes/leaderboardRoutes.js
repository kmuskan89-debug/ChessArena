import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';

const router = express.Router();

// GET /api/leaderboard - Public route
router.get('/', getLeaderboard);

export default router;

