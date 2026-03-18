const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { VoyageAIClient } = require("voyageai");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const VECTORS_CACHE = path.join(__dirname, "..", "data", "vectors.json");

let voyage;

const vectorStore = [];

async function embed(text) {
  const response = await voyage.embed({
    input: [text],
    model: "voyage-3-lite",
  });
  return response.data[0].embedding;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function initRAG() {
  voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  console.log("Initialising RAG pipeline...");

  // Check if cache exists
  if (fs.existsSync(VECTORS_CACHE)) {
    const cached = JSON.parse(fs.readFileSync(VECTORS_CACHE, "utf8"));
    cached.forEach((entry) => vectorStore.push(entry));
    console.log(`RAG ready. Loaded ${vectorStore.length} FAQs from cache.`);
    return;
  }

  // No cache — embed all FAQs
  const faqs = require(path.join(__dirname, "..", "data", "faqs.json"));

  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i];
    const label = faq.question.length > 40
      ? faq.question.slice(0, 40) + "..."
      : faq.question;
    console.log(`[${i + 1}/${faqs.length}] Embedding: ${label}`);

    const vector = await embed(faq.question);
    vectorStore.push({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      vector,
    });

    if (i < faqs.length - 1) {
      await new Promise((r) => setTimeout(r, 25000));
    }
  }

  // Save to cache
  fs.writeFileSync(VECTORS_CACHE, JSON.stringify(vectorStore, null, 2));
  console.log(`RAG ready. ${vectorStore.length} FAQs embedded and cached.`);
}

async function searchFAQ(query) {
  const queryVector = await embed(query);

  let best = null;
  let bestScore = -Infinity;

  for (const entry of vectorStore) {
    const score = cosineSimilarity(queryVector, entry.vector);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return {
    id: best.id,
    question: best.question,
    answer: best.answer,
    similarity: bestScore,
  };
}

module.exports = { initRAG, searchFAQ };
