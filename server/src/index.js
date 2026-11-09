import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Fail immediately at startup with a clear error message if MONGO_URI or JWT_SECRET is missing
if (!process.env.MONGO_URI) {
  console.error('FATAL STARTUP ERROR: "MONGO_URI" environment variable is missing.');
  console.error('Please configure MONGO_URI in your server/.env file.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL STARTUP ERROR: "JWT_SECRET" environment variable is missing.');
  console.error('Please configure JWT_SECRET in your server/.env file.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy (e.g., Render, Railway, Heroku) for rate limiting and IP resolution
app.set('trust proxy', 1);

// Configure CORS allowed origins: CLIENT_URL (comma-separated list supported) + dev fallback
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, '')).filter(Boolean)
  : [];

const allowedOrigins = Array.from(
  new Set(['http://localhost:5173', ...configuredOrigins])
);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., curl, Postman, server-to-server health checks)
    if (!origin) {
      return callback(null, true);
    }
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: Origin ${origin} is not allowed`));
  },
  credentials: true,
};

// Global Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Root & Health Check Routes
app.get('/', (req, res) => {
  res.json({ message: 'Chess Arena API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// 404 Catch-All Handler for unknown routes
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please configure a different PORT in your .env file.`);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer();
