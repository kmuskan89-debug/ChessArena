# Chess Arena

A chess website where you play against a bot I wrote myself, using minimax
with alpha-beta pruning. Built with the MERN stack as a learning project.

**Live:** [your-vercel-link]  
(The backend is on Render's free tier, so the first request after a quiet
period can take about a minute.)


## What it does

- Play chess against a bot with three difficulty levels
- Chess clocks (3, 5 or 10 minutes, or untimed) and sound effects
- A chat panel where the bot answers questions using keyword matching
  (no AI or external API) and comments on the game
- Register and log in; finished games are saved and can be replayed move by move
- Elo rating and a public top-10 leaderboard

## How the bot works

The bot is in `client/src/engine/`. It uses minimax with alpha-beta pruning,
searching 1 to 3 moves ahead depending on difficulty. Positions are scored by
material plus piece-square tables, and captures are searched first so more
branches get pruned. It runs in a Web Worker so the UI doesn't freeze while it thinks.

## Tech stack

React (Vite), React Router, chess.js, react-chessboard, Axios ·
Node, Express, MongoDB (Mongoose), JWT, bcryptjs, helmet, express-rate-limit ·
Vercel (client), Render (server), MongoDB Atlas

## Decisions worth mentioning

- **Ratings are calculated on the server**, never trusted from the client.
  The server also loads each submitted PGN with chess.js and checks the
  claimed result against it.
- **Known limitation:** the server can't tell whether the bot really played
  the submitted moves, and timeouts can't be verified from a PGN. A
  server-side game loop would fix this.
- Passwords are hashed, JWTs expire after 7 days, and login/register are rate limited.

## Run it locally

```bash
git clone https://github.com/kmuskan89-debug/ChessArena
cd chess-arena

# server
cd server && npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, CLIENT_URL
npm run dev

# client (new terminal)
cd client && npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5001/api
npm run dev
```

## What I'd do next

- Online multiplayer with Socket.io
- Move the bot to the server so games are fully verifiable
- Tests for the Elo and PGN validation code