# Skill: Writing Anthropic Tool Definitions

## Structure

Each tool is a JSON object with three required fields:

| Field | Type | Description |
|---|---|---|
| `name` | string | Tool identifier (snake_case) |
| `description` | string | What the tool does — Claude uses this to decide when to call it |
| `input_schema` | object | JSON Schema defining the tool's parameters |

## This Project's Tools
```js
const toolDefinitions = [
  {
    name: "lookup_order",
    description: "Look up a customer's order using their phone number. Call this whenever the customer asks about their booking, collection time, items, driver status, or anything specific to their order. Returns the full order object including status, date, time window, items, and waste location.",
    input_schema: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description: "The customer's UK phone number, e.g. 07700900123. Strip spaces and dashes before passing.",
        },
      },
      required: ["phone"],
    },
  },
  {
    name: "search_knowledge_base",
    description: "Search the FAQ knowledge base for answers to general questions about the business, policies, pricing, or procedures. Call this for any question that is not about the customer's specific order. Returns the most relevant FAQ answer.",
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
```

## Writing Good Descriptions

- **Be specific.** Claude uses the description to decide when to call the tool. Vague descriptions cause incorrect tool selection.
- **State what the tool returns**, not just what it does.
- **Include domain context** (e.g., "junk removal", "UK phone number").
- **Distinguish between the two tools clearly.** `lookup_order` is for order-specific queries. `search_knowledge_base` is for general policy/FAQ queries.

## Input Schema Rules

- Always use `type: "object"` at the top level.
- List all parameters under `properties`.
- Mark mandatory parameters in the `required` array.
- Use `description` on every property — Claude reads these to determine what values to pass.
- Supported types: `string`, `number`, `integer`, `boolean`, `array`, `object`.
- Tool result content must always be a string. Stringify objects: `JSON.stringify(result)`.

## Passing Tools to Claude
```js
const response = await client.messages.create({
  model: "claude-sonnet-4-5-20251022",
  max_tokens: 1024,
  system: systemPrompt,
  tools: toolDefinitions,
  messages: history,
});
```