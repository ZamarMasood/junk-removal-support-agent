require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { initRAG } = require('./rag');
const { toolDefinitions, runTool } = require('./tools');
const { systemPrompt } = require('./systemPrompt');
const supabase = require('./supabaseClient');

const app = express();
app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], methods: ['GET', 'POST'] }));
const client = new Anthropic();

// --- SESSION STORE ---
const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { messages: [], phoneNumber: null });
  }
  return sessions.get(sessionId);
}

// --- LOGGING ---
async function logTurn({ sessionId, phoneNumber, userMessage, agentReply, escalated, escalationReason, messages }) {
  const { error } = await supabase.from('conversations').insert({
    session_id: sessionId,
    phone_number: phoneNumber || null,
    user_message: userMessage,
    agent_reply: agentReply,
    escalated: escalated || false,
    escalation_reason: escalationReason || null,
    messages: messages
  });
  if (error) {
    console.error('Failed to log conversation:', error.message);
  }
}

// --- ROUTES ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ragReady: true, timestamp: new Date().toISOString() });
});

app.post('/chat', async (req, res) => {
  try {
    const { sessionId, userMessage } = req.body;
    if (!sessionId || !userMessage) {
      return res.status(400).json({ error: 'sessionId and userMessage are required' });
    }

    const session = getSession(sessionId);

    // Extract phone number
    const phoneMatch = userMessage.match(/(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}/);
    if (phoneMatch && session.phoneNumber === null) {
      session.phoneNumber = phoneMatch[0].replace(/\s/g, '');
    }

    // Append user message
    session.messages.push({ role: 'user', content: userMessage });

    // Tool use loop
    let response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      tools: toolDefinitions,
      messages: session.messages
    });

    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

      session.messages.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        const result = await runTool(toolUse.name, toolUse.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result
        });
      }

      session.messages.push({ role: 'user', content: toolResults });

      response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        tools: toolDefinitions,
        messages: session.messages
      });
    }

    session.messages.push({ role: 'assistant', content: response.content });

    // Extract final text
    const finalText = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    // Parse escalation
    const escalated = finalText.includes('[ESCALATE:');
    let escalationReason = null;
    if (escalated) {
      const match = finalText.match(/\[ESCALATE:\s*(.+?)\]/);
      if (match) escalationReason = match[1].trim();
    }

    // Log the turn
    await logTurn({
      sessionId,
      phoneNumber: session.phoneNumber,
      userMessage,
      agentReply: finalText,
      escalated,
      escalationReason,
      messages: session.messages
    });

    res.json({ reply: finalText, escalated, escalationReason, sessionId });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
});

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 3001;

async function startServer() {
  console.log('Initialising RAG pipeline — please wait...');
  await initRAG();
  app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
  });
}

startServer();
