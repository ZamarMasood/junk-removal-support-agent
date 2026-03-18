# CLAUDE.md — Project Context

## Purpose

AI-powered customer support agent for a UK-based junk removal business called ClearAway. The agent handles inbound customer queries via a web chat interface. It uses Claude (Anthropic) with tool use to look up customer orders and search a FAQ knowledge base. It escalates to a human when it cannot resolve the query.

## Tech Stack

- **Frontend:** React + Vite (JavaScript, no TypeScript), plain CSS
- **Backend:** Node.js + Express
- **AI Model:** Anthropic Claude API (`claude-sonnet-4-5-20250929`) with tool use
- **Embeddings:** Voyage AI `voyage-3-lite` (`voyageai` npm package) with vector caching to `backend/data/vectors.json`
- **Logging:** JSONL append-only file (`backend/logs/conversations.jsonl`)
- **Mock data:** JSON files (no real database)

## Folder Structure
```
/
├── frontend/                  # React + Vite app (port 5173)
│   └── src/
│       └── App.jsx            # Single chat UI component
├── backend/                   # Express API server (port 3001)
│   ├── src/
│   │   ├── server.js          # Express app, CORS, POST /chat route, session Map, tool loop
│   │   ├── rag.js             # RAG pipeline: embed FAQs, cosine search
│   │   ├── tools.js           # Anthropic tool definitions + runTool() function
│   │   ├── systemPrompt.js    # Exported system prompt string
│   │   └── rag.test.js        # Plain Node test script for RAG
│   ├── data/
│   │   ├── orders.json        # Mock customer orders
│   │   ├── faqs.json          # FAQ knowledge base
│   │   └── vectors.json       # Auto-generated vector cache (gitignored)
│   └── logs/
│       └── conversations.jsonl  # Append-only conversation log (created at runtime)
├── .env                       # Secret keys — gitignored
├── .env.example               # Template with empty values
├── CLAUDE.md                  # This file
└── .claude/
    └── skills/
        ├── claude-api.md
        ├── rag.md
        ├── tool-definitions.md
        ├── conversation-logging.md
        └── frontend-design.md
```

## Key Rules

1. **Never hardcode API keys.** Always load from `.env` via `dotenv`. The `.env` file is gitignored.
2. **Session identity:** Each browser session gets a UUID (`sessionId`) generated on page load. The backend stores conversation history in an in-memory `Map` keyed by `sessionId`. Phone number is collected during the conversation and stored separately — it is NOT the session key.
3. **Maintain full conversation history per session.** Every message (user, assistant, and tool results) must be kept in the messages array for the session and passed to Claude on every API call.
4. **Tool use loop:** After calling Claude, check `stop_reason`. If `"tool_use"`, execute all tool_use blocks, append results as a user message, and call Claude again. Repeat until `stop_reason === "end_turn"`.
5. **JSONL logging:** Log once per completed turn — after the tool loop finishes and the final reply is ready. One JSON line per turn. Never log during the loop.
6. **CORS:** Backend must allow requests from `http://localhost:5173`.
7. **Escalation tag:** When Claude needs to escalate, it appends `[ESCALATE: reason]` on a new line. The server parses this tag, sets `escalated: true`, and includes `escalationReason` in the response to the frontend.
8. **Model string:** Always `claude-sonnet-4-5-20250929`. Never change this.
9. **Vector cache:** FAQ vectors are persisted to `backend/data/vectors.json` after the first embed run. If `vectors.json` exists at startup, RAG loads from it instantly and skips all API calls. If you update `faqs.json`, delete `vectors.json` and restart the server to force a re-embed.

## Commands
```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Run backend (development — auto-restarts on file change)
cd backend && npm run dev

# Run backend (production)
cd backend && npm start

# Run frontend
cd frontend && npm run dev

# Test RAG pipeline in isolation
cd backend && node src/rag.test.js

# Force re-embed (run after updating faqs.json)
del backend\data\vectors.json    # Windows
rm backend/data/vectors.json     # Mac/Linux
cd backend && npm run dev        # Then restart server
```

## Environment Variables
```
ANTHROPIC_API_KEY=your_key_here
VOYAGE_API_KEY=your_key_here
PORT=3001
```