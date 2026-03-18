# Skill: Calling the Anthropic Claude API with Tool Use

## SDK Setup
```js
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
```

## Message Format

Every call to `client.messages.create()` requires:
```js
const response = await client.messages.create({
  model: "claude-sonnet-4-5-20251022",  // always use this exact string
  max_tokens: 1024,
  system: systemPrompt,   // top-level field — NEVER put system inside messages array
  tools: toolDefinitions,
  messages: conversationHistory,
});
```

### Message structure

Messages alternate between `user` and `assistant` roles. The system prompt is NOT a message — it is a separate top-level parameter.
```js
// User message (plain text)
{ role: "user", content: "How much does sofa removal cost?" }

// Assistant message (text only)
{ role: "assistant", content: [{ type: "text", text: "Let me look that up." }] }

// Assistant message (with tool use)
{
  role: "assistant",
  content: [
    { type: "text", text: "Let me check your order." },
    { type: "tool_use", id: "toolu_abc123", name: "lookup_order", input: { phone: "07700900123" } }
  ]
}

// Tool result (always sent as a user message immediately after tool_use)
{
  role: "user",
  content: [
    { type: "tool_result", tool_use_id: "toolu_abc123", content: JSON.stringify(orderData) }
  ]
}
```

## The Tool Use Loop

After every Claude response, check `stop_reason`. If it is `"tool_use"`, execute all tool_use blocks, append results, and call Claude again. Repeat until `stop_reason` is `"end_turn"`.
```js
async function chat(conversationHistory, systemPrompt, tools) {
  let response = await client.messages.create({
    model: "claude-sonnet-4-5-20251022",
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages: conversationHistory,
  });

  // Loop while Claude wants to use tools
  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(b => b.type === "tool_use");

    // Append the full assistant response (includes tool_use blocks)
    conversationHistory.push({ role: "assistant", content: response.content });

    // Execute each tool and collect results
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeToolCall(toolUse.name, toolUse.input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,         // must match exactly
        content: typeof result === "string" ? result : JSON.stringify(result),
      });
    }

    // Append all tool results as a single user message
    conversationHistory.push({ role: "user", content: toolResults });

    // Call Claude again with updated history
    response = await client.messages.create({
      model: "claude-sonnet-4-5-20251022",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: conversationHistory,
    });
  }

  // Final text response — append to history and return
  conversationHistory.push({ role: "assistant", content: response.content });
  return response;
}
```

## Extracting the Final Text
```js
const finalText = response.content
  .filter(b => b.type === "text")
  .map(b => b.text)
  .join("");
```

## Key Points

- **Model string:** Always use `claude-sonnet-4-5-20251022`. Never guess or abbreviate.
- **System prompt:** Top-level field only. Never add it as a message inside the messages array.
- **Always pass full conversation history.** Claude is stateless — every call needs all prior messages.
- **stop_reason:** `"tool_use"` = run tools and call again. `"end_turn"` = final response ready.
- **tool_use_id:** Must match exactly between the `tool_use` block and the `tool_result`.
- **Tool result content:** Must be a string. Stringify objects before passing.
- **Never hardcode API keys.** Use `ANTHROPIC_API_KEY` from `.env`.