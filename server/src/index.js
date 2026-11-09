import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Chess Arena API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const startServer = async () => {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB successfully');
    } catch (err) {
      console.warn('MongoDB connection failed. Continuing without database:', err.message);
    }
  } else {
    console.log('No MONGO_URI specified in environment variables.');
  }

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
