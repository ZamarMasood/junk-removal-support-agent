# Junk Removal Support Agent

AI-powered customer support agent for **ClearAway**, a UK-based junk removal business. Uses Claude (with tool use) to handle customer queries, RAG for FAQ retrieval, and Supabase for data persistence and conversation logging.

## Tech Stack

- **Frontend:** React + Vite (port 5173)
- **Backend:** Node.js + Express (port 3001)
- **AI:** Anthropic Claude API (`claude-sonnet-4-5-20250929`) with tool use
- **Embeddings:** Voyage AI `voyage-3-lite` (512-dim vectors)
- **Database:** Supabase (PostgreSQL) — orders, FAQ vectors (pgvector), conversation logs

## Project Structure

```
junk-removal-support-agent/
├── frontend/                  React chat UI (Vite dev server on :5173)
│   ├── index.html             HTML entry point
│   ├── vite.config.js         Vite configuration
│   ├── eslint.config.js       ESLint flat config
│   ├── public/
│   │   ├── favicon.svg        Browser tab icon
│   │   └── icons.svg          SVG icon assets
│   └── src/
│       ├── main.jsx           React root entry point
│       ├── App.jsx            Single chat UI component
│       ├── App.css            All chat UI styles + animations
│       └── index.css          Minimal reset
├── backend/                   Express API server on :3001
│   ├── src/
│   │   ├── server.js          Express app, POST /chat route, session store, tool loop
│   │   ├── rag.js             RAG pipeline (embed, Supabase vector search)
│   │   ├── tools.js           Anthropic tool definitions + runTool()
│   │   ├── supabaseClient.js  Shared Supabase client instance
│   │   ├── systemPrompt.js    System prompt for the agent
│   │   ├── seed.js            Re-embed and upsert FAQs into Supabase
│   │   └── rag.test.js        Plain Node test script for RAG
│   ├── supabase/
│   │   └── migration.sql      SQL: tables, indexes, RLS policies, match_faqs function
│   └── data/
│       ├── orders.json        Seed data for orders
│       └── faqs.json          FAQ knowledge base (source of truth for embeddings)
├── .env.example               Environment variable template
├── .mcp.json                  MCP server config (Supabase)
├── CLAUDE.md                  Project context for Claude Code
└── .claude/
    └── skills/                Claude Code skill definitions
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
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

### 2. Database (Supabase)

Run the migration in your Supabase SQL editor to create the required tables:

```bash
# File: backend/supabase/migration.sql
# Creates: faq_embeddings, orders, conversations tables
# Enables: pgvector extension, HNSW index, RLS policies, match_faqs function
```

Seed the orders table with the data from `backend/data/orders.json`.

### 3. Backend

```bash
cd backend
npm install
npm start
```

The server runs on `http://localhost:3001`. On first startup, if the `faq_embeddings` table is empty, it will automatically embed all FAQs from `faqs.json` using Voyage AI (this takes a few minutes due to rate limiting).

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`.

## How It Works

1. User sends a message via the chat UI
2. Backend stores the message in the session and calls Claude with tool definitions
3. Claude decides which tool to call:
   - **lookup_order** — queries Supabase orders table by phone number
   - **search_knowledge_base** — semantic search over FAQ embeddings via pgvector
4. Tool results are appended to the conversation and Claude is called again
5. This loops until Claude produces a final response (`stop_reason === "end_turn"`)
6. If Claude escalates, the `[ESCALATE: reason]` tag is parsed and stripped from the reply
7. The turn is logged to the Supabase `conversations` table
8. The clean reply (with escalation metadata) is returned to the frontend

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

# Build frontend for production
cd frontend && npm run build

# Lint frontend
cd frontend && npm run lint

# Test RAG pipeline in isolation
cd backend && node src/rag.test.js

# Force re-embed FAQs (run after updating faqs.json)
cd backend && npm run seed
```

## Development

Run both servers simultaneously in separate terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```
