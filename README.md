# Chess Arena

A MERN stack project for Chess Arena.

## Project Structure

```text
chess-arena/
├── client/          # Frontend React application (Vite + React Router)
├── server/          # Backend Node.js + Express application (ES modules + Mongoose)
├── .gitignore       # Git ignore rules for root, client, and server
└── README.md        # Project setup and running instructions
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas)

---

## Getting Started

### 1. Server Setup

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

4. Update the variables in `.env` as needed:
   - `PORT`: Server port (default: `5001`)
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT authentication

5. Start the server:
   - For development (with auto-reload):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

   The server will start at `http://localhost:5001`.

---

### 2. Client Setup

1. Open a separate terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The client will start at `http://localhost:5173`.
