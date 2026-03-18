import { useState, useRef, useEffect } from 'react'
import './App.css'

const initialMessage = {
  id: crypto.randomUUID(),
  role: 'assistant',
  content: "Hi! I'm Zamar from ClearAway. To get started, could I have your phone number please?",
  timestamp: new Date().toISOString(),
  escalated: false,
  escalationReason: null,
}

function App() {
  const [sessionId] = useState(() => crypto.randomUUID())
  const [messages, setMessages] = useState([initialMessage])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function autoResizeTextarea() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  async function sendMessage() {
    if (!inputValue.trim() || isLoading) return

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userMessage: userMsg.content }),
      })

      const data = await res.json()

      const assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        escalated: data.escalated || false,
        escalationReason: data.escalationReason || null,
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch {
      const errorMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
        escalated: false,
        escalationReason: null,
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="app">
      <div className="chat-container">
        <header className="header">
          <div className="header-left">
            <div className="logo-mark">C</div>
            <span className="logo-text">ClearAway</span>
          </div>
          <div className="header-right">
            <div className="agent-badge">
              <div className="agent-avatar">Z</div>
              <div className="agent-info">
                <span className="agent-name">Zamar</span>
                <div className="agent-status">
                  <span className="online-dot" />
                  <span className="status-text">Online</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="message-list">
          {messages.map((msg, i) => {
            const prevMsg = messages[i - 1]
            const sameSender = prevMsg && prevMsg.role === msg.role
            return (
              <div key={msg.id}>
                <div
                  className={`message-row ${msg.role === 'user' ? 'message-row-user' : 'message-row-assistant'} ${sameSender ? 'same-sender' : ''}`}
                >
                  <div className="bubble-wrapper">
                    {msg.role === 'assistant' && (
                      <div className="bubble-avatar">Z</div>
                    )}
                    <div className={`bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}`}>
                      {msg.content}
                    </div>
                  </div>
                  <span className={`timestamp ${msg.role === 'user' ? 'timestamp-user' : 'timestamp-assistant'}`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                {msg.escalated && (
                  <div className="escalation-banner">
                    <span className="escalation-icon">&#9888;</span>
                    <div>
                      <div className="escalation-title">Flagged for human review</div>
                      {msg.escalationReason && (
                        <div className="escalation-reason">{msg.escalationReason}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && (
            <div className="message-row message-row-assistant">
              <div className="typing-row">
                <div className="bubble-avatar">Z</div>
                <div className="bubble bubble-assistant typing-indicator">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Type your message..."
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value)
              autoResizeTextarea()
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        <div className="powered-by">
          Powered by <span>ClearAway</span>
        </div>
      </div>
    </div>
  )
}

export default App
