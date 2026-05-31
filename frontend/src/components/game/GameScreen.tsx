import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import Canvas, { CanvasHandle } from '../Canvas/Canvas'
import Chat from '../Chat/Chat'
import PlayerList from './PlayerList'
import WordPicker from './WordPicker'
import GameOver from './GameOver'
import { GameState } from '../../types'

interface Props {
  state: GameState
  socket: any
  canvasRef?: any
}

const COLORS = ['#000000','#FFFFFF','#FF0000','#FF6B00','#FFD700','#00CC00','#0066FF','#8B00FF','#FF69B4','#8B4513','#808080','#00FFFF']

const GameScreen = forwardRef<any, Props>(({ state, socket }, externalRef) => {
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(6)
  const [tool, setTool] = useState<'pen'|'eraser'>('pen')
  const canvasRef = useRef<CanvasHandle>(null)
  const myPlayer = state.player!
  const isDrawer = state.drawerId === myPlayer.id

  // Expose canvas methods to App.tsx via gameScreenRef
  useImperativeHandle(externalRef, () => ({
    clearCanvas: () => canvasRef.current?.clearCanvas(),
    receiveDrawData: (d: any) => canvasRef.current?.receiveDrawData(d),
    undoStrokes: (s: any[]) => canvasRef.current?.undoStrokes(s),
  }))

  // Socket listeners for drawing
  useEffect(() => {
    function onDrawData(data: any) {
      canvasRef.current?.receiveDrawData(data)
    }
    function onCanvasCleared() {
      canvasRef.current?.clearCanvas()
    }
    function onDrawUndo(data: { strokes: any[] }) {
      canvasRef.current?.undoStrokes(data.strokes)
    }
    socket.on('draw_data', onDrawData)
    socket.on('canvas_cleared', onCanvasCleared)
    socket.on('draw_undo', onDrawUndo)
    return () => {
      socket.off('draw_data', onDrawData)
      socket.off('canvas_cleared', onCanvasCleared)
      socket.off('draw_undo', onDrawUndo)
    }
  }, [socket])

  // Clear canvas on new round
  useEffect(() => {
    canvasRef.current?.clearCanvas()
  }, [state.round])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f1a' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#1a1a2e', borderBottom: '1px solid #2d2d4e', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'Fredoka One', fontSize: '24px', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎨 skribbl
        </span>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ background: '#4f46e5', color: '#fff', padding: '4px 12px', borderRadius: '99px', fontSize: '13px', fontWeight: 800 }}>
            Round {state.round}/{state.totalRounds}
          </span>

          {state.phase === 'drawing' && (
            isDrawer
              ? <span style={{ color: '#a5b4fc' }}>Drawing: <strong style={{ color: '#f59e0b' }}>{state.currentWord}</strong></span>
              : <span style={{ fontFamily: 'Fredoka One', fontSize: '22px', letterSpacing: '6px', color: '#fff' }}>{state.hint}</span>
          )}

          {state.phase === 'word_selection' && (
            <span style={{ color: '#6b7280' }}>
              {isDrawer ? '👆 Pick a word below!' : `⏳ ${state.drawerName} is choosing...`}
            </span>
          )}

          {state.phase === 'round_end' && (
            <span style={{ fontSize: '18px', color: '#fff' }}>
              Word was: <strong style={{ color: '#f59e0b' }}>{state.lastRoundWord}</strong>
            </span>
          )}
        </div>

        {state.phase === 'drawing' && (
          <span style={{ fontFamily: 'Fredoka One', fontSize: '24px', color: (state.timeLeft ?? 99) <= 10 ? '#ef4444' : '#22c55e' }}>
            ⏱ {state.timeLeft ?? '--'}s
          </span>
        )}
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', gap: '8px', padding: '10px', minHeight: 0 }}>

        {/* Players sidebar */}
        <div style={{ width: '160px', flexShrink: 0 }}>
          <PlayerList players={state.players} myPlayer={myPlayer} phase={state.phase} />
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Toolbar - only drawer sees it */}
          {isDrawer && state.phase === 'drawing' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', background: '#1a1a2e', padding: '10px', borderRadius: '12px' }}>

              <button onClick={() => setTool('pen')}
                style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: tool === 'pen' ? '#4f46e5' : '#2d2d4e', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>
                ✏️
              </button>

              <button onClick={() => setTool('eraser')}
                style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: tool === 'eraser' ? '#4f46e5' : '#2d2d4e', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>
                🧹
              </button>

              {[3, 6, 12, 20].map(s => (
                <button key={s} onClick={() => setSize(s)}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${size === s ? '#4f46e5' : '#3d3d5e'}`, background: '#2d2d4e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: Math.min(s * 1.2, 22), height: Math.min(s * 1.2, 22), borderRadius: '50%', background: color }} />
                </button>
              ))}

              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => { setColor(c); setTool('pen') }}
                    style={{ width: 24, height: 24, borderRadius: '4px', border: `2px solid ${color === c ? '#fff' : 'transparent'}`, background: c, cursor: 'pointer' }} />
                ))}
              </div>

              <button onClick={() => socket.emit('draw_undo')}
                style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#2d2d4e', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>
                ↩️
              </button>

              <button onClick={() => { socket.emit('canvas_clear'); canvasRef.current?.clearCanvas() }}
                style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#7f1d1d', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>
                🗑️
              </button>
            </div>
          )}

          {/* Canvas wrapper */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Canvas
              ref={canvasRef}
              isDrawer={isDrawer && state.phase === 'drawing'}
              color={color}
              size={size}
              tool={tool}
              onDrawStart={d => socket.emit('draw_start', d)}
              onDrawMove={d => socket.emit('draw_move', d)}
              onDrawEnd={() => socket.emit('draw_end')}
              onClear={() => { socket.emit('canvas_clear'); canvasRef.current?.clearCanvas() }}
              onUndo={() => socket.emit('draw_undo')}
            />

            {/* Overlay when waiting for word selection */}
            {state.phase === 'word_selection' && !isDrawer && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(15,15,26,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '12px', flexDirection: 'column', gap: '12px'
              }}>
                <span style={{ fontSize: '40px' }}>⏳</span>
                <span style={{ color: '#a5b4fc', fontSize: '20px', fontFamily: 'Fredoka One' }}>
                  {state.drawerName} is choosing a word...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div style={{ width: '240px', flexShrink: 0 }}>
          <Chat
            messages={state.chatMessages}
            myPlayer={myPlayer}
            isDrawer={isDrawer}
            hasGuessed={myPlayer.hasGuessed}
            phase={state.phase}
            onGuess={text => socket.emit('guess', { text })}
            onChat={text => socket.emit('chat', { text })}
          />
        </div>
      </div>

      {/* Word picker modal */}
      {state.phase === 'word_selection' && isDrawer && state.wordOptions && state.wordOptions.length > 0 && (
        <WordPicker
          words={state.wordOptions}
          onPick={word => socket.emit('word_chosen', { word })}
        />
      )}

      {/* Game over */}
      {state.phase === 'game_over' && (
        <GameOver
          winner={state.winner}
          leaderboard={state.leaderboard}
          myPlayer={myPlayer}
          onPlayAgain={() => window.location.reload()}
        />
      )}
    </div>
  )
})

GameScreen.displayName = 'GameScreen'
export default GameScreen