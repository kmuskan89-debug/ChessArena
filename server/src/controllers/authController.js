import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper function to sign JWT tokens valid for 7 days
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Email validation regex helper
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }

    const trimmedUsername = username.trim();
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Validate username length (3-20 characters)
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters',
      });
    }

    // 3. Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // 4. Validate password length (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // 5. Reject duplicate email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // 6. Reject duplicate username
    const existingUsername = await User.findOne({ username: trimmedUsername });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken',
      });
    }

    // 7. Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 8. Create user
    const newUser = await User.create({
      username: trimmedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    // 9. Generate JWT token
    const token = generateToken(newUser._id);

    // 10. Return user (passwordHash is automatically excluded by toJSON) and JWT
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Use the exact same generic error for wrong email or wrong password
    const genericAuthError = {
      success: false,
      message: 'Invalid email or password',
    };

    if (!user) {
      return res.status(401).json(genericAuthError);
    }

    // Compare candidate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json(genericAuthError);
    }

    // Generate JWT token (expires in 7 days)
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

