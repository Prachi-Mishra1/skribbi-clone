import { useState, useRef, useEffect } from 'react'

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  text: string
  type: 'chat' | 'guess' | 'correct' | 'system'
}

export interface Player {
  id: string
  name: string
  score: number
  hasGuessed: boolean
  isDrawer?: boolean
}

interface Props {
  messages: ChatMessage[]
  myPlayer: Player
  isDrawer: boolean
  hasGuessed: boolean
  phase: 'lobby' | 'word_selection' | 'drawing' | 'round_end' | 'game_over'
  onGuess: (text: string) => void
  onChat: (text: string) => void
}

export default function Chat({ messages, myPlayer, isDrawer, hasGuessed, phase, onGuess, onChat }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const canGuess = phase === 'drawing' && !isDrawer && !hasGuessed
  const canChat = isDrawer || phase !== 'drawing'

  function handleSend() {
    const text = input.trim()
    if (!text) return
    if (canGuess) onGuess(text)
    else if (canChat) onChat(text)
    setInput('')
  }

  function msgColor(type: ChatMessage['type']) {
    if (type === 'correct') return '#22c55e'
    if (type === 'system') return '#a5b4fc'
    if (type === 'guess') return '#fbbf24'
    return '#e2e8f0'
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #2d2d4e', fontFamily: 'Fredoka One', color: '#a5b4fc', fontSize: '16px' }}>
        💬 Chat
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {messages.length === 0 && (
          <span style={{ color: '#4b5563', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
            No messages yet...
          </span>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ fontSize: '13px', lineHeight: '1.4' }}>
            {msg.type === 'system' || msg.type === 'correct' ? (
              <span style={{ color: msgColor(msg.type), fontStyle: 'italic' }}>{msg.text}</span>
            ) : (
              <span>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>{msg.playerName}: </span>
                <span style={{ color: msgColor(msg.type) }}>{msg.text}</span>
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '10px', borderTop: '1px solid #2d2d4e', display: 'flex', gap: '6px' }}>
        {hasGuessed && !isDrawer ? (
          <div style={{ flex: 1, padding: '8px', background: '#0f0f1a', borderRadius: '8px', color: '#22c55e', fontSize: '13px', textAlign: 'center' }}>
            ✅ Guessed it!
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={canGuess ? '🔤 Type your guess...' : canChat ? '💬 Chat...' : '⏳ Wait...'}
              disabled={!canGuess && !canChat}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: '8px',
                border: '1px solid #2d2d4e', background: '#0f0f1a',
                color: '#fff', fontSize: '13px', outline: 'none',
                opacity: (!canGuess && !canChat) ? 0.5 : 1
              }}
            />
            <button
              onClick={handleSend}
              disabled={!canGuess && !canChat}
              style={{
                padding: '8px 12px', borderRadius: '8px', border: 'none',
                background: canGuess ? '#4f46e5' : '#374151',
                color: '#fff',
                cursor: (!canGuess && !canChat) ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              ➤
            </button>
          </div>
        )}
      </div>
    </div>
  )
}