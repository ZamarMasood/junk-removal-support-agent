const path = require("path");
const dotenv = require("dotenv");
const { VoyageAIClient } = require("voyageai");
const supabase = require("./supabaseClient");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let voyage;

async function embed(text) {
  const response = await voyage.embed({
    input: [text],
    model: "voyage-3-lite",
  });
  return response.data[0].embedding;
}

async function initRAG() {
  voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

  console.log("Initialising RAG pipeline...");

  // Check if FAQs are already in Supabase
  const { count, error: countError } = await supabase
    .from("faq_embeddings")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Supabase connection error:", countError.message);
    throw countError;
  }

  if (count > 0) {
    console.log(`RAG ready. ${count} FAQs loaded from Supabase.`);
    return;
  }

  // No data in Supabase — embed all FAQs and insert
  console.log("No FAQs found in Supabase. Embedding and inserting...");
  const faqs = require(path.join(__dirname, "..", "data", "faqs.json"));

  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i];
    const label =
      faq.question.length > 40
        ? faq.question.slice(0, 40) + "..."
        : faq.question;
    console.log(`[${i + 1}/${faqs.length}] Embedding: ${label}`);

    const vector = await embed(faq.question);

    const { error } = await supabase.from("faq_embeddings").insert({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      embedding: JSON.stringify(vector),
    });

    if (error) {
      console.error(`Error inserting ${faq.id}:`, error.message);
    }

    if (i < faqs.length - 1) {
      await new Promise((r) => setTimeout(r, 25000));
    }
  }

  console.log(
    `RAG ready. ${faqs.length} FAQs embedded and stored in Supabase.`
  );
}

async function searchFAQ(query) {
  const queryVector = await embed(query);

  const { data, error } = await supabase.rpc("match_faqs", {
    query_embedding: JSON.stringify(queryVector),
    match_threshold: 0.0,
    match_count: 1,
  });

  if (error) {
    console.error("Supabase search error:", error.message);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("No FAQ match found");
  }

  const best = data[0];
  return {
    id: best.id,
    question: best.question,
    answer: best.answer,
    similarity: best.similarity,
  };
}

module.exports = { initRAG, searchFAQ };
