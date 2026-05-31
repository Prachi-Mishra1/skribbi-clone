import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { GameState, Player, ChatMessage } from './types'
import GameScreen from './components/game/GameScreen'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

const defaultState: GameState = {
  screen: 'home',
  roomId: '',
  roomCode: '',
  player: null,
  players: [],
  settings: { maxPlayers: 8, rounds: 3, drawTime: 80, wordCount: 3, hintCount: 2 },
  phase: 'lobby',
  round: 1,
  totalRounds: 3,
  drawerId: '',
  drawerName: '',
  currentWord: null,
  hint: '',
  timeLeft: 0,
  chatMessages: [],
  wordOptions: [],
  lastRoundWord: '',
  winner: null,
  leaderboard: []
}

export default function App() {
  const [state, setState] = useState<GameState>(defaultState)
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const gameScreenRef = useRef<any>(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => console.log('Connected:', socket.id))

    socket.on('room_created', ({ roomId, roomCode, player }: any) => {
      setState(prev => ({ ...prev, roomId, roomCode, player, screen: 'lobby' }))
    })

    socket.on('room_joined', ({ roomId, roomCode, player }: any) => {
      setState(prev => ({ ...prev, roomId, roomCode, player, screen: 'lobby' }))
    })

    socket.on('game_state', (data: any) => {
      setState(prev => ({
        ...prev,
        ...data,
        player: prev.player,
        chatMessages: data.chatMessages ?? prev.chatMessages
      }))
    })

    socket.on('player_joined', ({ players }: any) => {
      setState(prev => ({ ...prev, players }))
    })

    socket.on('player_left', ({ players }: any) => {
      setState(prev => ({ ...prev, players }))
    })

    socket.on('chat_message', (msg: any) => {
      setState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, {
          ...msg,
          type: msg.type === 'correct_guess' ? 'correct' : msg.type
        }]
      }))
    })

    socket.on('time_update', ({ timeLeft }: any) => {
      setState(prev => ({ ...prev, timeLeft }))
    })

    socket.on('hint_update', ({ hint }: any) => {
      setState(prev => ({ ...prev, hint }))
    })

    socket.on('draw_data', (data: any) => {
      gameScreenRef.current?.receiveDrawData(data)
    })

    socket.on('canvas_cleared', () => {
      gameScreenRef.current?.clearCanvas()
    })

    socket.on('draw_undo', ({ strokes }: any) => {
      gameScreenRef.current?.undoStrokes(strokes)
    })

    socket.on('error', ({ message }: any) => {
      setError(message)
    })

    return () => { socket.disconnect() }
  }, [])

  function createRoom() {
    if (!playerName.trim()) { setError('Enter your name'); return }
    setError('')
    socketRef.current?.emit('create_room', {
      playerName: playerName.trim(),
      settings: state.settings
    })
  }

  function joinRoom() {
    if (!playerName.trim()) { setError('Enter your name'); return }
    if (!roomCode.trim()) { setError('Enter room code'); return }
    setError('')
    socketRef.current?.emit('join_room', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim()
    })
  }

  function startGame() {
    socketRef.current?.emit('start_game')
  }

  // ─── Home Screen ───────────────────────────────────────────────────────────
  if (state.screen === 'home') {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1a1a2e', padding: '40px', borderRadius: '16px', width: '360px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h1 style={{ textAlign: 'center', fontFamily: 'Fredoka One', fontSize: '36px', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            🎨 skribbl
          </h1>
          {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}
          <input
            placeholder="Your name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #2d2d4e', background: '#0f0f1a', color: '#fff', fontSize: '16px' }}
          />
          <button onClick={createRoom}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', fontSize: '16px', cursor: 'pointer', fontWeight: 700 }}>
            Create Room
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              placeholder="Room code"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value)}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #2d2d4e', background: '#0f0f1a', color: '#fff', fontSize: '16px' }}
            />
            <button onClick={joinRoom}
              style={{ padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontSize: '16px', cursor: 'pointer', fontWeight: 700 }}>
              Join
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Lobby Screen ──────────────────────────────────────────────────────────
  if (state.screen === 'lobby') {
    const isHost = state.player?.isHost
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1a1a2e', padding: '40px', borderRadius: '16px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ color: '#a5b4fc', fontFamily: 'Fredoka One', fontSize: '24px', margin: 0 }}>🎮 Lobby</h2>
          <div style={{ background: '#0f0f1a', padding: '10px 16px', borderRadius: '8px', color: '#c084fc', fontSize: '18px', fontWeight: 700, letterSpacing: '4px', textAlign: 'center' }}>
            {state.roomCode}
          </div>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, textAlign: 'center' }}>Share this code with friends</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {state.players.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#2d2d4e', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '20px' }}>{p.avatar}</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{p.name}</span>
                {p.isHost && <span style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: '12px' }}>HOST</span>}
              </div>
            ))}
          </div>
          {isHost && (
            <button onClick={startGame}
              disabled={state.players.length < 2}
              style={{ padding: '14px', borderRadius: '8px', border: 'none', background: state.players.length < 2 ? '#374151' : '#4f46e5', color: '#fff', fontSize: '16px', cursor: state.players.length < 2 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
              {state.players.length < 2 ? 'Need 2+ players' : '🚀 Start Game'}
            </button>
          )}
          {!isHost && (
            <p style={{ color: '#6b7280', textAlign: 'center', margin: 0 }}>⏳ Waiting for host to start...</p>
          )}
        </div>
      </div>
    )
  }

  // ─── Game Screen ───────────────────────────────────────────────────────────
  return (
    <GameScreen
      ref={gameScreenRef}
      state={state}
      socket={socketRef.current!}
    />
  )
}