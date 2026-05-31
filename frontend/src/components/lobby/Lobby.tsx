import { Player, GameSettings } from '../../types'

interface LobbyProps {
  players: Player[]
  myPlayer: Player
  roomCode: string
  settings: GameSettings
  onStartGame: () => void
}

export default function Lobby({ players, myPlayer, roomCode, settings, onStartGame }: LobbyProps) {
  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    alert('Room code copied!')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: '20px' }}>
      <h1 style={{ fontFamily: 'Fredoka One', fontSize: '40px', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        🎨 skribbl
      </h1>

      <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '800px', flexWrap: 'wrap' as const }}>
        <div style={{ background: '#1a1a2e', borderRadius: '20px', padding: '24px', flex: 1, minWidth: '280px', border: '1px solid #2d2d4e' }}>
          <p style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: '12px' }}>Room Code</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0f0f1a', borderRadius: '12px', padding: '12px 16px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'Fredoka One', fontSize: '32px', letterSpacing: '6px', color: '#818cf8', flex: 1 }}>{roomCode}</span>
            <button onClick={copyCode}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#2d2d4e', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
              📋 Copy
            </button>
          </div>

          <p style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' as const, margin: '20px 0 12px' }}>Settings</p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
            {[
              ['👥 Players', `${players.length}/${settings.maxPlayers}`],
              ['🔄 Rounds', settings.rounds],
              ['⏱ Draw Time', `${settings.drawTime}s`],
              ['📝 Word Choices', settings.wordCount],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f0f1a', borderRadius: '8px', fontSize: '14px' }}>
                <span>{label}</span><span>{value}</span>
              </div>
            ))}
          </div>

          {myPlayer.isHost ? (
            <button onClick={onStartGame} disabled={players.length < 2}
              style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: players.length < 2 ? '#1a3a1a' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontSize: '20px', cursor: players.length < 2 ? 'not-allowed' : 'pointer', marginTop: '20px', fontWeight: 800 }}>
              {players.length < 2 ? '⏳ Need 2+ players' : '🚀 Start Game!'}
            </button>
          ) : (
            <div style={{ textAlign: 'center' as const, color: '#6b7280', padding: '16px', marginTop: '16px', background: '#0f0f1a', borderRadius: '10px' }}>
              ⏳ Waiting for host to start...
            </div>
          )}
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: '20px', padding: '24px', flex: 1, minWidth: '280px', border: '1px solid #2d2d4e' }}>
          <p style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: '12px' }}>Players ({players.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {players.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#0f0f1a', borderRadius: '10px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: '#fff' }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span style={{ flex: 1, fontWeight: 700 }}>{p.name}</span>
                {p.id === myPlayer.id && <span style={{ padding: '2px 8px', borderRadius: '99px', background: '#4f46e5', color: '#fff', fontSize: '11px', fontWeight: 800 }}>You</span>}
                {p.isHost && <span style={{ fontSize: '16px' }}>👑</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}