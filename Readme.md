## What You Will Build

A web-based chat interface where a customer types their query and an AI agent responds intelligently.

The agent must:

1. **Identify where the customer is in their journey:** pre-collection (booking made, collection not happened yet), day-of-collection, or post-collection (job already done)
2. **Answer common questions** from a knowledge base you will create
3. **Ask follow-up questions conditionally** based on what the customer says. For example, if waste is inside, ask what floor; if outside, ask front or back
4. **Escalate to a human** when it cannot resolve the query or the customer seems upset
5. **Log each conversation** to a file or database

---

## Tech Stack

- **Frontend:** React (simple UI, just a chat window)
- **Backend:** Node.js or Python (your choice)
- **AI:** Claude API (`claude-sonnet-4-5` model)
- **Knowledge Base / RAG:** Embeddings + cosine similarity (explained below)
- **Mock Data:** A JSON file simulating customer orders

---