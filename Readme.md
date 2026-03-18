# Junk Removal Support Agent

AI-powered customer support agent for a UK junk removal business. Uses Claude (with tool use) to handle customer queries, RAG for FAQ retrieval, and JSONL logging for conversation history.

## Tech Stack

- **Frontend:** React + Vite (port 5173)
- **Backend:** Node.js + Express (port 3001)
- **AI:** Anthropic Claude API (tool use), OpenAI embeddings (text-embedding-3-small)
- **Logging:** JSONL append-only files

## Project Structure

```
junk-removal-support-agent/
├── frontend/          React chat UI (Vite dev server on :5173)
├── backend/           Express API server on :3001
│   ├── server.js      Express app entry point
│   ├── chat.js        Claude conversation handler
│   ├── rag.js         RAG pipeline (embed, store, search)
│   ├── tools.js       Anthropic tool definitions
│   └── logger.js      JSONL conversation logger
├── .env.example       Environment variable template
├── CLAUDE.md          Project context for Claude Code
└── .claude/skills/    Claude Code skill documentation
```

## Setup

### 1. Environment Variables

```bash
cp .env.example .env
```

Fill in your API keys:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `OPENAI_API_KEY` | OpenAI API key for embeddings |
| `PORT` | Backend server port (default: 3001) |

### 2. Backend

```bash
cd backend
npm install
npm start
```

The server runs on `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies API requests to the backend.

## Development

Run both servers simultaneously in separate terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```
