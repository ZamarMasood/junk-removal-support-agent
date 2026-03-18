# Skill: JSONL Conversation Logging

## Format

Logs are stored in JSONL format — one JSON object per line, append-only. Each line represents one completed conversation turn (one user message + one final agent reply, after all tool calls have resolved).

### Fields

| Field | Type | Description |
|---|---|---|
| `session_id` | string (UUID) | Unique identifier for the conversation session |
| `timestamp` | string (ISO 8601) | When the log entry was written |
| `phone_number` | string or null | Customer phone number — null if not yet collected |
| `user_message` | string | The customer's message that triggered this turn |
| `agent_reply` | string | The final text response from the agent |
| `escalated` | boolean | Whether this reply contains an escalation flag |
| `escalation_reason` | string or null | The reason extracted from [ESCALATE: reason] tag, or null |
| `messages` | array | Full conversation history at time of logging |

### Example log line
```json
{"session_id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","timestamp":"2025-01-15T14:30:00.000Z","phone_number":"07700900123","user_message":"When are you coming?","agent_reply":"Your collection is today between 9am and 11am.","escalated":false,"escalation_reason":null,"messages":[]}
```

## Writing Logs
```js
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "conversations.jsonl");

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logTurn({ sessionId, phoneNumber, userMessage, agentReply, escalated, escalationReason, messages }) {
  ensureLogDir();
  const entry = {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    phone_number: phoneNumber || null,
    user_message: userMessage,
    agent_reply: agentReply,
    escalated: escalated || false,
    escalation_reason: escalationReason || null,
    messages: messages,
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
}
```

## When to Log

**Log ONCE per user message, AFTER the tool loop completes.** This means:

1. User sends a message
2. Claude runs (possibly calling tools multiple times)
3. Claude produces a final text reply
4. You parse the reply for [ESCALATE] tag
5. **Then call `logTurn()` with everything**

Do NOT log after each individual Claude API call inside the tool loop — only log the completed turn.

## Key Points

- **Append-only.** Never overwrite or truncate the log file.
- **One JSON object per line.** No pretty-printing. Each line is a single valid JSON object.
- **Log timing:** After the tool loop completes and the final agent reply is ready — not during.
- **Phone number can be null.** On the first message the customer hasn't given their number yet.
- **Escalation parsing:** Before logging, check if `agentReply` contains `[ESCALATE:` and extract the reason.
- **Create the logs directory** at startup using `fs.mkdirSync` with `{ recursive: true }`.