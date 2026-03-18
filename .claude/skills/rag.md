# Skill: RAG Pipeline (Retrieval-Augmented Generation)

## Overview

The RAG pipeline embeds FAQ documents using Voyage AI, stores vectors in memory, and retrieves the most relevant FAQ for a given customer query using cosine similarity.

## Embedding Model

Use Voyage AI `voyage-3-lite` for all embeddings:

```js
const { VoyageAIClient } = require("voyageai");
const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

async function embed(text) {
  const response = await voyage.embed({
    input: [text],
    model: "voyage-3-lite",
  });
  return response.embeddings[0];
}
```

API key: `VOYAGE_API_KEY` from `.env`
Free tier: 50 million tokens/month, no credit card required.

## Vector Storage

Store vectors in memory as an array of objects. No external vector database is needed for this project.

```js
// Each entry in the vector store
{
  id: "faq_001",
  text: "We collect sofas, mattresses, fridges, and general household waste.",
  embedding: [0.012, -0.034, ...], // float array
}
```

### Loading FAQs

At startup, read FAQ entries from a data source (e.g. a JSON file), embed each one, and store in the in-memory array.

```js
async function buildIndex(faqEntries) {
  const store = [];
  for (const entry of faqEntries) {
    const embedding = await embed(entry.text);
    store.push({ id: entry.id, text: entry.text, embedding });
  }
  return store;
}
```

## Cosine Similarity Search

Given a query, embed it and find the closest match in the vector store:

```js
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function search(query, store, topK = 1) {
  const queryEmbedding = await embed(query);
  const scored = store.map(entry => ({
    ...entry,
    score: cosineSimilarity(queryEmbedding, entry.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
```

## Key Points

- **Embed once at startup.** FAQ embeddings are computed once and kept in memory.
- **Return the top match.** The `search` function returns the highest-scoring FAQ entry.
- **No external database.** Vectors live in a plain JavaScript array. This is sufficient for a small FAQ set (< 1000 entries).
- **Never hardcode the API key.** Use `VOYAGE_API_KEY` from `.env`.
