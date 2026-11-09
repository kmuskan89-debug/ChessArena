export default function TalkWithMe() {
  return (
    <div className="panel talk-with-me-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-icon">💬</span>
          <h3 className="panel-title">Talk with me</h3>
        </div>
        <span className="badge-placeholder">AI Assistant</span>
      </div>

      <div className="talk-body-empty">
        <div className="talk-avatar-placeholder">🤖</div>
        <h4>Chess Coach & Companion</h4>
        <p>
          Ask about moves, tactics, opening theories, or chat during your game.
        </p>
        <div className="chat-placeholder-box">
          <span className="chat-placeholder-bubble">
            Ready to analyze your games and discuss strategy.
          </span>
        </div>
      </div>

      <div className="talk-input-placeholder">
        <input
          type="text"
          disabled
          placeholder="Message chess assistant... (coming soon)"
          aria-label="Talk with me input"
        />
        <button type="button" disabled aria-label="Send message">
          ➤
        </button>
      </div>
    </div>
  );
}

