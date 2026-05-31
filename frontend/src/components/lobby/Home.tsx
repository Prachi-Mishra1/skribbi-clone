import { useState } from 'react'
import { GameSettings } from '../../types'

interface HomeProps {
  onCreateRoom: (name: string, settings: Partial<GameSettings>, isPrivate: boolean) => void
  onJoinRoom: (name: string, code: string) => void
  error: string
  connected: boolean
}

export default function Home({ onCreateRoom, onJoinRoom, error, connected }: HomeProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [tab, setTab] = useState<'join' | 'create'>('join')
  const [settings, setSettings] = useState<Partial<GameSettings>>({
    maxPlayers: 8, rounds: 3, drawTime: 80, wordCount: 3, hintCount: 2,
  })

  const handleJoin = () => {
    if (!name.trim()) return alert('Enter your name!')
    if (!code.trim()) return alert('Enter a room code!')
    onJoinRoom(name.trim(), code.trim().toUpperCase())
  }

  const handleCreate = () => {
    if (!name.trim()) return alert('Enter your name!')
    onCreateRoom(name.trim(), settings, false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Fredoka One', fontSize: '56px', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎨 skribbl
        </h1>
        <p style={{ color: '#a5b4fc', fontSize: '18px', marginTop: '4px' }}>Draw. Guess. Win!</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', justifyContent: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#22c55e' : '#ef4444' }} />
          <span style={{ fontSize: '13px', color: connected ? '#22c55e' : '#ef4444' }}>
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '460px', border: '1px solid #2d2d4e' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#a5b4fc', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' as const }}>Your Name</label>
          <input
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #2d2d4e', background: '#0f0f1a', color: '#fff', fontSize: '16px', outline: 'none' }}
            placeholder="Enter your name..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['join', 'create'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: tab === t ? '#4f46e5' : '#2d2d4e', color: tab === t ? '#fff' : '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
              {t === 'join' ? '🚪 Join Room' : '➕ Create Room'}
            </button>
          ))}
        </div>

        {tab === 'join' ? (
          <div>
            <input
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #2d2d4e', background: '#0f0f1a', color: '#fff', fontSize: '20px', outline: 'none', textTransform: 'uppercase' as const, letterSpacing: '4px', textAlign: 'center' as const, marginBottom: '16px' }}
              placeholder="ABC123"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button onClick={handleJoin}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', fontSize: '18px', cursor: 'pointer', fontWeight: 800 }}>
              Join Game
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {[
                { label: 'Max Players', key: 'maxPlayers', min: 2, max: 20 },
                { label: 'Rounds', key: 'rounds', min: 1, max: 10 },
                { label: 'Draw Time (s)', key: 'drawTime', min: 15, max: 240 },
                { label: 'Word Choices', key: 'wordCount', min: 1, max: 5 },
              ].map(({ label, key, min, max }) => (
                <div key={key}>
                  <label style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: 700 }}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => setSettings(s => ({ ...s, [key]: Math.max(min, (s[key as keyof typeof s] as number) - 1) }))}
                      style={{ width: 28, height: 28, borderRadius: '6px', border: 'none', background: '#2d2d4e', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>−</button>
                    <span style={{ minWidth: '32px', textAlign: 'center' as const, fontWeight: 800 }}>{settings[key as keyof typeof settings]}</span>
                    <button onClick={() => setSettings(s => ({ ...s, [key]: Math.min(max, (s[key as keyof typeof s] as number) + 1) }))}
                      style={{ width: 28, height: 28, borderRadius: '6px', border: 'none', background: '#2d2d4e', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleCreate}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', fontSize: '18px', cursor: 'pointer', fontWeight: 800 }}>
              Create Room
            </button>
          </div>
        )}

        {error && <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: '#450a0a', color: '#fca5a5', textAlign: 'center' as const, fontWeight: 700 }}>⚠️ {error}</div>}
      </div>
    </div>
  )
}