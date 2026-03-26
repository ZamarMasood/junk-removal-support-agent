const { searchFAQ } = require("./rag");
const supabase = require("./supabaseClient");

const toolDefinitions = [
  {
    name: "lookup_order",
    description:
      "Look up a customer's order using their phone number. Call this whenever the customer asks about their booking, collection time, items, driver status, or anything specific to their order. Returns the full order object including status, date, time window, items, and waste location.",
    input_schema: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description:
            "The customer's UK phone number, e.g. 07700900123. Strip spaces and dashes before passing.",
        },
      },
      required: ["phone"],
    },
  },
  {
    name: "search_knowledge_base",
    description:
      "Search the FAQ knowledge base for answers to general questions about the business, policies, pricing, or procedures. Call this for any question that is not about the customer's specific order. Returns the most relevant FAQ answer.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The customer's question, in their own words.",
        },
      },
      required: ["query"],
    },
  },
];

function normalizePhone(raw) {
  let phone = raw.replace(/[\s\-\(\)]/g, "");
  if (phone.startsWith("+44")) {
    phone = "0" + phone.slice(3);
  }
  return phone;
}

async function runTool(toolName, toolInput) {
  if (toolName === "lookup_order") {
    const inputPhone = normalizePhone(toolInput.phone);

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*");

    if (error) {
      return JSON.stringify({ error: "Failed to look up orders: " + error.message });
    }

    const order = orders.find(
      (o) => normalizePhone(o.phone) === inputPhone
    );

    if (order) {
      // Map snake_case back to camelCase for the AI prompt
      return JSON.stringify({
        id: order.id,
        customerName: order.customer_name,
        phone: order.phone,
        collectionDate: order.collection_date,
        timeWindow: order.time_window,
        status: order.status,
        items: order.items,
        wasteLocation: order.waste_location,
        floorNumber: order.floor_number,
        hasLift: order.has_lift,
        notes: order.notes,
      });
    }
    return JSON.stringify({
      error:
        "No order found for this phone number. Please check the number and try again.",
    });
  }

  if (toolName === "search_knowledge_base") {
    const result = await searchFAQ(toolInput.query);
    return JSON.stringify({
      question: result.question,
      answer: result.answer,
      relevance: result.similarity,
    });
  }

  return JSON.stringify({ error: "Unknown tool: " + toolName });
}

module.exports = { toolDefinitions, runTool };
