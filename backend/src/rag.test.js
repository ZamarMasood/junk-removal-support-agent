const { initRAG, searchFAQ } = require("./rag");

async function main() {
  await initRAG();

  console.log("\n--- Test Searches ---\n");

  const queries = [
    "how do I change my collection date",
    "the driver forgot some of my stuff",
    "can I pay by card",
  ];

  for (const query of queries) {
    const result = await searchFAQ(query);
    console.log(`Query:      "${query}"`);
    console.log(`Matched:    ${result.question}`);
    console.log(`Answer:     ${result.answer}`);
    console.log(`Similarity: ${result.similarity.toFixed(4)}`);
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
