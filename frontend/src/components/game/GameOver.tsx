import { Player } from '../../types'

interface GameOverProps {
  winner: Player | null
  leaderboard: Player[]
  myPlayer: Player
  onPlayAgain: () => void
}

export default function GameOver({ winner, leaderboard, myPlayer, onPlayAgain }: GameOverProps) {
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#1a1a2e', borderRadius: '24px', padding: '36px', width: '90%', maxWidth: '460px', border: '2px solid #4f46e5', textAlign: 'center' as const }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
        <h1 style={{ fontFamily: 'Fredoka One', fontSize: '36px', color: '#a5b4fc', marginBottom: '20px' }}>Game Over!</h1>

        {winner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#0f0f1a', borderRadius: '16px', padding: '16px 24px', marginBottom: '20px', border: '1px solid #f59e0b44' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: winner.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff' }}>
              {winner.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '22px' }}>{winner.name}</div>
              <div style={{ color: '#f59e0b', fontWeight: 700 }}>{winner.score} points 🏆</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '24px' }}>
          {leaderboard.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px',
              background: p.id === myPlayer.id ? '#1e1e40' : '#0f0f1a',
              borderLeft: i === 0 ? '3px solid #f59e0b' : '3px solid transparent',
            }}>
              <span style={{ fontSize: '20px', minWidth: '30px' }}>{medals[i] || `#${i + 1}`}</span>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                {p.name[0].toUpperCase()}
              </div>
              <span style={{ flex: 1, fontWeight: 700 }}>{p.name}</span>
              {p.id === myPlayer.id && <span style={{ padding: '2px 8px', borderRadius: '99px', background: '#4f46e5', color: '#fff', fontSize: '11px', fontWeight: 800 }}>You</span>}
              <span style={{ color: '#818cf8', fontWeight: 800 }}>{p.score} pts</span>
            </div>
          ))}
        </div>

        <button onClick={onPlayAgain}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#fff', fontSize: '18px', cursor: 'pointer', fontWeight: 800 }}>
          🏠 Back to Home
        </button>
      </div>
    </div>
  )
}