/**
 * Lightweight Pub/Sub event bus for decoupling game logic from UI listeners.
 * Emits game occurrences (captures, checks, game over, reset) from useChessGame
 * and delivers them to the TalkWithMe chat commentary panel.
 */
class GameEventBus {
  constructor() {
    this.listeners = new Set();
  }

  /**
   * Subscribes a listener callback to game events.
   * @param {Function} callback - Function invoked with event payload
   * @returns {Function} Cleanup function to unsubscribe
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Dispatches a game event to all active listeners.
   * @param {object} event - E.g. { type: 'userCapture' | 'botCapture' | 'userCheck' | 'gameOver' | 'reset', ... }
   */
  emit(event) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in game event listener:', err);
      }
    });
  }
}

export const gameEventBus = new GameEventBus();

