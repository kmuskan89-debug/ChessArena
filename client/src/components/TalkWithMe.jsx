import { useState, useEffect, useRef } from 'react';
import { getBotReply, getRandomReply } from '../utils/getBotReply.js';
import { gameEventBus } from '../utils/gameEvents.js';
import botRepliesData from '../data/botReplies.json';

export default function TalkWithMe() {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      text: "Hello. I am your chess assistant. Ask me for opening tips, tech details, or make a move on the board to begin.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const lastBotReplyRef = useRef(null);
  const lastCommentaryRef = useRef({});
  const movesSinceLastCommentRef = useRef(2);
  const typingTimerRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle game commentary events
  useEffect(() => {
    const unsubscribe = gameEventBus.subscribe((event) => {
      if (event.type === 'reset') {
        movesSinceLastCommentRef.current = 2;
        lastCommentaryRef.current = {};
        return;
      }

      const isUrgent = event.type === 'userCheck' || event.type === 'gameOver';
      movesSinceLastCommentRef.current++;

      if (!isUrgent && movesSinceLastCommentRef.current < 2) {
        return;
      }

      let commentCategory = null;
      if (event.type === 'userCapture') commentCategory = 'userCapture';
      else if (event.type === 'botCapture') commentCategory = 'botCapture';
      else if (event.type === 'userCheck') commentCategory = 'userCheck';
      else if (event.type === 'gameOver') {
        if (event.result === 'win') commentCategory = 'gameOverWin';
        else if (event.result === 'loss') commentCategory = 'gameOverLoss';
        else commentCategory = 'gameOverDraw';
      }

      if (!commentCategory || !botRepliesData.commentary[commentCategory]) {
        return;
      }

      const candidateList = botRepliesData.commentary[commentCategory];
      const prevComment = lastCommentaryRef.current[commentCategory] || null;
      const commentaryText = getRandomReply(candidateList, prevComment);
      lastCommentaryRef.current[commentCategory] = commentaryText;
      movesSinceLastCommentRef.current = 0;

      setIsTyping(true);
      const delay = Math.floor(Math.random() * 300) + 600;

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-comment-${Date.now()}-${Math.random()}`,
            sender: 'bot',
            text: commentaryText,
            isCommentary: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, delay);
    });

    return () => {
      unsubscribe();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    const botReplyText = getBotReply(trimmed, lastBotReplyRef.current);
    lastBotReplyRef.current = botReplyText;

    setIsTyping(true);
    const delay = Math.floor(Math.random() * 300) + 600;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReplyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, delay);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="panel talk-with-me-panel">
      {/* Header */}
      <div className="panel-header">
        <h3 className="panel-title">Chat</h3>
        <span className="badge-subtle">Assistant</span>
      </div>

      {/* Message List */}
      <div className="chat-messages-scrollable">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`chat-message-row ${isBot ? 'bot-message-row' : 'user-message-row'}`}
            >
              <div
                className={`chat-bubble ${isBot ? 'bot-bubble' : 'user-bubble'} ${
                  msg.isCommentary ? 'commentary-bubble' : ''
                }`}
              >
                <div className="bubble-meta">
                  <span className="bubble-author">{isBot ? 'Bot' : 'You'}</span>
                  <span className="bubble-time">{msg.time}</span>
                </div>
                <p className="bubble-text">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {/* Animated Dots Typing Indicator */}
        {isTyping && (
          <div className="chat-message-row bot-message-row">
            <div className="chat-bubble bot-bubble typing-bubble">
              <span className="bubble-author">Bot</span>
              <div className="typing-dots-container">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box & Send Button */}
      <form className="chat-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for tips or chat..."
          aria-label="Message chat assistant"
          disabled={isTyping}
        />
        <button
          type="submit"
          className="btn btn-primary chat-send-btn"
          disabled={!inputText.trim() || isTyping}
        >
          Send
        </button>
      </form>
    </div>
  );
}
