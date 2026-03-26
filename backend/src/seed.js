/**
 * Seed script — embeds all FAQs and inserts them into Supabase.
 * Run this after updating faqs.json to re-populate the vector store.
 *
 * Usage:  node src/seed.js
 */

const path = require("path");
const dotenv = require("dotenv");
const { VoyageAIClient } = require("voyageai");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const supabase = require("./supabaseClient");
const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

async function embed(text) {
  const response = await voyage.embed({
    input: [text],
    model: "voyage-3-lite",
  });
  return response.data[0].embedding;
}

async function seed() {
  const faqs = require(path.join(__dirname, "..", "data", "faqs.json"));

  // Clear existing rows
  console.log("Clearing existing FAQ embeddings...");
  const { error: deleteError } = await supabase
    .from("faq_embeddings")
    .delete()
    .neq("id", "");

  if (deleteError) {
    console.error("Delete error:", deleteError.message);
    process.exit(1);
  }

  // Embed and insert each FAQ
  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i];
    console.log(
      `[${i + 1}/${faqs.length}] Embedding: ${faq.question.slice(0, 50)}...`
    );

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

    // Rate-limit for Voyage free tier
    if (i < faqs.length - 1) {
      await new Promise((r) => setTimeout(r, 25000));
    }
  }

  console.log(`Done! ${faqs.length} FAQs embedded and stored in Supabase.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
