# Junk Removal Support Agent

AI-powered customer support agent for a UK junk removal business. Uses Claude (with tool use) to handle customer queries, RAG for FAQ retrieval, and JSONL logging for conversation history.

## Tech Stack

- **Frontend:** React + Vite (port 5173)
- **Backend:** Node.js + Express (port 3001)
- **AI:** Anthropic Claude API (tool use), Voyage AI embeddings (voyage-3-lite) with vector caching
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
│   │   ├── faqs.json      FAQ knowledge base
│   │   └── vectors.json   Auto-generated vector cache (gitignored)
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
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com |
| `VOYAGE_API_KEY` | Your Voyage AI API key from dashboard.voyageai.com |
| `PORT` | Backend port (default: 3001) |

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

## RAG & Vector Caching

The backend uses Retrieval-Augmented Generation (RAG) to answer customer questions. FAQ documents are embedded using Voyage AI and matched to queries via cosine similarity.

> **Note:** FAQ vectors are cached to `backend/data/vectors.json`
> after the first run. Subsequent server restarts load from cache
> instantly (~2 seconds). To force a re-embed after updating FAQs,
> delete `backend/data/vectors.json` before restarting.

## Development

Run both servers simultaneously in separate terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```
