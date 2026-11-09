import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * Reads 'Authorization: Bearer <token>', verifies it against JWT_SECRET,
 * and attaches the authenticated user document to req.user.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token missing from authorization header.',
      });
    }

    // Verify token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (excluding passwordHash)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token signature.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      error: error.message,
    });
  }
};

