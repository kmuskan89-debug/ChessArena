import express from 'express';
import {
  saveGame,
  getUserGames,
  getGameById,
  deleteGame,
} from '../controllers/gameController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All game endpoints require valid authentication
router.use(authMiddleware);

router.post('/', saveGame);
router.get('/', getUserGames);
router.get('/:id', getGameById);
router.delete('/:id', deleteGame);

export default router;

