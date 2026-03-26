# CLAUDE.md — Project Context

## Purpose

AI-powered customer support agent for a UK-based junk removal business called ClearAway. The agent handles inbound customer queries via a web chat interface. It uses Claude (Anthropic) with tool use to look up customer orders and search a FAQ knowledge base. It escalates to a human when it cannot resolve the query.

## Tech Stack

- **Frontend:** React + Vite (JavaScript, no TypeScript), plain CSS
- **Backend:** Node.js + Express
- **AI Model:** Anthropic Claude API (`claude-sonnet-4-5-20250929`) with tool use
- **Embeddings:** Voyage AI `voyage-3-lite` (`voyageai` npm package)
- **Database:** Supabase (PostgreSQL) — orders, conversations, and FAQ vectors (pgvector)
- **Supabase client:** `@supabase/supabase-js` with service role key

## Folder Structure
```
/
├── frontend/                  # React + Vite app (port 5173)
│   ├── index.html             # HTML entry point
│   ├── vite.config.js         # Vite configuration
│   ├── eslint.config.js       # ESLint flat config
│   ├── public/
│   │   ├── favicon.svg        # Browser tab icon
│   │   └── icons.svg          # SVG icon assets
│   └── src/
│       ├── main.jsx           # React root entry point
│       ├── App.jsx            # Single chat UI component
│       ├── App.css            # All chat UI styles + animations
│       └── index.css          # Minimal reset
├── backend/                   # Express API server (port 3001)
│   ├── src/
│   │   ├── server.js          # Express app, CORS, POST /chat, session Map, tool loop, escalation parsing
│   │   ├── rag.js             # RAG pipeline: embed FAQs, Supabase vector search
│   │   ├── tools.js           # Anthropic tool definitions + runTool() (queries orders from Supabase)
│   │   ├── supabaseClient.js  # Shared Supabase client instance
│   │   ├── systemPrompt.js    # Exported system prompt string
│   │   ├── seed.js            # Re-embed and upsert FAQs into Supabase
│   │   └── rag.test.js        # Plain Node test script for RAG
│   ├── supabase/
│   │   └── migration.sql      # SQL: all tables, indexes, RLS policies, match_faqs function
│   └── data/
│       ├── orders.json        # Seed data for orders (source of truth for initial load)
│       └── faqs.json          # FAQ knowledge base (source of truth for embeddings)
├── .env                       # Secret keys — gitignored
├── .env.example               # Template with empty values
├── .gitignore                 # Git ignore rules
├── .mcp.json                  # MCP server config (Supabase)
├── CLAUDE.md                  # This file
└── .claude/
    ├── settings.local.json    # Local Claude Code settings
    └── skills/
        ├── claude-api.md
        ├── rag.md
        ├── tool-definitions.md
        ├── conversation-logging.md
        └── frontend-design.md
```

## Key Rules

1. **Never hardcode API keys.** Always load from `.env` via `dotenv`. The `.env` file is gitignored.
2. **Session identity:** Each browser session gets a UUID (`sessionId`) generated on page load. The backend stores conversation history in an in-memory `Map` keyed by `sessionId` with a 1-hour TTL. Phone number is collected during the conversation and stored separately — it is NOT the session key.
3. **Maintain full conversation history per session.** Every message (user, assistant, and tool results) must be kept in the messages array for the session and passed to Claude on every API call.
4. **Tool use loop:** After calling Claude, check `stop_reason`. If `"tool_use"`, execute all tool_use blocks, append results as a user message, and call Claude again. Repeat until `stop_reason === "end_turn"`.
5. **Conversation logging:** Log once per completed turn to the Supabase `conversations` table — after the tool loop finishes and the final reply is ready. One row per turn. Never log during the loop.
6. **CORS:** Backend must allow requests from `http://localhost:5173`.
7. **Escalation tag:** When Claude needs to escalate, it appends `[ESCALATE: reason]` on a new line. The server parses this tag, sets `escalated: true`, strips the tag from the user-facing reply, and includes `escalationReason` in the response to the frontend.
8. **Model string:** Always `claude-sonnet-4-5-20250929`. Never change this.
9. **Vector store (Supabase):** FAQ vectors are stored in a Supabase pgvector table (`faq_embeddings`). On startup, `initRAG` checks if the table is populated; if empty, it embeds and inserts all FAQs automatically. To re-embed after updating `faqs.json`, run `cd backend && npm run seed`.
10. **Order lookup:** Uses server-side Supabase `.eq("phone", phone)` filtering — never fetch all orders.
11. **Request limits:** Body size limited to 10KB via `express.json({ limit: '10kb' })`. `X-Powered-By` header is disabled.

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
cd backend && npm run seed
```

## Environment Variables
```
ANTHROPIC_API_KEY=your_key_here
VOYAGE_API_KEY=your_key_here
PORT=3001
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```