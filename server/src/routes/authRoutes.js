import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Protected routes
router.get('/me', authMiddleware, getMe);

export default router;

