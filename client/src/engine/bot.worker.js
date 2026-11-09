import { getBestMove } from './minimax.js';

/**
 * Web Worker for the Chess Minimax Engine.
 * Runs compute-intensive minimax tree searches on a separate thread
 * to keep the UI completely responsive at 60 FPS.
 */
self.onmessage = (event) => {
  const { fen, depth = 2, requestId } = event.data;

  try {
    const bestMove = getBestMove(fen, depth);
    self.postMessage({
      success: true,
      bestMove,
      requestId,
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message,
      requestId,
    });
  }
};

