# Junk Removal Support Agent

AI-powered customer support agent for a UK junk removal business. Uses Claude (with tool use) to handle customer queries, RAG for FAQ retrieval, and JSONL logging for conversation history.

## Tech Stack

- **Frontend:** React + Vite (port 5173)
- **Backend:** Node.js + Express (port 3001)
- **AI:** Anthropic Claude API (tool use), Voyage AI embeddings (voyage-3-lite)
- **Logging:** JSONL append-only files

## Project Structure

```
junk-removal-support-agent/
├── frontend/              React chat UI (Vite dev server on :5173)
│   └── src/
│       └── App.jsx        Single chat UI component
├── backend/               Express API server on :3001
│   ├── src/
│   │   ├── server.js      Express app, POST /chat route, session store, tool loop
│   │   ├── rag.js         RAG pipeline (embed, store, search)
│   │   ├── tools.js       Anthropic tool definitions + runTool()
│   │   └── systemPrompt.js  System prompt for the agent
│   ├── data/
│   │   ├── orders.json    Mock customer orders
│   │   └── faqs.json      FAQ knowledge base
│   └── logs/
│       └── conversations.jsonl  Append-only conversation log
├── .env.example           Environment variable template
└── CLAUDE.md              Project context for Claude Code
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
| `VOYAGE_API_KEY` | Voyage AI API key for embeddings |
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
