import { Player } from '../../types'

interface PlayerListProps {
  players: Player[]
  myPlayer: Player
  phase: string
}

export default function PlayerList({ players, myPlayer, phase }: PlayerListProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, background: '#1a1a2e', borderRadius: '16px', overflow: 'hidden', border: '1px solid #2d2d4e', height: '100%' }}>
      <div style={{ padding: '12px 16px', background: '#0f0f1a', fontWeight: 800, fontSize: '14px', color: '#a5b4fc', borderBottom: '1px solid #2d2d4e' }}>
        🏆 Players
      </div>
      <div style={{ flex: 1, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: '4px', padding: '8px' }}>
        {sorted.map((p, idx) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '10px',
            borderLeft: p.isDrawing ? '3px solid #4f46e5' : '3px solid transparent',
            background: p.id === myPlayer.id ? '#1e1e3a' : '#0f0f1a',
          }}>
            <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: 800, minWidth: '20px' }}>#{idx + 1}</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#fff', flexShrink: 0 }}>
              {p.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {p.name} {p.id === myPlayer.id && <span style={{ color: '#4f46e5', fontSize: '10px' }}>●</span>}
              </div>
              <div style={{ color: '#818cf8', fontSize: '12px', fontWeight: 700 }}>{p.score} pts</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '2px' }}>
              {p.isHost && <span>👑</span>}
              {p.isDrawing && phase === 'drawing' && <span>✏️</span>}
              {p.hasGuessed && !p.isDrawing && <span>✅</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}