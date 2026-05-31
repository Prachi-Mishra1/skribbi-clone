interface WordPickerProps {
  words: string[]
  onPick: (word: string) => void
}

export default function WordPicker({ words, onPick }: WordPickerProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#1a1a2e', borderRadius: '24px', padding: '40px', textAlign: 'center' as const, border: '2px solid #4f46e5', maxWidth: '480px', width: '90%' }}>
        <h2 style={{ fontFamily: 'Fredoka One', fontSize: '28px', color: '#a5b4fc', marginBottom: '8px' }}>
          Choose a word to draw!
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '28px' }}>Pick one — others will try to guess it</p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
          {words.map((word) => (
            <button key={word} onClick={() => onPick(word)}
              style={{ padding: '16px 24px', borderRadius: '14px', border: '2px solid #2d2d4e', background: '#0f0f1a', color: '#fff', fontSize: '20px', cursor: 'pointer', fontWeight: 800, fontFamily: 'Nunito, sans-serif' }}>
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}